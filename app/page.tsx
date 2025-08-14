// app/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { Search, Settings, Info, Home, Maximize2, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Canvas } from "@react-three/fiber"
import { StarField } from "./components/StarField"
import { MovieDetailsDialog } from "./components/MovieDetailsDialog"
import LoadingScreen from "./components/LoadingScreen"
import SpaceCursor from "./components/SpaceCursor"
import { movieStore } from "@/lib/movieStore"
import { Movie } from "@/lib/types"

export default function MovieUniverseExplorer() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [appState, setAppState] = useState(movieStore.getState())
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showCanvas, setShowCanvas] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Impostazioni UI controllate
  const [forceLOD, setForceLOD] = useState<"auto" | "high" | "medium" | "low">("auto")
  const [showClusters, setShowClusters] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)

  // ✨ Film scelto dalla barra di ricerca verso cui "volare" con la camera
  const [focusMovie, setFocusMovie] = useState<Movie | null>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = movieStore.subscribe(() => {
      setAppState(movieStore.getState())
    })
    return unsubscribe
  }, [])

  // Load movie data on mount
  useEffect(() => {
    setIsInitialLoading(true)
    setShowCanvas(false)
    movieStore.loadMovieData()
  }, [])

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Handle search with null checks
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = movieStore.searchMovies(searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleMovieClick = (movie: Movie) => {
    // Apri dialog e azzera la ricerca
    setSelectedMovie(movie)
    setIsDialogOpen(true)
    setSearchQuery("")
    setSearchResults([])

    // ✨ invece di teletrasportare la camera, chiediamo allo StarField di "volare" verso il film
    setFocusMovie(movie)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const resetCamera = () => {
    const clusters = appState.clusters
    if (clusters.length > 0) {
      const randomCluster = clusters[Math.floor(Math.random() * clusters.length)]
      const [cx, cy, cz] = randomCluster.center
      const radius = randomCluster.radius

      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI * 0.3
      const distance = radius * (0.8 + Math.random() * 1.2)

      const newPosition: [number, number, number] = [
        cx + Math.cos(angle) * Math.cos(elevation) * distance,
        cy + Math.sin(elevation) * distance,
        cz + Math.sin(angle) * Math.cos(elevation) * distance,
      ]

      // Il reset rimane "teletrasporto" per immediatezza
      movieStore.updateCameraPosition(newPosition)
    }
  }

  const onLoadingComplete = () => {
    setTimeout(() => {
      setIsInitialLoading(false)
      setShowCanvas(true)
    }, 100)
  }

  return (
    <>
      {/* Custom Space Cursor */}
      <SpaceCursor />

      {/* Loading Screen */}
      <LoadingScreen
        progress={appState.loadingProgress}
        isVisible={isInitialLoading}
        onLoadingComplete={onLoadingComplete}
      />

      {/* Main Application */}
      <div
        className={`fixed inset-0 w-full h-full overflow-hidden bg-black ${
          !showCanvas ? "opacity-0" : "opacity-100"
        } transition-opacity duration-500`}
      >
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

        {/* 3D Canvas */}
        {showCanvas && (
          <div id="interactive-canvas-container" className="absolute inset-0 z-10">
            <Canvas
              camera={{ position: appState.cameraPosition, fov: 75 }}
              style={{ background: "transparent" }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
            >
              <Suspense fallback={null}>
                <StarField
                  onStarClick={handleMovieClick}
                  forceLOD={forceLOD}
                  showClusters={showClusters}
                  showParticles={showParticles}
                  autoRotate={autoRotate}
                  /** ✨ chiediamo allo StarField di animare la camera verso questo film */
                  focusMovie={focusMovie}
                />
              </Suspense>
            </Canvas>
          </div>
        )}

        {/* UI Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Top Navigation Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="pointer-events-auto">
                <h1 className="text-lg md:text-xl font-bold text-white">Cinema Constellations</h1>
                <p className="text-xs md:text-sm text-cyan-400 hidden md:block">Interactive Movie Universe</p>
              </div>

              {/* Search Bar - Desktop */}
              <div className="flex-1 max-w-xl mx-4 md:mx-8 hidden md:block">
                <div className="relative pointer-events-auto">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full p-2 shadow-2xl">
                    <div className="flex items-center space-x-3 px-4">
                      <Search className="w-5 h-5 text-cyan-400" />
                      <Input
                        placeholder="Cerca film, registi, generi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 focus:outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden pointer-events-auto bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 backdrop-blur-md"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex items-center space-x-2 pointer-events-auto">
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

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-cyan-500/30 p-4 z-30 pointer-events-auto md:hidden">
              {/* Mobile Search */}
              <div className="mb-4">
                <div className="relative bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full p-2">
                  <div className="flex items-center space-x-3 px-3">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <Input
                      placeholder="Cerca film..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 focus:outline-none flex-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Actions - Fixed Layout */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowInfo(!showInfo)
                    setMobileMenuOpen(false)
                  }}
                  className="bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center justify-center p-3 h-16"
                >
                  <Info className="h-4 w-4 mb-1 flex-shrink-0" />
                  <span className="text-xs">Info</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetCamera()
                    setMobileMenuOpen(false)
                  }}
                  className="bg-black/40 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 flex flex-col items-center justify-center p-3 h-16"
                >
                  <Home className="h-4 w-4 mb-1 flex-shrink-0" />
                  <span className="text-xs">Random</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toggleFullscreen()
                    setMobileMenuOpen(false)
                  }}
                  className="bg-black/40 border-green-500/30 text-green-400 hover:bg-green-500/10 flex flex-col items-center justify-center p-3 h-16"
                >
                  <Maximize2 className="h-4 w-4 mb-1 flex-shrink-0" />
                  <span className="text-xs">Full</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSettings(!showSettings)
                    setMobileMenuOpen(false)
                  }}
                  className="bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center justify-center p-3 h-16"
                >
                  <Settings className="h-4 w-4 mb-1 flex-shrink-0" />
                  <span className="text-xs">Settings</span>
                </Button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-20 md:top-24 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-96 max-w-[90vw] pointer-events-auto z-30">
              <div className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
                <div className="p-3 border-b border-gray-700/50">
                  <p className="text-sm text-gray-400">{searchResults.length} film trovati</p>
                </div>
                {searchResults.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center p-3 hover:bg-cyan-500/10 cursor-pointer border-b border-gray-700/50 last:border-b-0 transition-colors"
                    onClick={() => handleMovieClick(movie)}
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
                      <p className="text-gray-400 text-sm">
                        {movie.release_year} • {movie.director || "Regista sconosciuto"}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
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
              </div>
            </div>
          )}

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute top-24 right-6 pointer-events-auto z-30">
              <div className="bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 w-80 max-w-[90vw]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <Info className="w-4 h-4 mr-2 text-cyan-400" />
                    About Cinema Constellations
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInfo(false)}
                    className="md:hidden h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    Benvenuto in un universo 3D interattivo dove ogni stella rappresenta un film. I film sono
                    raggruppati per genere, tema e DNA cinematografico.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-cyan-400 font-medium">Navigazione:</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Trascina</strong> per orbitare nell'universo</li>
                      <li>• <strong>Scroll</strong> per zoom in/out</li>
                      <li>• <strong>Hover</strong> sulle stelle per vedere i titoli</li>
                      <li>• <strong>Click</strong> sulle stelle per i dettagli</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400">
                      La dimensione di ogni stella rappresenta il rating del film, i colori indicano i generi.
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-cyan-400" />
                    Impostazioni Display
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(false)}
                    className="h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Modalità Performance</span>
                    <select
                      className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-xs"
                      value={forceLOD}
                      onChange={(e) => setForceLOD(e.target.value as any)}
                    >
                      <option value="auto">Auto</option>
                      <option value="high">Alta Qualità</option>
                      <option value="medium">Bilanciata</option>
                      <option value="low">Performance</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Mostra Clusters</span>
                    <input
                      type="checkbox"
                      className="text-cyan-500"
                      checked={showClusters}
                      onChange={(e) => setShowClusters(e.target.checked)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Effetti Particelle</span>
                    <input
                      type="checkbox"
                      className="text-cyan-500"
                      checked={showParticles}
                      onChange={(e) => setShowParticles(e.target.checked)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Rotazione Auto</span>
                    <input
                      type="checkbox"
                      className="text-cyan-500"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-700/50">
                    <button
                      onClick={resetCamera}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded text-xs transition-colors"
                    >
                      Salta a Posizione Casuale
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Display - Desktop Only */}
          {!isInitialLoading && (
            <div className="absolute bottom-6 left-6 pointer-events-auto">
              <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 space-y-2">
                <div className="text-cyan-400 font-semibold text-sm">Statistiche Universe</div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center">
                    <span className="w-4">🎬</span>
                    <span>{appState.movies.length.toLocaleString()} Film</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">🌌</span>
                    <span>{appState.clusters.length} Costellazioni</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4">✨</span>
                    <span>{movieStore.getVisibleMovies().length} Stelle Visibili</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips - Desktop Only, Never on Mobile */}
          {!isInitialLoading && !isMobile && searchQuery === "" && !showSettings && !showInfo && (
            <div className="absolute bottom-6 right-6 pointer-events-auto max-w-xs">
              <div className="bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
                <div className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                  Suggerimenti Pro
                </div>
                <div className="text-gray-300 text-xs space-y-1">
                  <div>• Usa <kbd className="bg-gray-800 px-1 rounded">Cerca</kbd> per trovare film</div>
                  <div>• Bottone <kbd className="bg-gray-800 px-1 rounded">Home</kbd> per teletrasporto casuale</div>
                  <div>• Stelle più grandi = rating più alti</div>
                  <div>• I colori rappresentano i generi</div>
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