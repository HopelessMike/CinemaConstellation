"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { Star } from "./Star";
import { ClusterSphere } from "./ClusterSphere";
import { movieStore } from "@/lib/movieStore";
import { Movie, MovieCluster } from "@/lib/types";
import * as THREE from "three";

interface StarFieldProps {
  onStarClick: (movie: Movie) => void;
  forceLOD?: "auto" | "high" | "medium" | "low";
  showClusters?: boolean;
  showParticles?: boolean;
  autoRotate?: boolean;
  /** Film selezionato dalla barra di ricerca verso cui “volare” con la camera */
  focusMovie?: Movie | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Anti-overlap stelle (repulsione intra-cluster + clamp nel raggio del cluster)
   ───────────────────────────────────────────────────────────────────────────── */
function computeSeparatedPositions(
  movies: Movie[],
  clustersById: Map<number, Pick<MovieCluster, "center" | "radius">>,
  baseMinDist = 1.4,
  iterations = 2
): Map<number, [number, number, number]> {
  if (movies.length === 0) return new Map();

  const pos: Array<[number, number, number]> = movies.map((m) => {
    const p = (m.position as [number, number, number]) ?? [m.x, m.y, m.z];
    return [p[0], p[1], p[2]];
  });

  const radii = movies.map((m) => Math.max(baseMinDist, (m.size || 0.6) * 1.4));
  const cellSize = baseMinDist;
  const keyFor = (x: number, y: number, z: number) =>
    `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`;

  const getClusterInfo = (m: Movie) => clustersById.get((m as any).cluster_id);

  for (let it = 0; it < iterations; it++) {
    const grid = new Map<string, number[]>();
    for (let i = 0; i < pos.length; i++) {
      const p = pos[i];
      const key = keyFor(p[0], p[1], p[2]);
      const b = grid.get(key);
      if (b) b.push(i);
      else grid.set(key, [i]);
    }

    for (let i = 0; i < pos.length; i++) {
      const mi = movies[i];
      const infoI = getClusterInfo(mi);
      const p = pos[i];

      const cx = Math.floor(p[0] / cellSize);
      const cy = Math.floor(p[1] / cellSize);
      const cz = Math.floor(p[2] / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
            if (!bucket) continue;

            for (const j of bucket) {
              if (j <= i) continue;

              const mj = movies[j];
              if ((mi as any).cluster_id !== (mj as any).cluster_id) continue;

              const pi = pos[i];
              const pj = pos[j];
              let vx = pj[0] - pi[0];
              let vy = pj[1] - pi[1];
              let vz = pj[2] - pi[2];
              const d2 = vx * vx + vy * vy + vz * vz;

              const minD = radii[i] + radii[j];
              const minD2 = minD * minD;

              if (d2 > 0 && d2 < minD2) {
                const d = Math.sqrt(d2);
                const nx = vx / d, ny = vy / d, nz = vz / d;
                const overlap = (minD - d) * 0.5;
                const push = Math.min(overlap, baseMinDist * 0.6);

                pi[0] -= nx * push; pi[1] -= ny * push; pi[2] -= nz * push;
                pj[0] += nx * push; pj[1] += ny * push; pj[2] += nz * push;
              } else if (d2 === 0) {
                const angle = Math.random() * Math.PI * 2;
                const push = baseMinDist * 0.5;
                pi[0] -= Math.cos(angle) * push; pi[2] -= Math.sin(angle) * push;
                pj[0] += Math.cos(angle) * push; pj[2] += Math.sin(angle) * push;
              }
            }
          }
        }
      }

      if (infoI) {
        const [cx0, cy0, cz0] = infoI.center;
        const rx = p[0] - cx0, ry = p[1] - cy0, rz = p[2] - cz0;
        const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz);
        const margin = Math.max(0.08 * infoI.radius, baseMinDist * 0.5);
        const limit = Math.max(infoI.radius - margin, 0.01);
        if (rLen > limit) {
          const s = limit / rLen;
          p[0] = cx0 + rx * s;
          p[1] = cy0 + ry * s;
          p[2] = cz0 + rz * s;
        }
      }
    }
  }

  const map = new Map<number, [number, number, number]>();
  for (let i = 0; i < movies.length; i++) map.set(movies[i].id, pos[i]);
  return map;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scoring cluster + subset con dedup griglia per calcoli di priorità
   ───────────────────────────────────────────────────────────────────────────── */
function estimateScreenRadius(
  camera: THREE.PerspectiveCamera,
  clusterRadius: number,
  distance: number
) {
  const f = Math.tan((camera.fov * Math.PI) / 360);
  return (clusterRadius / Math.max(distance, 0.001)) / f;
}

function computeClusterScores(
  clusters: MovieCluster[],
  camera: THREE.PerspectiveCamera
) {
  const camPos = camera.position;
  return clusters.map((c) => {
    const d = new THREE.Vector3(...c.center).distanceTo(camPos);
    const sr = estimateScreenRadius(camera, c.radius, d);
    const density = Math.log10((c.movies?.length ?? 1) + 1) * 0.25;
    return { id: c.id, cluster: c, score: sr + density, distance: d };
  });
}

function pickClustersSubset(
  clusters: MovieCluster[],
  camera: THREE.Camera,
  maxCount: number
) {
  const persp = camera as THREE.PerspectiveCamera;
  const dedupCell = 0.2; // NDC grid size

  const scored = computeClusterScores(clusters, persp).sort((a, b) => b.score - a.score);

  const taken = new Set<string>();
  const res: MovieCluster[] = [];

  for (const s of scored) {
    if (res.length >= maxCount) break;
    const v = new THREE.Vector3(...s.cluster.center).project(camera);
    const gx = Math.floor((v.x + 1) / dedupCell);
    const gy = Math.floor((v.y + 1) / dedupCell);
    const key = `${gx},${gy}`;
    if (!taken.has(key)) {
      taken.add(key);
      res.push(s.cluster);
    }
  }
  return res;
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENTE
   ───────────────────────────────────────────────────────────────────────────── */
export function StarField({
  onStarClick,
  forceLOD = "auto",
  showClusters = true,
  showParticles = true,
  autoRotate = false,
  focusMovie = null,
}: StarFieldProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [appState, setAppState] = useState(movieStore.getState());
  const [levelOfDetail, setLevelOfDetail] = useState<"high" | "medium" | "low">("medium");

  // Target camera & target lookAt per i voli dolci
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const lookAtRef = useRef<THREE.Vector3 | null>(null);

  // Cluster stabilizzati e adattamento FPS
  const [activeClusterIds, setActiveClusterIds] = useState<Set<number>>(new Set());
  const lastUpdateRef = useRef(0);
  const lastCamPosRef = useRef(new THREE.Vector3());
  const camSpeedRef = useRef(0);
  const frameCount = useRef(0);
  const lastFPSCheck = useRef(Date.now());
  const fpsHistory = useRef<number[]>([60, 60, 60]);
  const lodChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = movieStore.subscribe(() => setAppState(movieStore.getState()));
    return unsub;
  }, []);

  useEffect(() => {
    if (!appState.isLoading && appState.cameraPosition && controlsRef.current) {
      camera.position.set(...appState.cameraPosition);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      lastCamPosRef.current.copy(camera.position);
    }
  }, [appState.isLoading, appState.cameraPosition, camera]);

  // ✨ quando l’utente seleziona un film dalla barra di ricerca
  useEffect(() => {
    if (focusMovie && controlsRef.current) {
      const to = movieStore.getCameraTargetForMovie(focusMovie.id);
      if (to) setTargetPosition(new THREE.Vector3(...to));
      if (focusMovie.position) {
        lookAtRef.current = new THREE.Vector3(...(focusMovie.position as [number, number, number]));
      }
    }
  }, [focusMovie]);

  // Anche quando cambia il selectedMovie nello store (ad es. click sulla stella)
  useEffect(() => {
    if (appState.selectedMovie && controlsRef.current) {
      const to = movieStore.getCameraTargetForMovie(appState.selectedMovie.id);
      if (to) setTargetPosition(new THREE.Vector3(...to));
      if (appState.selectedMovie.position) {
        lookAtRef.current = new THREE.Vector3(...(appState.selectedMovie.position as [number, number, number]));
      }
    }
  }, [appState.selectedMovie]);

  const effectiveLOD: "high" | "medium" | "low" =
    forceLOD === "auto" ? levelOfDetail : forceLOD;

  useEffect(() => {
    movieStore.setLevelOfDetail(effectiveLOD);
  }, [effectiveLOD]);

  useFrame((state, delta) => {
    // ✨ Volo dolce verso il target
    if (targetPosition && controlsRef.current) {
      camera.position.lerp(targetPosition, 0.02);
      if (lookAtRef.current) {
        controlsRef.current.target.lerp(lookAtRef.current, 0.02);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPosition) < 0.5) {
        setTargetPosition(null);
      }
    }

    // Stima velocità camera
    const camPos = camera.position;
    const dist = camPos.distanceTo(lastCamPosRef.current);
    camSpeedRef.current = THREE.MathUtils.lerp(camSpeedRef.current, dist / Math.max(delta, 1e-3), 0.2);
    lastCamPosRef.current.copy(camPos);

    // Adattamento FPS (solo auto)
    if (forceLOD === "auto") {
      frameCount.current++;
      const now = Date.now();
      if (now - lastFPSCheck.current > 1000) {
        const fps = frameCount.current;
        frameCount.current = 0;
        lastFPSCheck.current = now;
        fpsHistory.current.push(fps);
        if (fpsHistory.current.length > 3) fpsHistory.current.shift();
        const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;

        if (lodChangeTimeout.current) clearTimeout(lodChangeTimeout.current);
        lodChangeTimeout.current = setTimeout(() => {
          if (avgFPS < 25 && levelOfDetail !== "low") setLevelOfDetail("low");
          else if (avgFPS > 35 && avgFPS < 50 && levelOfDetail !== "medium") setLevelOfDetail("medium");
          else if (avgFPS > 55 && levelOfDetail !== "high") setLevelOfDetail("high");
        }, 2000);
      }
    }

    // Aggiorna visibilità nello store
    const cameraPos = camPos.toArray() as [number, number, number];
    movieStore.updateVisibleMovies(cameraPos, getViewDistance(effectiveLOD));

    // Aggiornamento “stabile” del subset cluster (solo se non ci si muove troppo)
    if (showClusters && effectiveLOD !== "high") {
      const nowT = state.clock.elapsedTime * 1000;
      const movingFast = camSpeedRef.current > 2.5;
      const enoughTime = nowT - lastUpdateRef.current > 800;
      if (!movingFast && enoughTime) {
        lastUpdateRef.current = nowT;
        updateActiveClusters();
      }
    }
  });

  const getViewDistance = (lod: "high" | "medium" | "low") => {
    switch (lod) {
      case "low":
        return 60;
      case "medium":
        return 80;
      default:
        return 100;
    }
  };

  const getMaxStarsToRender = (lod: "high" | "medium" | "low") => {
    switch (lod) {
      case "low":
        return 300;
      case "medium":
        return 600;
      default:
        return 1000;
    }
  };

  // Stelle visibili
  const visibleMovies = useMemo(() => {
    if (appState.isLoading) return [];
    const visible = movieStore.getVisibleMovies();
    const maxStars = getMaxStarsToRender(effectiveLOD);
    if (visible.length <= maxStars) return visible;
    return visible.sort((a, b) => b.rating - a.rating).slice(0, maxStars);
  }, [appState.movies, appState.isLoading, effectiveLOD]);

  // Cluster in vista dal negozio
  const clustersInView = useMemo(() => {
    if (appState.isLoading) return [];
    return movieStore.getClustersInView();
  }, [appState.isLoading, appState.clusters]);

  // Mappa cluster (per anti-overlap stelle)
  const clustersById = useMemo(() => {
    const map = new Map<number, { center: [number, number, number]; radius: number }>();
    (appState.clusters || []).forEach((c) => map.set(c.id, { center: c.center, radius: c.radius }));
    return map;
  }, [appState.clusters]);

  // Posizioni di visualizzazione stelle
  const displayPositions = useMemo(() => {
    const baseDist = effectiveLOD === "high" ? 1.6 : effectiveLOD === "medium" ? 1.4 : 1.2;
    return computeSeparatedPositions(visibleMovies, clustersById, baseDist, 2);
  }, [visibleMovies, effectiveLOD, clustersById]);

  // Limite cluster in base al LOD (cap aggressivo)
  const maxClustersForLOD = useMemo(() => {
    return effectiveLOD === "low" ? 8 : effectiveLOD === "medium" ? 14 : 0;
  }, [effectiveLOD]);

  // Selezione “stabile” dei cluster
  const updateActiveClusters = useCallback(() => {
    if (!showClusters || maxClustersForLOD === 0) {
      if (activeClusterIds.size > 0) setActiveClusterIds(new Set());
      return;
    }
    if (clustersInView.length === 0) return;

    const desired = pickClustersSubset(clustersInView, camera, maxClustersForLOD);
    const desiredSet = new Set(desired.map((c) => c.id));
    const active = new Set(activeClusterIds);

    if (active.size === 0) {
      setActiveClusterIds(desiredSet);
      return;
    }

    const allScored = computeClusterScores(desired, camera as THREE.PerspectiveCamera);
    const scoreMap = new Map<number, number>();
    allScored.forEach((s) => scoreMap.set(s.id, s.score));
    const minDesiredScore = allScored.length ? allScored[allScored.length - 1].score : 0;

    const MAX_ADDS = 2;
    const MAX_REMOVES = 2;

    const activeArray = Array.from(active);
    activeArray.sort((a, b) => (scoreMap.get(a) ?? -Infinity) - (scoreMap.get(b) ?? -Infinity));

    let removes = 0;
    for (const id of activeArray) {
      if (removes >= MAX_REMOVES) break;
      const isStillDesired = desiredSet.has(id);
      const s = scoreMap.get(id) ?? -Infinity;
      const isMuchWorse = s < minDesiredScore * 0.8;
      if (!isStillDesired && isMuchWorse) {
        active.delete(id);
        removes++;
      }
    }

    const desiredMissing = desired.filter((c) => !active.has(c.id));
    desiredMissing.sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));

    let adds = 0;
    for (const c of desiredMissing) {
      if (adds >= MAX_ADDS) break;
      if (active.size >= maxClustersForLOD) break;
      const worstActiveScore =
        activeArray.length > 0 ? (scoreMap.get(activeArray[0]) ?? -Infinity) : -Infinity;
      const candScore = scoreMap.get(c.id) ?? 0;
      if (candScore > worstActiveScore * 1.15) {
        active.add(c.id);
        adds++;
      }
    }

    if (active.size > maxClustersForLOD) {
      const arr = Array.from(active);
      arr.sort((a, b) => (scoreMap.get(a) ?? -Infinity) - (scoreMap.get(b) ?? -Infinity));
      const toRemove = arr.slice(0, active.size - maxClustersForLOD);
      toRemove.forEach((id) => active.delete(id));
    }

    setActiveClusterIds(new Set(active));
  }, [showClusters, maxClustersForLOD, clustersInView, camera, activeClusterIds]);

  // Lista finale dei cluster da renderizzare (stabile)
  const clustersToRender = useMemo(() => {
    if (!showClusters || maxClustersForLOD === 0) return [];
    const idSet = activeClusterIds;
    if (idSet.size === 0) return [];
    const map = new Map<number, MovieCluster>();
    (appState.clusters || []).forEach((c) => map.set(c.id, c));
    const res: MovieCluster[] = [];
    idSet.forEach((id) => {
      const c = map.get(id);
      if (c) res.push(c);
    });
    return res;
  }, [showClusters, maxClustersForLOD, activeClusterIds, appState.clusters]);

  // Luci
  const lighting = useMemo(() => {
    if (effectiveLOD === "low") {
      return (
        <>
          <ambientLight intensity={0.3} />
          <pointLight position={[50, 50, 50]} intensity={0.8} color="#8b5cf6" />
        </>
      );
    }
    return (
      <>
        <ambientLight intensity={0.25} />
        <pointLight position={[50, 50, 50]} intensity={0.7} color="#8b5cf6" />
        <pointLight position={[-50, -50, -50]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[0, 100, 0]} intensity={0.3} color="#ec4899" />
        <directionalLight position={[10, 10, 5]} intensity={0.2} />
      </>
    );
  }, [effectiveLOD]);

  // Sfondo stelle
  const starsBackground = useMemo(() => {
    if (!showParticles) return null;
    const starCount = effectiveLOD === "low" ? 3000 : effectiveLOD === "medium" ? 5000 : 7000;
    return (
      <Stars
        radius={400}
        depth={200}
        count={starCount}
        factor={10}
        saturation={0}
        fade
        speed={0.5}
      />
    );
  }, [effectiveLOD, showParticles]);

  const handleStarHover = useCallback((movieId: number | null) => {
    setHoveredStar(movieId);
  }, []);

  const handleStarUnhover = useCallback(() => {
    setHoveredStar(null);
  }, []);

  const handleStarClick = useCallback(
    (movie: Movie) => {
      onStarClick(movie);
      const to = movieStore.getCameraTargetForMovie(movie.id);
      if (to) setTargetPosition(new THREE.Vector3(...to));
      if (movie.position) {
        lookAtRef.current = new THREE.Vector3(...(movie.position as [number, number, number]));
      }
    },
    [onStarClick]
  );

  if (appState.isLoading) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Caricamento Cinema Universe...</p>
          <p className="text-sm text-gray-400">{appState.loadingProgress}%</p>
        </div>
      </Html>
    );
  }

  return (
    <>
      {lighting}
      {starsBackground}

      <group ref={groupRef}>
        {/* Cluster stabilizzati e limitati */}
        {clustersToRender.map((cluster) => (
          <ClusterSphere key={cluster.id} cluster={cluster} opacity={0.05} />
        ))}

        {/* Stelle con posizioni separate */}
        {visibleMovies.map((movie) => {
          const pos =
            displayPositions.get(movie.id) ||
            ((movie.position as [number, number, number]) ?? [movie.x, movie.y, movie.z]);
          return (
            <Star
              key={movie.id}
              movie={movie}
              position={pos}
              onClick={handleStarClick}
              onHover={handleStarHover}
              onUnhover={handleStarUnhover}
              isHovered={hoveredStar === movie.id}
              levelOfDetail={effectiveLOD}
            />
          );
        })}

        {/* Tooltip */}
        {hoveredStar &&
          (() => {
            const movie = appState.movies.find((m) => m.id === hoveredStar);
            if (!movie) return null;
            const pos =
              displayPositions.get(movie.id) ||
              ((movie.position as [number, number, number]) ?? [movie.x, movie.y, movie.z]);
            return (
              <Html position={pos}>
                <div className="pointer-events-none bg-black/90 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap border border-cyan-500/50 backdrop-blur-sm shadow-2xl">
                  <div className="font-bold text-cyan-400">{movie.title}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {movie.release_year} • ⭐ {movie.rating.toFixed(1)} • {movie.director || "Regista sconosciuto"}
                  </div>
                </div>
              </Html>
            );
          })()}
      </group>

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={300}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping
        zoomSpeed={1.2}
        panSpeed={0.8}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      />
    </>
  );
}
