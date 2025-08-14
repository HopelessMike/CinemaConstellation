// app/components/ClusterSphere.tsx
'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MovieCluster } from '@/lib/types';

interface ClusterSphereProps {
  cluster: MovieCluster;
  opacity?: number;
}

/**
 * Sfera del cluster + anello decorativo senza occlusione.
 * - Sfera wireframe con depthWrite: false
 * - Anello come THREE.Line (renderizzato via <primitive>), non Mesh
 */
export function ClusterSphere({ cluster, opacity = 0.1 }: ClusterSphereProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Line>(null);

  // ── SFERA ──────────────────────────────────────────────────────────────
  const sphereGeom = useMemo(
    () => new THREE.SphereGeometry(cluster.radius, 16, 16),
    [cluster.radius]
  );

  const sphereMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cluster.color,
        transparent: true,
        opacity,
        wireframe: true,
        side: THREE.BackSide,
        depthWrite: false,    // non sporca lo z-buffer → non occlude
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [cluster.color, opacity]
  );

  // ── ANELLO (come Line, non Mesh) ───────────────────────────────────────
  const ringGeom = useMemo(() => {
    const r = cluster.radius * 1.05;
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(128);
    // Chiudi il loop duplicando il primo punto in coda
    pts.push(pts[0].clone());
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return g;
  }, [cluster.radius]);

  const ringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(cluster.color).multiplyScalar(1.1),
        transparent: true,
        opacity: Math.min(opacity * 1.2, 0.5),
        depthWrite: false,   // fondamentale per evitare occlusione
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [cluster.color, opacity]
  );

  // Crea l’oggetto THREE.Line e usalo in <primitive>
  const ringObject = useMemo(() => new THREE.Line(ringGeom, ringMat), [ringGeom, ringMat]);

  // Cleanup manuale delle risorse quando il componente si smonta
  useEffect(() => {
    return () => {
      sphereGeom.dispose();
      (sphereMat as THREE.Material).dispose?.();
      ringGeom.dispose();
      (ringMat as THREE.Material).dispose?.();
    };
  }, [sphereGeom, sphereMat, ringGeom, ringMat]);

  // ── Animazioni ─────────────────────────────────────────────────────────
  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.001;
      sphereRef.current.rotation.x += 0.0005;
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      sphereRef.current.scale.setScalar(s);
      sphereRef.current.renderOrder = 1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.003;
      const rs = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
      ringRef.current.scale.setScalar(rs);
      ringRef.current.renderOrder = 2; // disegna dopo la sfera
    }
  });

  return (
    <group position={cluster.center}>
      {/* Sfera wireframe (non occlude) */}
      <mesh ref={sphereRef} geometry={sphereGeom} material={sphereMat} />

      {/* Anello come THREE.Line renderizzato via <primitive> */}
      <primitive
        ref={ringRef}
        object={ringObject}
        rotation={[Math.PI / 2, 0, 0]} // equatore
      />
    </group>
  );
}
