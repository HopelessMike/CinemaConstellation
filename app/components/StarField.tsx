"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Text } from "@react-three/drei"
import { Star } from "./Star"
import type * as THREE from "three"

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

interface StarFieldProps {
  onStarClick: (movie: Movie) => void
}

export function StarField({ onStarClick }: StarFieldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredStar, setHoveredStar] = useState<string | null>(null)

  // Mock movie data with 3D positions based on similarity clusters
  const movies = useMemo<Movie[]>(
    () => [
      {
        id: "1",
        title: "Interstellar",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2014",
        rating: "8.6/10",
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
        rating: "7.9/10",
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
        rating: "7.7/10",
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
        rating: "8.0/10",
        plot: "An astronaut becomes stranded on Mars after his team assume him dead, and must rely on his ingenuity to find a way to signal to Earth.",
        position: [1, 3, -1],
        color: "#f59e0b",
        size: 1.1,
      },
      {
        id: "5",
        title: "Blade Runner 2049",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2017",
        rating: "8.0/10",
        plot: "A young blade runner's discovery of a long-buried secret leads him to track down former blade runner Rick Deckard.",
        position: [-3, 0, 2],
        color: "#ec4899",
        size: 1.0,
      },
      {
        id: "6",
        title: "Ex Machina",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2014",
        rating: "7.7/10",
        plot: "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence.",
        position: [-2, -1, -3],
        color: "#10b981",
        size: 0.8,
      },
      {
        id: "7",
        title: "Dune",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2021",
        rating: "8.0/10",
        plot: "Paul Atreides leads nomadic tribes in a revolt against the galactic emperor and his father's evil nemesis.",
        position: [-1, 2, 3],
        color: "#f97316",
        size: 1.3,
      },
      {
        id: "8",
        title: "Avatar",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2009",
        rating: "7.8/10",
        plot: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following orders and protecting an alien civilization.",
        position: [4, -1, 0],
        color: "#22d3ee",
        size: 1.1,
      },
      {
        id: "9",
        title: "Inception",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "2010",
        rating: "8.8/10",
        plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
        position: [0, -3, 2],
        color: "#a855f7",
        size: 1.2,
      },
      {
        id: "10",
        title: "The Matrix",
        poster: "/placeholder.svg?height=400&width=300",
        genre: "Sci-Fi",
        year: "1999",
        rating: "8.7/10",
        plot: "A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix.",
        position: [-4, 1, -1],
        color: "#84cc16",
        size: 1.1,
      },
    ],
    [],
  )

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#3b82f6" />

      {/* Background stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      {/* Movie stars group */}
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

      {/* Floating movie title for hovered star */}
      {hoveredStar && (
        <Text
          position={[0, 4, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.ttf"
        >
          {movies.find((m) => m.id === hoveredStar)?.title}
        </Text>
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  )
}
