"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Star } from "./Star"
import { Movie } from "@/lib/types" // <-- IMPORTA IL TIPO CENTRALIZZATO
import type * as THREE from "three"

interface StarFieldProps {
  onStarClick: (movie: Movie) => void
}

export function StarField({ onStarClick }: StarFieldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredStar, setHoveredStar] = useState<string | null>(null)

  // I dati dei film ora usano il tipo importato
  const movies = useMemo<Movie[]>(
    () => [
       {
        id: "1",
        title: "Interstellar",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2014",
        runtime: 169,
        rating: "8.6/10",
        director: "Christopher Nolan",
        plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        position: [0, 0, 0],
        color: "#8b5cf6",
        size: 1.2,
      },
      {
        id: "2",
        title: "Arrival",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2016",
        runtime: 116,
        rating: "7.9/10",
        director: "Denis Villeneuve",
        plot: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
        position: [3, 1, -2],
        color: "#3b82f6",
        size: 1.0,
      },
       {
        id: "3",
        title: "Gravity",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2013",
        runtime: 91,
        rating: "7.7/10",
        director: "Alfonso Cuarón",
        plot: "Two astronauts work together to survive after an accident leaves them stranded in space.",
        position: [2, -2, 1],
        color: "#06b6d4",
        size: 0.9,
      },
      {
        id: "4",
        title: "The Martian",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2015",
        runtime: 144,
        rating: "8.0/10",
        director: "Ridley Scott",
        plot: "An astronaut becomes stranded on Mars after his team assume him dead, and must rely on his ingenuity to find a way to signal to Earth.",
        position: [1, 3, -1],
        color: "#f59e0b",
        size: 1.1,
      },
    ],
    [],
  )

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#3b82f6" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      <group ref={groupRef}>
        {movies.map((movie) => (
          <Star
            key={movie.id}
            movie={movie}
            onClick={onStarClick}
            onHover={(id) => setHoveredStar(id)}
            onUnhover={() => setHoveredStar(null)}
            isHovered={hoveredStar === movie.id}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={false}
      />
    </>
  )
}