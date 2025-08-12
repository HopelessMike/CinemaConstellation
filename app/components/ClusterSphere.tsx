// app/components/ClusterSphere.tsx
"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { MovieCluster } from "@/lib/types"

interface ClusterSphereProps {
  cluster: MovieCluster
  opacity?: number
}

export function ClusterSphere({ cluster, opacity = 0.1 }: ClusterSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  const geometry = useMemo(() => 
    new THREE.SphereGeometry(cluster.radius, 16, 16), 
    [cluster.radius]
  )
  
  const ringGeometry = useMemo(() =>
    new THREE.RingGeometry(cluster.radius * 0.8, cluster.radius * 1.2, 32),
    [cluster.radius]
  )
  
  const material = useMemo(() => 
    new THREE.MeshBasicMaterial({ 
      color: cluster.color,
      transparent: true, 
      opacity,
      wireframe: true,
      side: THREE.BackSide
    }), 
    [cluster.color, opacity]
  )

  const ringMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: cluster.color,
      transparent: true,
      opacity: opacity * 0.3,
      side: THREE.DoubleSide
    }),
    [cluster.color, opacity]
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
      meshRef.current.rotation.x += 0.0005
      
      // Subtle pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02
      meshRef.current.scale.setScalar(scale)
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.003
      const ringScale = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.03
      ringRef.current.scale.setScalar(ringScale)
    }
  })

  return (
    <group position={cluster.center}>
      <mesh 
        ref={meshRef}
        geometry={geometry}
        material={material}
      />
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}