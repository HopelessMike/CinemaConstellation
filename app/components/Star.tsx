"use client"

import { useRef, useState, useMemo, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface Movie {
  id: string
  title: string
  poster: string
  genre: string
  year: string
  rating: string
  plot: string
  position: [number, number, number]
  color: string
  size: number
}

interface StarProps {
  movie: Movie
  onClick: () => void
  onHover: (id: string) => void
  onUnhover: () => void
  isHovered: boolean
}

export function Star({ movie, onClick, onHover, onUnhover, isHovered }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const particleRefs = useRef<(THREE.Mesh | null)[]>([])
  const [hovered, setHovered] = useState(false)

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), [])
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(0.4, 16, 16), [])
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.6, 0.8, 32), [])
  const particleGeometry = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), [])

  const starMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: movie.color,
        emissive: movie.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
      }),
    [movie.color],
  )

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: movie.color,
        transparent: true,
        opacity: 0.1,
      }),
    [movie.color],
  )

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: movie.color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    [movie.color],
  )

  const particleMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: movie.color,
        transparent: true,
        opacity: 0.7,
      }),
    [movie.color],
  )

  const particlePositions = useMemo(
    () =>
      [...Array(8)].map(
        (_, i) =>
          [Math.cos((i / 8) * Math.PI * 2) * 1.2, Math.sin((i / 8) * Math.PI * 2) * 1.2, 0] as [number, number, number],
      ),
    [],
  )

  useFrame((state) => {
    try {
      if (meshRef.current) {
        const scale = movie.size + Math.sin(state.clock.elapsedTime * 2) * 0.1
        meshRef.current.scale.setScalar(hovered ? scale * 1.5 : scale)

        if (starMaterial) {
          starMaterial.emissiveIntensity = hovered ? 0.8 : 0.3
        }
      }

      if (glowMaterial) {
        glowMaterial.opacity = hovered ? 0.3 : 0.1
      }

      if (ringRef.current) {
        ringRef.current.rotation.z += 0.02
        ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
        if (ringMaterial) {
          ringMaterial.opacity = hovered ? 0.6 : 0
        }
      }

      particleRefs.current.forEach((particle, i) => {
        if (particle) {
          const angle = (i / 8) * Math.PI * 2 + state.clock.elapsedTime
          particle.position.x = Math.cos(angle) * 1.2
          particle.position.y = Math.sin(angle) * 1.2
          if (particleMaterial) {
            particleMaterial.opacity = hovered ? 0.7 : 0
          }
        }
      })
    } catch (error) {
      console.warn("Star animation error:", error)
    }
  })

  const handlePointerOver = useCallback(() => {
    setHovered(true)
    onHover(movie.id)
    document.body.style.cursor = "pointer"
  }, [movie.id, onHover])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    onUnhover()
    document.body.style.cursor = "auto"
  }, [onUnhover])

  return (
    <group ref={groupRef} position={movie.position}>
      {/* Main star sphere */}
      <mesh
        ref={meshRef}
        geometry={sphereGeometry}
        material={starMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      />

      {/* Glow effect */}
      <mesh geometry={glowGeometry} material={glowMaterial} />

      <mesh ref={ringRef} geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />

      {particlePositions.map((position, i) => (
        <mesh
          key={i}
          ref={(el) => (particleRefs.current[i] = el)}
          geometry={particleGeometry}
          material={particleMaterial}
          position={position}
        />
      ))}
    </group>
  )
}
