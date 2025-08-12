"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Canvas } from "@react-three/fiber"
import { StarField } from "./components/StarField"
import { MovieDetailsDialog } from "./components/MovieDetailsDialog"
import { Movie } from "@/lib/types" // <-- CORREZIONE: Usa il tipo centralizzato

export default function MovieUniverseExplorer() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsDialogOpen(true)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div
        className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black animate-pulse"
        style={{
          backgroundImage: `radial-gradient(ellipse at top, rgba(147, 51, 234, 0.3) 0%, rgba(79, 70, 229, 0.2) 25%, rgba(236, 72, 153, 0.1) 50%, transparent 70%),
                           radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 40%, transparent 70%)`,
        }}
      />
      <div id="interactive-canvas-container" className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 15], fov: 75 }} style={{ background: "transparent" }}>
          <StarField onStarClick={handleMovieClick} />
        </Canvas>
      </div>
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full p-2 shadow-2xl">
            <div className="flex items-center space-x-3 px-4">
              <Search className="w-5 h-5 text-cyan-400" />
              <Input
                placeholder="Search the universe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 focus:outline-none w-80"
              />
            </div>
          </div>
        </div>
      </div>
      {selectedMovie && (
        <MovieDetailsDialog 
          movie={selectedMovie} 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
        />
      )}
    </div>
  )
}