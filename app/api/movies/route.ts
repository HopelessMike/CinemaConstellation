// app/api/movies/route.ts
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Try to read the movie-data.json file from public folder
    const jsonPath = path.join(process.cwd(), 'public', 'movie-data.json')
    
    try {
      const fileContents = await fs.readFile(jsonPath, 'utf8')
      const movies = JSON.parse(fileContents)
      
      // Return the movie data with caching headers
      return NextResponse.json(movies, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      })
    } catch (fileError) {
      // If file doesn't exist, return sample data for development
      console.log('Movie data file not found at:', jsonPath)
      console.log('Returning sample data for development')
      
      // Sample data for testing
      const sampleMovies = [
        {
          id: 19995,
          title: "Avatar",
          overview: "Jake Sully è un marine costretto su una sedia a rotelle che accetta di trasferirsi sul pianeta Pandora in sostituzione del fratello morto, la cui missione era quella di esplorare il pianeta. Essendo l'atmosfera del pianeta tossica per gli umani sono stati creati degli esseri simili ai nativi Na'vi che possono essere 'guidati' dagli umani.",
          genres: ["Azione", "Avventura", "Fantasy", "Fantascienza"],
          poster_path: "https://image.tmdb.org/t/p/w500/qLQgNd5NcPgEJBN6V9fg14YdIE7.jpg",
          x: 4.4528422356,
          y: 7.1976442337,
          z: 4.6301417351,
          cluster_id: 43,
          neighbor_ids: [285, 206647],
          release_year: 2009,
          duration: 162,
          rating: 7.592,
          director: "James Cameron"
        },
        {
          id: 285,
          title: "Pirati dei Caraibi - Ai confini del mondo",
          overview: "Will Turner, Elizabeth Swann e il capitan Barbossa si alleano per liberare il capitano Jack Sparrow imprigionato negli abissi. Nel frattempo, l'Olandese Volante del capitano Davy Jones, controllato dalla Compagnia delle Indie Orientali, semina il terrore per i Sette Mari.",
          genres: ["Avventura", "Fantasy", "Azione"],
          poster_path: "https://image.tmdb.org/t/p/w500/ruiN32y17YV4BqliTsw3Vyz6Xys.jpg",
          x: 3.5612242222,
          y: 6.1113824844,
          z: 5.8526659012,
          cluster_id: 22,
          neighbor_ids: [19995, 206647],
          release_year: 2007,
          duration: 161,
          rating: 7.262,
          director: "Gore Verbinski"
        },
        {
          id: 206647,
          title: "Spectre",
          overview: "La morte sfila per le strade di Città del Messico e dietro la maschera di un teschio. In missione per conto di M, la defunta M che gli ha lasciato un video e un incarico spinoso da risolvere, James Bond sventa un attentato e uccide Marco Sciarra.",
          genres: ["Azione", "Avventura", "Thriller"],
          poster_path: "https://image.tmdb.org/t/p/w500/qUz6QPWfcPscPgAdvrto3cvGV9I.jpg",
          x: 3.5029387474,
          y: 8.2960681915,
          z: 2.9543821812,
          cluster_id: 46,
          neighbor_ids: [19995, 285],
          release_year: 2015,
          duration: 148,
          rating: 6.56,
          director: "Sam Mendes"
        }
      ]
      
      return NextResponse.json(sampleMovies, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    console.error('Movies API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
