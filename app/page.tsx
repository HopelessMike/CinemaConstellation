// app/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { Search, Settings, Info, Home, Maximize2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Canvas } from "@react-three/fiber"
import { StarField } from "./components/StarField"
import { MovieDetailsDialog } from "./components/MovieDetailsDialog"
import LoadingScreen from "./components/LoadingScreen"
import { movieStore } from "@/lib/movieStore"
import { Movie } from "@/lib/types"

export default function MovieUniverseExplorer() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [appState, setAppState] = useState(movieStore.getState())
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = movieStore.subscribe(() => {
      setAppState(movieStore.getState())
    })
    return unsubscribe
  }, [])

  // Load movie data on mount
  useEffect(() => {
    movieStore.loadMovieData()
  }, [])

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsDialogOpen(true)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const resetCamera = () => {
    // Generate new random position
    const clusters = appState.clusters
    if (clusters.length > 0) {
      const randomCluster = clusters[Math.floor(Math.random() * clusters.length)]
      const [cx, cy, cz] = randomCluster.center
      const radius = randomCluster.radius
      
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5
      const distance = radius * (2 + Math.random())
      
      const newPosition: [number, number, number] = [
        cx + Math.cos(angle) * Math.cos(elevation) * distance,
        cy + Math.sin(elevation) * distance,
        cz + Math.sin(angle) * Math.cos(elevation) * distance
      ]
      
      // Update camera position in store
      movieStore.updateCameraPosition(newPosition)
    }
  }

  const filteredMovies = appState.movies.filter(movie =>
    searchQuery.length >= 2 && (
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  )

  const onLoadingComplete = () => {
    // Additional logic when loading completes if needed
    console.log("Cinema Universe loaded successfully!")
  }

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen 
        progress={appState.loadingProgress} 
        isVisible={appState.isLoading}
        onLoadingComplete={onLoadingComplete}
      />

      {/* Main Application */}
      <div className="relative w-full h-screen overflow-hidden bg-black">
        {/* Animated Background */}
        <div
          className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 80%, rgba(147, 51, 234, 0.3) 0%, rgba(79, 70, 229, 0.2) 25%, rgba(236, 72, 153, 0.1) 50%, transparent 70%),
              radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 40%, transparent 70%),
              radial-gradient(ellipse at 40% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)
            `,
          }}
        />

        {/* Particle Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: Math.random() * 0.6 + 0.2
              }}
            />
          ))}
        </div>

        {/* 3D Canvas */}
        <div id="interactive-canvas-container" className="absolute inset-0 z-10">
          <Canvas 
            camera={{ position: appState.cameraPosition, fov: 75 }} 
            style={{ background: "transparent" }}
            gl={{ 
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            }}
          >
            <Suspense fallback={null}>
              <StarField onStarClick={handleMovieClick} />
            </Suspense>
          </Canvas>
        </div>

        {/* UI Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Top Navigation Bar */}
          <div className="absolute top-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="pointer-events-auto">
                <h1 className="text-xl font-bold text-white">Cinema Constellations</h1>
                <p className="text-sm text-cyan-400">Interactive Movie Universe</p>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <div className="relative pointer-events-auto">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full p-2 shadow-2xl">
                    <div className="flex items-center space-x-3 px-4">
                      <Search className="w-5 h-5 text-cyan-400" />
                      <Input
                        placeholder="Search movies, directors, genres..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 focus:outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pointer-events-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowInfo(!showInfo)}
                  className="bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 backdrop-blur-md"
                  title="Information"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetCamera}
                  className="bg-black/40 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 backdrop-blur-md"
                  title="Random Location"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="bg-black/40 border-green-500/30 text-green-400 hover:bg-green-500/10 backdrop-blur-md"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 backdrop-blur-md"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && filteredMovies.length > 0 && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-96 max-w-[90vw] pointer-events-auto z-30">
              <div className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-gray-700/50">
                  <p className="text-sm text-gray-400">
                    {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                {filteredMovies.slice(0, 8).map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center p-3 hover:bg-cyan-500/10 cursor-pointer border-b border-gray-700/50 last:border-b-0 transition-colors"
                    onClick={() => {
                      handleMovieClick(movie)
                      setSearchQuery("")
                    }}
                  >
                    <img
                      src={movie.poster_path || "/placeholder.svg?height=60&width=40"}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded mr-3"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=60&width=40"
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{movie.title}</p>
                      <p className="text-gray-400 text-sm">{movie.release_year} • {movie.director}</p>
                      <div className="flex items-center mt-1 space-x-1">
                        <span className="text-yellow-400 text-xs">★ {movie.rating.toFixed(1)}</span>
                        {movie.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredMovies.length > 8 && (
                  <div className="p-3 text-center text-gray-400 text-sm border-t border-gray-700/50">
                    +{filteredMovies.length - 8} more results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute top-24 right-6 pointer-events-auto z-30">
              <div className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 w-80 max-w-[90vw]">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-cyan-400" />
                  About Cinema Constellations
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    Welcome to an interactive 3D universe where every star represents a movie. 
                    Movies are clustered by genre, theme, and cinematic DNA.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-cyan-400 font-medium">Navigation:</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Drag</strong> to orbit around the universe</li>
                      <li>• <strong>Scroll</strong> to zoom in/out</li>
                      <li>• <strong>Hover</strong> over stars to see movie titles</li>
                      <li>• <strong>Click</strong> stars to explore movie details</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400">
                      Each star's size represents the movie's rating, and colors indicate genres.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-24 right-6 pointer-events-auto z-30">
              <div className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 w-64">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-cyan-400" />
                  Display Settings
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Performance Mode</span>
                    <select className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-xs">
                      <option value="auto">Auto</option>
                      <option value="high">High Quality</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Show Clusters</span>
                    <input type="checkbox" className="text-cyan-500" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Particle Effects</span>
                    <input type="checkbox" className="text-cyan-500" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Auto Rotate</span>
                    <input type="checkbox" className="text-cyan-500" />
                  </div>
                  <div className="pt-2 border-t border-gray-700/50">
                    <button
                      onClick={resetCamera}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded text-xs transition-colors"
                    >
                      Jump to Random Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Display */}
          {!appState.isLoading && (
            <div className="absolute bottom-6 left-6 pointer-events-auto">
              <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 space-y-2">
                <div className="text-cyan-400 font-semibold text-sm">Universe Stats</div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center">
                    <span className="w-4">🎬</span>
                    <span>{appState.movies.length.toLocaleString()} Movies</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">🌌</span>
                    <span>{appState.clusters.length} Constellations</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">✨</span>
                    <span>{movieStore.getVisibleMovies().length} Stars Visible</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">🎯</span>
                    <span>LOD: {appState.levelOfDetail || 'Auto'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions for first-time users */}
          {!appState.isLoading && searchQuery === "" && !showSettings && !showInfo && (
            <div className="absolute bottom-6 right-6 pointer-events-auto max-w-xs">
              <div className="bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
                <div className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                  Pro Tips
                </div>
                <div className="text-gray-300 text-xs space-y-1">
                  <div>• Use <kbd className="bg-gray-800 px-1 rounded">Search</kbd> to find movies</div>
                  <div>• <kbd className="bg-gray-800 px-1 rounded">Home</kbd> button for random teleport</div>
                  <div>• Larger stars = higher ratings</div>
                  <div>• Colors represent genres</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Movie Details Dialog */}
        {selectedMovie && (
          <MovieDetailsDialog 
            movie={selectedMovie} 
            isOpen={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
          />
        )}
      </div>
    </>
  )
}