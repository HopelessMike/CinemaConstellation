// app/components/MovieDetailsDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Clock, Sparkles, ArrowLeft, Loader2 } from "lucide-react"
import { Movie } from "@/lib/types"
import { movieStore } from "@/lib/movieStore"

interface MovieDetailsProps {
  movie: Movie
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function MovieDetailsDialog({ movie, isOpen, onOpenChange }: MovieDetailsProps) {
  const [showSimilarity, setShowSimilarity] = useState(false)
  const [selectedSimilar, setSelectedSimilar] = useState<Movie | null>(null)
  const [typewriterText, setTypewriterText] = useState("")
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([])

  // Load similar movies when dialog opens
  useEffect(() => {
    if (isOpen && movie) {
      const similar = movieStore.getSimilarMovies(movie.id)
      setSimilarMovies(similar.slice(0, 6)) // Limit to 6 for better UX
    }
  }, [isOpen, movie])

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowSimilarity(false)
        setSelectedSimilar(null)
        setTypewriterText("")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const startTypewriter = (text: string) => {
    setTypewriterText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setTypewriterText((prev) => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
      }
    }, 20)
    return () => clearInterval(timer)
  }

  const handleSimilarClick = async (similar: Movie) => {
    setSelectedSimilar(similar)
    setShowSimilarity(true)
    setIsLoadingAnalysis(true)
    
    try {
      const analysis = await movieStore.getLLMAnalysis(movie.id, similar.id)
      setIsLoadingAnalysis(false)
      startTypewriter(analysis)
    } catch (error) {
      setIsLoadingAnalysis(false)
      setTypewriterText("Unable to generate analysis at this time. Please try again later.")
    }
  }

  const formatGenres = (genres: string[]) => {
    return genres.join(" • ")
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black/90 border-cyan-500/30 backdrop-blur-xl p-0">
        <DialogTitle className="sr-only">{movie.title} Details</DialogTitle>
        
        {!showSimilarity ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Movie Poster */}
            <div className="movie-poster-container">
              <div className="relative group">
                <img
                  src={movie.poster_path || "/placeholder.svg?height=400&width=300"}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-2xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=400&width=300"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Movie Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="movie-title">
                <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
                <p className="text-xl text-cyan-400">{movie.director}</p>
              </div>

              <div className="movie-badges flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {movie.release_year}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(movie.duration)}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Star className="w-3 h-3 mr-1" />
                  {movie.rating.toFixed(1)}
                </Badge>
              </div>

              <div className="genres">
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Badge 
                      key={genre} 
                      className="bg-purple-900/50 text-purple-200 border-purple-500/50"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="movie-plot">
                <p className="text-gray-300 leading-relaxed text-justify">
                  {movie.overview}
                </p>
              </div>
            </div>

            {/* Similar Movies Section */}
            <div className="lg:col-span-3 mt-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
                Similar Movies in the Constellation
              </h3>
              
              {similarMovies.length > 0 ? (
                <div className="similar-movies-container overflow-x-auto pb-4">
                  <div className="flex space-x-4 min-w-max">
                    {similarMovies.map((similar) => (
                      <Card
                        key={similar.id}
                        className="flex-shrink-0 w-40 bg-gray-900/50 border-gray-700/50 hover:border-cyan-500/50 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group"
                        onClick={() => handleSimilarClick(similar)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-[2/3] mb-3 relative overflow-hidden rounded">
                            <img
                              src={similar.poster_path || "/placeholder.svg?height=200&width=150"}
                              alt={similar.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=200&width=150"
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-white font-medium line-clamp-2 leading-tight">
                              {similar.title}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>{similar.release_year}</span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                {similar.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No similar movies found in the current constellation.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AI Analysis View */
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-cyan-400" />
                AI Similarity Analysis
              </h2>
              <button
                onClick={() => setShowSimilarity(false)}
                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Details
              </button>
            </div>
            
            {/* Movie Comparison */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="text-center">
                <img
                  src={movie.poster_path || "/placeholder.svg?height=200&width=150"}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg shadow-cyan-500/20 mx-auto"
                />
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-white font-medium">{movie.title}</p>
                  <p className="text-xs text-gray-400">{movie.release_year}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 mb-2"></div>
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 mt-2"></div>
              </div>
              
              <div className="text-center">
                <img
                  src={selectedSimilar?.poster_path || "/placeholder.svg?height=200&width=150"}
                  alt={selectedSimilar?.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg shadow-purple-500/20 mx-auto"
                />
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-white font-medium">{selectedSimilar?.title}</p>
                  <p className="text-xs text-gray-400">{selectedSimilar?.release_year}</p>
                </div>
              </div>
            </div>
            
            {/* Analysis Content */}
            <Card className="bg-gray-900/50 border-l-4 border-l-cyan-500 border-gray-700/50">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
                  {isLoadingAnalysis && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cinematic DNA Analysis
                </h4>
                
                {isLoadingAnalysis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                      <p className="text-gray-400">Analyzing cinematic connections...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed typewriter">
                      {typewriterText}
                    </p>
                    
                    {typewriterText && (
                      <div className="pt-4 border-t border-gray-700/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-cyan-400 font-medium">Shared Elements:</span>
                            <div className="mt-1 space-x-2">
                              {movie.genres
                                .filter(genre => selectedSimilar?.genres.includes(genre))
                                .map(genre => (
                                  <Badge key={genre} variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                                    {genre}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-purple-400 font-medium">Era Proximity:</span>
                            <p className="text-gray-400 text-xs mt-1">
                              {Math.abs((selectedSimilar?.release_year || 0) - movie.release_year)} years apart
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}