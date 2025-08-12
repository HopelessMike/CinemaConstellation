// app/components/StarField.tsx
"use client"

import { useRef, useMemo, useState, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import { Star } from "./Star"
import { ClusterSphere } from "./ClusterSphere"
import { movieStore } from "@/lib/movieStore"
import { Movie, MovieCluster } from "@/lib/types"
import type * as THREE from "three"

interface StarFieldProps {
  onStarClick: (movie: Movie) => void
}

export function StarField({ onStarClick }: StarFieldProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [appState, setAppState] = useState(movieStore.getState())
  const [levelOfDetail, setLevelOfDetail] = useState<'high' | 'medium' | 'low'>('high')
  
  // Performance monitoring
  const frameCount = useRef(0)
  const lastFPSCheck = useRef(Date.now())

  useEffect(() => {
    const unsubscribe = movieStore.subscribe(() => {
      setAppState(movieStore.getState())
    })
    return unsubscribe
  }, [])

  // Initialize random camera position
  useEffect(() => {
    if (!appState.isLoading && appState.cameraPosition && controlsRef.current) {
      camera.position.set(...appState.cameraPosition)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [appState.isLoading, appState.cameraPosition, camera])

  // Performance monitoring and LOD adjustment
  useFrame(() => {
    frameCount.current++
    const now = Date.now()
    
    if (now - lastFPSCheck.current > 1000) { // Check every second
      const fps = frameCount.current
      frameCount.current = 0
      lastFPSCheck.current = now
      
      // Adjust level of detail based on performance
      if (fps < 30 && levelOfDetail !== 'low') {
        setLevelOfDetail('low')
      } else if (fps < 50 && levelOfDetail === 'high') {
        setLevelOfDetail('medium')
      } else if (fps > 55 && levelOfDetail !== 'high') {
        setLevelOfDetail('high')
      }
    }

    // Update visible movies based on camera position
    const cameraPos = camera.position.toArray() as [number, number, number]
    movieStore.updateVisibleMovies(cameraPos, getViewDistance())
  })

  const getViewDistance = useCallback(() => {
    switch (levelOfDetail) {
      case 'low': return 30
      case 'medium': return 40
      default: return 60
    }
  }, [levelOfDetail])

  const getMaxStarsToRender = useCallback(() => {
    switch (levelOfDetail) {
      case 'low': return 100
      case 'medium': return 300
      default: return 1000
    }
  }, [levelOfDetail])

  // Get visible movies and clusters for rendering
  const visibleMovies = useMemo(() => {
    if (appState.isLoading) return []
    
    const visible = movieStore.getVisibleMovies()
    const maxStars = getMaxStarsToRender()
    
    if (visible.length <= maxStars) return visible
    
    // Sort by rating and take top N movies if we need to limit
    return visible
      .sort((a, b) => b.rating - a.rating)
      .slice(0, maxStars)
  }, [appState.movies, appState.isLoading, levelOfDetail, getMaxStarsToRender])

  const visibleClusters = useMemo(() => {
    if (appState.isLoading) return []
    return movieStore.getClustersInView()
  }, [appState.clusters, appState.isLoading])

  // Lighting based on performance
  const lighting = useMemo(() => {
    if (levelOfDetail === 'low') {
      return (
        <>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.6} color="#8b5cf6" />
        </>
      )
    }
    
    return (
      <>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#3b82f6" />
        <pointLight position={[0, 15, 0]} intensity={0.2} color="#ec4899" />
      </>
    )
  }, [levelOfDetail])

  // Stars background based on performance
  const starsBackground = useMemo(() => {
    const starCount = levelOfDetail === 'low' ? 2000 : levelOfDetail === 'medium' ? 3500 : 5000
    return (
      <Stars 
        radius={200} 
        depth={80} 
        count={starCount} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.3} 
      />
    )
  }, [levelOfDetail])

  const handleStarHover = useCallback((movieId: number | null) => {
    setHoveredStar(movieId)
  }, [])

  const handleStarUnhover = useCallback(() => {
    setHoveredStar(null)
  }, [])

  if (appState.isLoading) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading Cinema Universe...</p>
          <p className="text-sm text-gray-400">{appState.loadingProgress}%</p>
        </div>
      </Html>
    )
  }

  return (
    <>
      {lighting}
      {starsBackground}

      {/* Performance indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <Html position={[-10, 8, 0]}>
          <div className="text-xs text-white bg-black/50 p-2 rounded">
            LOD: {levelOfDetail}<br/>
            Movies: {visibleMovies.length}<br/>
            Clusters: {visibleClusters.length}
          </div>
        </Html>
      )}

      <group ref={groupRef}>
        {/* Render cluster boundaries when zoomed out */}
        {levelOfDetail !== 'high' && visibleClusters.map((cluster) => (
          <ClusterSphere 
            key={cluster.id} 
            cluster={cluster}
            opacity={0.1}
          />
        ))}

        {/* Render individual stars */}
        {visibleMovies.map((movie) => (
          <Star
            key={movie.id}
            movie={movie}
            onClick={onStarClick}
            onHover={handleStarHover}
            onUnhover={handleStarUnhover}
            isHovered={hoveredStar === movie.id}
            levelOfDetail={levelOfDetail}
          />
        ))}

        {/* Show movie title on hover */}
        {hoveredStar && (
          (() => {
            const movie = appState.movies.find(m => m.id === hoveredStar)
            if (!movie) return null
            
            return (
              <Html position={movie.position}>
                <div className="pointer-events-none bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap border border-cyan-500/30 backdrop-blur-sm">
                  {movie.title}
                  <div className="text-xs text-gray-400">
                    {movie.release_year} • ⭐ {movie.rating.toFixed(1)}
                  </div>
                </div>
              </Html>
            )
          })()
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={200}
        autoRotate={false}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  )
}