"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Movie } from "@/lib/types";

interface StarProps {
  movie: Movie;
  position: [number, number, number]; // ← posizione di visualizzazione (separata)
  onClick: (movie: Movie) => void;
  onHover: (id: number | null) => void;
  onUnhover: () => void;
  isHovered: boolean;
  levelOfDetail: "high" | "medium" | "low";
}

// Shared geometries for performance
const icosahedronGeometry = new THREE.IcosahedronGeometry(0.2, 1);
const octahedronGeometry = new THREE.OctahedronGeometry(0.2, 0);
const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.25, 0);
const glowSphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const ringSphereGeometry = new THREE.SphereGeometry(0.35, 32, 32);
const outerRingGeometry = new THREE.TorusGeometry(0.7, 0.02, 8, 32);
const innerRingGeometry = new THREE.TorusGeometry(0.5, 0.015, 8, 32);

export function Star({ movie, position, onClick, onHover, onUnhover, isHovered, levelOfDetail }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [pulsePhase] = useState(() => Math.random() * Math.PI * 2);

  // Choose geometry based on rating for variety
  const starGeometry = useMemo(() => {
    if (levelOfDetail === "low") return tetrahedronGeometry;

    if (movie.rating > 8) return icosahedronGeometry;
    if (movie.rating > 6) return octahedronGeometry;
    return tetrahedronGeometry;
  }, [movie.rating, levelOfDetail]);

  // Enhanced materials with balanced brightness
  const starMaterial = useMemo(() => {
    const baseColor = new THREE.Color(movie.color || "#8b5cf6");
    baseColor.r = Math.min(1, baseColor.r * 1.2 + 0.1);
    baseColor.g = Math.min(1, baseColor.g * 1.2 + 0.1);
    baseColor.b = Math.min(1, baseColor.b * 1.2 + 0.1);

    if (levelOfDetail === "low") {
      return new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.9,
      });
    }

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.3,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.95,
    });

    return material;
  }, [movie.color, levelOfDetail]);

  const glowMaterial = useMemo(() => {
    const glowColor = new THREE.Color(movie.color || "#8b5cf6");

    return new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
  }, [movie.color]);

  const outerGlowMaterial = useMemo(() => {
    const glowColor = new THREE.Color(movie.color || "#8b5cf6");
    glowColor.r = Math.min(1, glowColor.r * 1.4 + 0.2);
    glowColor.g = Math.min(1, glowColor.g * 1.4 + 0.2);
    glowColor.b = Math.min(1, glowColor.b * 1.4 + 0.2);

    return new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
  }, [movie.color]);

  const ringMaterial = useMemo(() => {
    const ringColor = new THREE.Color(movie.color || "#8b5cf6");
    ringColor.r = Math.min(1, ringColor.r * 1.6 + 0.2);
    ringColor.g = Math.min(1, ringColor.g * 1.6 + 0.2);
    ringColor.b = Math.min(1, ringColor.b * 1.6 + 0.2);

    return new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
  }, [movie.color]);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    const time = state.clock.elapsedTime;
    const baseSize = movie.size || 0.5;

    // Gentle rotation for all stars
    meshRef.current.rotation.y += 0.005;
    meshRef.current.rotation.x += 0.003;

    // Pulsing effect based on rating
    const pulseFactor = 1 + Math.sin(time * 2 + pulsePhase) * 0.05 * (movie.rating / 10);

    if (isHovered) {
      const hoverScale = baseSize * 1.8 * pulseFactor;
      groupRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);

      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.z = Math.sin(time * 3) * 0.1;

      if (starMaterial instanceof THREE.MeshStandardMaterial) {
        starMaterial.emissiveIntensity = THREE.MathUtils.lerp(starMaterial.emissiveIntensity, 0.6, 0.1);
      }

      if (glowRef.current) {
        glowMaterial.opacity = THREE.MathUtils.lerp(glowMaterial.opacity, 0.4, 0.1);
        glowRef.current.scale.setScalar(1.2 + Math.sin(time * 4) * 0.1);
      }

      if (outerGlowRef.current) {
        outerGlowMaterial.opacity = THREE.MathUtils.lerp(outerGlowMaterial.opacity, 0.3, 0.1);
        outerGlowRef.current.scale.setScalar(1.5 + Math.sin(time * 3) * 0.15);
      }

      if (levelOfDetail === "high") {
        if (ringRef.current) {
          ringMaterial.opacity = THREE.MathUtils.lerp(ringMaterial.opacity, 0.8, 0.1);
          ringRef.current.rotation.z += 0.03;
          ringRef.current.rotation.x = Math.sin(time * 2) * 0.3;
        }

        if (innerRingRef.current) {
          innerRingRef.current.rotation.z -= 0.02;
          innerRingRef.current.rotation.y = Math.cos(time * 2) * 0.3;
        }
      }
    } else {
      const normalScale = baseSize * pulseFactor;
      groupRef.current.scale.lerp(new THREE.Vector3(normalScale, normalScale, normalScale), 0.05);

      if (starMaterial instanceof THREE.MeshStandardMaterial) {
        starMaterial.emissiveIntensity = THREE.MathUtils.lerp(starMaterial.emissiveIntensity, 0.3, 0.05);
      }

      if (glowRef.current) {
        glowMaterial.opacity = THREE.MathUtils.lerp(glowMaterial.opacity, 0.2, 0.05);
        glowRef.current.scale.setScalar(1);
      }

      if (outerGlowRef.current) {
        outerGlowMaterial.opacity = THREE.MathUtils.lerp(outerGlowMaterial.opacity, 0, 0.05);
      }

      if (ringRef.current) {
        ringMaterial.opacity = THREE.MathUtils.lerp(ringMaterial.opacity, 0, 0.05);
      }
    }
  });

  const handlePointerOver = useCallback(
    (event: any) => {
      event.stopPropagation();
      onHover(movie.id);
      document.body.style.cursor = "pointer";
    },
    [movie.id, onHover]
  );

  const handlePointerOut = useCallback(
    (event: any) => {
      event.stopPropagation();
      onUnhover();
      document.body.style.cursor = "auto";
    },
    [onUnhover]
  );

  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation();
      onClick(movie);
    },
    [movie, onClick]
  );

  return (
    <group
      ref={groupRef}
      position={position}           // ← usa la posizione separata
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Main star with interesting geometry */}
      <mesh ref={meshRef} geometry={starGeometry} material={starMaterial} castShadow />

      {/* Inner glow sphere */}
      <mesh ref={glowRef} geometry={ringSphereGeometry} material={glowMaterial} />

      {/* Outer glow for hover effect */}
      {levelOfDetail !== "low" && <mesh ref={outerGlowRef} geometry={glowSphereGeometry} material={outerGlowMaterial} />}

      {/* Orbital rings for high detail */}
      {levelOfDetail === "high" && (
        <>
          <mesh ref={ringRef} geometry={outerRingGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
          <mesh ref={innerRingRef} geometry={innerRingGeometry} material={ringMaterial} rotation={[0, Math.PI / 2, 0]} />
        </>
      )}
    </group>
  );
}
