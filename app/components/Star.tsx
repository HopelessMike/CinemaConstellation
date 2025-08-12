"use client"

import { useRef, useMemo, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Movie } from "@/lib/types" // Importa il tipo centralizzato

interface StarProps {
  movie: Movie
  onClick: (movie: Movie) => void
  onHover: (id: string | null) => void
  onUnhover: () => void; // <-- CORREZIONE: Aggiunta la prop mancante
  isHovered: boolean
}

// ... Il resto del codice rimane invariato, lo includo per completezza

const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
const ringGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);

export function Star({ movie, onClick, onHover, onUnhover, isHovered }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const particleRefs = useRef<(THREE.Mesh | null)[]>([])
  
  const starMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: movie.color, emissive: movie.color, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }), [movie.color]);
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: movie.color, transparent: true, opacity: 0.1 }), [movie.color]);
  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: movie.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }), [movie.color]);
  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: movie.color, transparent: true, opacity: 0.7 }), [movie.color]);

  const particlePositions = useMemo(() => [...Array(8)].map((_, i) => [Math.cos((i / 8) * Math.PI * 2) * 1.2, Math.sin((i / 8) * Math.PI * 2) * 1.2, 0] as [number, number, number]), []);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = movie.size + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(isHovered ? scale * 1.5 : scale);
      starMaterial.emissiveIntensity = isHovered ? 0.8 : 0.3;
    }
    glowMaterial.opacity = isHovered ? 0.3 : 0.1;

    if (ringRef.current) {
      ringRef.current.visible = isHovered;
      if (isHovered) {
        ringRef.current.rotation.z += 0.02;
        ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
      }
    }

    particleRefs.current.forEach((particle) => {
      if (particle) particle.visible = isHovered;
    });
  });

  const handlePointerOver = useCallback(() => {
    onHover(movie.id);
    document.body.style.cursor = "pointer";
  }, [movie.id, onHover]);

  const handlePointerOut = useCallback(() => {
    onUnhover();
    document.body.style.cursor = "auto";
  }, [onUnhover]);

  return (
    <group ref={groupRef} position={movie.position} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={() => onClick(movie)}>
      <mesh ref={meshRef} geometry={sphereGeometry} material={starMaterial} />
      <mesh geometry={glowGeometry} material={glowMaterial} />
      <mesh ref={ringRef} geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
      {particlePositions.map((position, i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el)} geometry={particleGeometry} material={particleMaterial} position={position} />
      ))}
    </group>
  );
}