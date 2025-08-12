"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Ring } from "@react-three/drei"
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
  const [hovered, setHovered] = useState(false)

  // Pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      const scale = movie.size + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.setScalar(hovered ? scale * 1.5 : scale)
    }

    if (ringRef.current && hovered) {
      ringRef.current.rotation.z += 0.02
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
    }
  })

  const handlePointerOver = () => {
    setHovered(true)
    onHover(movie.id)
    document.body.style.cursor = "pointer"
  }

  const handlePointerOut = () => {
    setHovered(false)
    onUnhover()
    document.body.style.cursor = "auto"
  }

  return (
    <group position={movie.position}>
      {/* Main star sphere */}
      <Sphere
        ref={meshRef}
        args={[0.2, 16, 16]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={movie.color}
          emissive={movie.color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Glow effect */}
      <Sphere args={[0.4, 16, 16]}>
        <meshBasicMaterial color={movie.color} transparent opacity={hovered ? 0.3 : 0.1} />
      </Sphere>

      {/* Orbital ring when hovered */}
      {hovered && (
        <Ring ref={ringRef} args={[0.6, 0.8, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={movie.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </Ring>
      )}

      {/* Particle trail effect */}
      {hovered && (
        <>
          {[...Array(8)].map((_, i) => (
            <Sphere
              key={i}
              args={[0.02, 8, 8]}
              position={[Math.cos((i / 8) * Math.PI * 2) * 1.2, Math.sin((i / 8) * Math.PI * 2) * 1.2, 0]}
            >
              <meshBasicMaterial color={movie.color} transparent opacity={0.7} />
            </Sphere>
          ))}
        </>
      )}
    </group>
  )
}
