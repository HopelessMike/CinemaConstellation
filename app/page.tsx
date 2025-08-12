"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Plus, Sparkles } from "lucide-react"
import Image from "next/image"
import { Canvas } from "@react-three/fiber"
import { StarField } from "./components/StarField"

export default function MovieUniverseExplorer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Static background stars
  const backgroundStars = useMemo(
    () =>
      [...Array(50)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    [],
  )

  // Mock movie database for search
  const movieDatabase = [
    { id: "1", title: "Interstellar", poster: "/placeholder.svg?height=40&width=30&text=Interstellar" },
    { id: "2", title: "Arrival", poster: "/placeholder.svg?height=40&width=30&text=Arrival" },
    { id: "3", title: "Gravity", poster: "/placeholder.svg?height=40&width=30&text=Gravity" },
    { id: "4", title: "The Martian", poster: "/placeholder.svg?height=40&width=30&text=Martian" },
    { id: "5", title: "Blade Runner 2049", poster: "/placeholder.svg?height=40&width=30&text=BladeRunner" },
    { id: "6", title: "Ex Machina", poster: "/placeholder.svg?height=40&width=30&text=ExMachina" },
    { id: "7", title: "Dune", poster: "/placeholder.svg?height=40&width=30&text=Dune" },
    { id: "8", title: "Avatar", poster: "/placeholder.svg?height=40&width=30&text=Avatar" },
    { id: "9", title: "Inception", poster: "/placeholder.svg?height=40&width=30&text=Inception" },
    { id: "10", title: "The Matrix", poster: "/placeholder.svg?height=40&width=30&text=Matrix" },
  ]

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    return movieDatabase.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
  }, [searchQuery])

  const [selectedMovie, setSelectedMovie] = useState({
    title: "Interstellar",
    poster: "/placeholder.svg?height=400&width=300",
    genre: "Sci-Fi",
    year: "2014",
    rating: "8.6/10",
    plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
  })

  const similarMovies = [
    { title: "Arrival", poster: "/placeholder.svg?height=200&width=150" },
    { title: "Gravity", poster: "/placeholder.svg?height=200&width=150" },
    { title: "The Martian", poster: "/placeholder.svg?height=200&width=150" },
    { title: "Blade Runner 2049", poster: "/placeholder.svg?height=200&width=150" },
    { title: "Ex Machina", poster: "/placeholder.svg?height=200&width=150" },
  ]

  const comparisonMovie = {
    title: "Arrival",
    poster: "/placeholder.svg?height=300&width=200",
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Nebula Background */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black animate-pulse"
        style={{
          backgroundImage: `radial-gradient(ellipse at top, rgba(147, 51, 234, 0.3) 0%, rgba(79, 70, 229, 0.2) 25%, rgba(236, 72, 153, 0.1) 50%, transparent 70%),
                           radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 40%, transparent 70%)`,
        }}
      />

      {/* Static Background Stars */}
      <div className="fixed inset-0 overflow-hidden">
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Interactive 3D Canvas */}
      <div id="interactive-canvas-container" className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }} style={{ background: "transparent" }}>
          <StarField
            onStarClick={(movie) => {
              setSelectedMovie(movie)
              setIsDialogOpen(true)
              setShowAIAnalysis(false)
            }}
          />
        </Canvas>
      </div>

      {/* Floating Search Bar with Suggestions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-sm animate-pulse" />
          <div className="relative flex items-center space-x-3 px-6 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-full shadow-2xl">
            <Search className="w-5 h-5 text-white/70 drop-shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
            <Input
              placeholder="Search for a movie title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white placeholder:text-white/50 focus:ring-0 focus:ring-offset-0 w-80"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl overflow-hidden">
              {searchSuggestions.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => {
                    const movieData = movieDatabase.find((m) => m.id === movie.id)
                    if (movieData) {
                      setSelectedMovie({
                        title: movieData.title,
                        poster: "/placeholder.svg?height=400&width=300",
                        genre: "Sci-Fi",
                        year: "2014",
                        rating: "8.6/10",
                        plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                      })
                      setIsDialogOpen(true)
                      setSearchQuery("")
                    }
                  }}
                >
                  <Image
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    width={30}
                    height={40}
                    className="rounded border border-white/20"
                  />
                  <span className="text-white text-sm">{movie.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Movie Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-lg" />

          {!showAIAnalysis ? (
            <div className="relative">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Movie Details
                </DialogTitle>
              </DialogHeader>

              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* Left Column - Movie Poster */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg blur-lg" />
                    <Image
                      src={selectedMovie.poster || "/placeholder.svg"}
                      alt={selectedMovie.title}
                      width={300}
                      height={400}
                      className="relative rounded-lg shadow-2xl border border-white/20"
                    />
                  </div>
                </div>

                {/* Right Column - Movie Info */}
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {selectedMovie.title}
                  </h1>

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                      {selectedMovie.genre}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                      {selectedMovie.year}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                      {selectedMovie.rating}
                    </Badge>
                  </div>

                  {/* Plot Summary */}
                  <p className="text-gray-300 leading-relaxed">{selectedMovie.plot}</p>
                </div>
              </div>

              {/* Similar Movies Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Nearby Stars: Similar Movies
                </h3>

                <div
                  className="similar-movies-scroll flex space-x-4 overflow-x-auto pb-4 pr-4"
                  style={{ maxWidth: "100%" }}
                >
                  {similarMovies.map((movie, index) => (
                    <Card
                      key={index}
                      className="flex-shrink-0 w-32 bg-black/40 border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group"
                      onClick={() => setShowAIAnalysis(true)}
                    >
                      <CardContent className="p-3">
                        <div className="relative mb-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                          <Image
                            src={movie.poster || "/placeholder.svg"}
                            alt={movie.title}
                            width={150}
                            height={200}
                            className="relative w-full rounded border border-white/10"
                          />
                        </div>
                        <p className="text-xs text-center text-gray-300 group-hover:text-white transition-colors">
                          {movie.title}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* AI Similarity Explanation View */
            <div className="relative">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Aura AI Analysis
                </DialogTitle>
              </DialogHeader>

              {/* Movie Comparison */}
              <div className="flex items-center justify-center space-x-8 mt-6">
                <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg blur-lg" />
                    <Image
                      src={selectedMovie.poster || "/placeholder.svg"}
                      alt={selectedMovie.title}
                      width={200}
                      height={300}
                      className="relative rounded-lg border border-white/20"
                    />
                  </div>
                  <p className="mt-2 font-semibold">{selectedMovie.title}</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Connected by</p>
                </div>

                <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg blur-lg" />
                    <Image
                      src={comparisonMovie.poster || "/placeholder.svg"}
                      alt={comparisonMovie.title}
                      width={200}
                      height={300}
                      className="relative rounded-lg border border-white/20"
                    />
                  </div>
                  <p className="mt-2 font-semibold">{comparisonMovie.title}</p>
                </div>
              </div>

              {/* AI Analysis Card */}
              <Card className="mt-8 bg-black/40 border-l-4 border-l-blue-500 border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                    <h4 className="text-lg font-semibold text-blue-400">Aura AI Analysis:</h4>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <p className="animate-pulse">
                      Both films explore humanity's relationship with the unknown and our place in the cosmos. They
                      share themes of communication across impossible barriers - whether through time and gravity in
                      Interstellar, or through language and consciousness in Arrival.
                    </p>
                    <p className="animate-pulse" style={{ animationDelay: "1s" }}>
                      The protagonists in both stories are driven by love and sacrifice for their children, using
                      science as a bridge between the emotional and the rational. Both films question linear time and
                      suggest that love transcends physical dimensions.
                    </p>
                    <p className="animate-pulse" style={{ animationDelay: "2s" }}>
                      Visually, both directors use practical effects and grounded science fiction to create believable
                      otherworldly experiences, making the impossible feel tangible and emotionally resonant.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowAIAnalysis(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Back to Movie Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
