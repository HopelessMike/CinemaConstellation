// app/components/Star.tsx
"use client"

import { useRef, useMemo, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Movie } from "@/lib/types"

interface StarProps {
  movie: Movie
  onClick: (movie: Movie) => void
  onHover: (id: number | null) => void
  onUnhover: () => void
  isHovered: boolean
  levelOfDetail: 'high' | 'medium' | 'low'
}

// Shared geometries for performance
const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16)
const simpleSphereGeometry = new THREE.SphereGeometry(0.2, 8, 8)
const basicSphereGeometry = new THREE.SphereGeometry(0.15, 6, 6)
const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16)
const ringGeometry = new THREE.RingGeometry(0.6, 0.8, 32)
const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8)

export function Star({ movie, onClick, onHover, onUnhover, isHovered, levelOfDetail }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const particleRefs = useRef<(THREE.Mesh | null)[]>([])
  
  // Materials with different quality levels
  const starMaterial = useMemo(() => {
    const baseColor = new THREE.Color(movie.color || '#8b5cf6')
    
    if (levelOfDetail === 'low') {
      return new THREE.MeshBasicMaterial({ 
        color: baseColor,
        transparent: true, 
        opacity: 0.9 
      })
    }
    
    return new THREE.MeshStandardMaterial({ 
      color: baseColor, 
      emissive: baseColor, 
      emissiveIntensity: 0.3, 
      transparent: true, 
      opacity: 0.9 
    })
  }, [movie.color, levelOfDetail])
  
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: movie.color || '#8b5cf6', 
    transparent: true, 
    opacity: 0.1 
  }), [movie.color])
  
  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: movie.color || '#8b5cf6', 
    transparent: true, 
    opacity: 0.6, 
    side: THREE.DoubleSide 
  }), [movie.color])
  
  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: movie.color || '#8b5cf6', 
    transparent: true, 
    opacity: 0.7 
  }), [movie.color])

  // Particle positions for high detail only
  const particlePositions = useMemo(() => 
    levelOfDetail === 'high' 
      ? [...Array(8)].map((_, i) => [
          Math.cos((i / 8) * Math.PI * 2) * 1.2, 
          Math.sin((i / 8) * Math.PI * 2) * 1.2, 
          0
        ] as [number, number, number])
      : []
  , [levelOfDetail])

  // Choose geometry based on LOD
  const currentGeometry = useMemo(() => {
    switch (levelOfDetail) {
      case 'low': return basicSphereGeometry
      case 'medium': return simpleSphereGeometry
      default: return sphereGeometry
    }
  }, [levelOfDetail])

  useFrame((state) => {
    if (!meshRef.current) return

    const baseSize = movie.size || 1
    
    // Simplified animations for lower LOD
    if (levelOfDetail === 'low') {
      const scale = baseSize * (isHovered ? 1.5 : 1)
      meshRef.current.scale.setScalar(scale)
      return
    }

    // Full animations for medium/high LOD
    const scale = baseSize + Math.sin(state.clock.elapsedTime * 2) * 0.1
    meshRef.current.scale.setScalar(isHovered ? scale * 1.5 : scale)
    
    if (starMaterial instanceof THREE.MeshStandardMaterial) {
      starMaterial.emissiveIntensity = isHovered ? 0.8 : 0.3
    }
    
    glowMaterial.opacity = isHovered ? 0.3 : 0.1

    // Ring animation only for high detail
    if (levelOfDetail === 'high' && ringRef.current) {
      ringRef.current.visible = isHovered
      if (isHovered) {
        ringRef.current.rotation.z += 0.02
        ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
      }
    }

    // Particles only for high detail
    if (levelOfDetail === 'high') {
      particleRefs.current.forEach((particle) => {
        if (particle) particle.visible = isHovered
      })
    }
  })

  const handlePointerOver = useCallback((event: any) => {
    event.stopPropagation()
    onHover(movie.id)
    document.body.style.cursor = "pointer"
  }, [movie.id, onHover])

  const handlePointerOut = useCallback((event: any) => {
    event.stopPropagation()
    onUnhover()
    document.body.style.cursor = "auto"
  }, [onUnhover])

  const handleClick = useCallback((event: any) => {
    event.stopPropagation()
    onClick(movie)
  }, [movie, onClick])

  return (
    <group 
      ref={groupRef} 
      position={movie.position} 
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut} 
      onClick={handleClick}
    >
      {/* Main star */}
      <mesh 
        ref={meshRef} 
        geometry={currentGeometry} 
        material={starMaterial} 
      />
      
      {/* Glow effect for medium/high detail */}
      {levelOfDetail !== 'low' && (
        <mesh 
          geometry={glowGeometry} 
          material={glowMaterial} 
        />
      )}
      
      {/* Ring effect only for high detail */}
      {levelOfDetail === 'high' && (
        <mesh 
          ref={ringRef} 
          geometry={ringGeometry} 
          material={ringMaterial} 
          rotation={[Math.PI / 2, 0, 0]} 
        />
      )}
      
      {/* Particles only for high detail */}
      {levelOfDetail === 'high' && particlePositions.map((position, i) => (
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