"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Clock, Globe, Sparkles } from "lucide-react"
import { Movie } from "@/lib/types"

const similarMovies = [
  { id: 4, title: "Arrival", poster: "/placeholder.svg?height=200&width=150" },
  { id: 5, title: "Ex Machina", poster: "/placeholder.svg?height=200&width=150" },
  { id: 6, title: "Her", poster: "/placeholder.svg?height=200&width=150" },
  { id: 7, title: "Ghost in the Shell", poster: "/placeholder.svg?height=200&width=150" },
  { id: 8, title: "Minority Report", poster: "/placeholder.svg?height=200&width=150" },
];

interface MovieDetailsProps {
  movie: Movie
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function MovieDetailsDialog({ movie, isOpen, onOpenChange }: MovieDetailsProps) {
  const [showSimilarity, setShowSimilarity] = useState(false)
  const [selectedSimilar, setSelectedSimilar] = useState<(typeof similarMovies)[0] | null>(null)
  const [typewriterText, setTypewriterText] = useState("")

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowSimilarity(false)
        setSelectedSimilar(null)
      }, 300); // Ritarda il reset per permettere l'animazione di chiusura
      return () => clearTimeout(timer);
    }
  }, [isOpen])

  const aiAnalysis = `Both films explore the profound relationship between humanity and artificial intelligence, but through distinctly different lenses. While ${movie.title} focuses on the existential questions of consciousness and reality, ${selectedSimilar?.title} examines the emotional connections we form with AI entities. The visual storytelling in both films uses similar techniques of contrasting sterile technological environments with deeply human moments of vulnerability and connection.`;

  const startTypewriter = (text: string) => {
    setTypewriterText("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setTypewriterText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 20);
  };

  const handleSimilarClick = (similar: (typeof similarMovies)[0]) => {
    setSelectedSimilar(similar);
    setShowSimilarity(true);
    startTypewriter(aiAnalysis);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/80 border-cyan-500/30 backdrop-blur-xl p-0">
        <DialogTitle className="sr-only">{movie.title} Details</DialogTitle>
        
        {!showSimilarity ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="movie-poster-container">
              <div className="relative group">
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-2xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="movie-title">
                <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
              </div>

              <div className="movie-badges flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {movie.year || "N/A"}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {movie.runtime || "N/A"} min
                </Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Globe className="w-3 h-3 mr-1" />
                  {movie.genre || "N/A"}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                  <Star className="w-3 h-3 mr-1" />
                  {movie.rating || "N/A"}
                </Badge>
              </div>

              <div className="movie-plot">
                <p className="text-gray-300 leading-relaxed">{movie.plot}</p>
              </div>

              <div className="director-info">
                <p className="text-sm text-gray-400">
                  <span className="text-cyan-400">Directed by:</span> {movie.director || "N/A"}
                </p>
              </div>
            </div>

            <div className="md:col-span-3 mt-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
                Nearby Stars: Similar Movies
              </h3>
              <div className="similar-movies-container overflow-x-auto pb-4">
                <div className="flex space-x-4 min-w-max">
                  {similarMovies.map((similar) => (
                    <Card
                      key={similar.id}
                      className="flex-shrink-0 w-32 bg-gray-900/50 border-gray-700/50 hover:border-cyan-500/50 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer"
                      onClick={() => handleSimilarClick(similar)}
                    >
                      <CardContent className="p-2">
                        <div className="aspect-[2/3] mb-2">
                          <img
                            src={similar.poster || "/placeholder.svg"}
                            alt={similar.title}
                            className="w-full h-full object-cover rounded"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-xs text-white text-center truncate">{similar.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">AI Analysis</h2>
              <button
                onClick={() => setShowSimilarity(false)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ← Back to Details
              </button>
            </div>
            <div className="flex justify-center space-x-8 mb-6">
              <div className="text-center">
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg shadow-cyan-500/20"
                />
                <p className="text-sm text-white mt-2">{movie.title}</p>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
              </div>
              <div className="text-center">
                <img
                  src={selectedSimilar?.poster || "/placeholder.svg"}
                  alt={selectedSimilar?.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg shadow-purple-500/20"
                />
                <p className="text-sm text-white mt-2">{selectedSimilar?.title}</p>
              </div>
            </div>
            <Card className="bg-gray-900/50 border-l-4 border-l-cyan-500 border-gray-700/50">
              <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-cyan-400 mb-3">Similarity Analysis</h4>
                  <p className="text-gray-300 leading-relaxed typewriter">
                    {typewriterText}
                  </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}