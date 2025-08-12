// app/api/movies/route.ts
import { NextResponse } from 'next/server'
import { Movie } from '@/lib/types'

// Mock data loader - replace with actual database connection
async function loadMoviesFromDatabase(): Promise<Movie[]> {
  // In production, this would connect to your database
  // For now, we'll simulate loading from a JSON file
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In production, replace this with actual database query
    // const movies = await db.movies.findMany()
    
    // Mock data structure - replace with actual movie_data.json import
    const mockMovies: Movie[] = [
      {
        id: 19995,
        title: "Avatar",
        overview: "Jake Sully è un marine costretto su una sedia a rotelle che accetta di trasferirsi sul pianeta Pandora in sostituzione del fratello morto...",
        genres: ["Azione", "Avventura", "Fantasy", "Fantascienza"],
        poster_path: "https://image.tmdb.org/t/p/w500/qLQgNd5NcPgEJBN6V9fg14YdIE7.jpg",
        x: 4.4528422356,
        y: 7.1976442337,
        z: 4.6301417351,
        cluster_id: 43,
        neighbor_ids: [11935, 1272, 8077, 95, 8870],
        release_year: 2009,
        duration: 162,
        rating: 7.592,
        director: "James Cameron"
      },
      // Add more movies here...
    ]
    
    return mockMovies
  } catch (error) {
    console.error('Error loading movies:', error)
    throw new Error('Failed to load movie data')
  }
}

export async function GET() {
  try {
    const movies = await loadMoviesFromDatabase()
    
    return NextResponse.json(movies, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Movies API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}

// app/api/llm-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Movie } from '@/lib/types'

// Database interface for caching (replace with your actual DB)
interface AnalysisCache {
  movie1_id: number
  movie2_id: number
  analysis: string
  created_at: Date
}

async function getCachedAnalysis(movie1Id: number, movie2Id: number): Promise<string | null> {
  // In production, query your database
  // const cached = await db.analysisCache.findFirst({
  //   where: {
  //     OR: [
  //       { movie1_id: movie1Id, movie2_id: movie2Id },
  //       { movie1_id: movie2Id, movie2_id: movie1Id }
  //     ]
  //   }
  // })
  // return cached?.analysis || null
  
  // Mock implementation
  return null
}

async function saveAnalysisToCache(movie1Id: number, movie2Id: number, analysis: string): Promise<void> {
  // In production, save to your database
  // await db.analysisCache.create({
  //   data: {
  //     movie1_id: movie1Id,
  //     movie2_id: movie2Id,
  //     analysis,
  //     created_at: new Date()
  //   }
  // })
  
  console.log(`Cached analysis for movies ${movie1Id} and ${movie2Id}`)
}

async function getMovieById(id: number): Promise<Movie | null> {
  // In production, query your database
  // return await db.movies.findUnique({ where: { id } })
  
  // Mock implementation
  return null
}

async function callLLMAPI(movie1: Movie, movie2: Movie): Promise<string> {
  // Replace with your actual LLM API call
  const prompt = `Analyze the similarities between these two movies:

Movie 1: "${movie1.title}" (${movie1.release_year})
Director: ${movie1.director}
Genres: ${movie1.genres.join(', ')}
Plot: ${movie1.overview}

Movie 2: "${movie2.title}" (${movie2.release_year})
Director: ${movie2.director}
Genres: ${movie2.genres.join(', ')}
Plot: ${movie2.overview}

Provide a detailed analysis of their similarities in themes, style, narrative structure, and cinematic techniques. Be specific and insightful.`

  try {
    // Example using OpenAI API - replace with your preferred LLM service
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a film critic and cinema expert. Provide detailed, insightful analysis of movie similarities focusing on themes, cinematography, narrative structure, and artistic elements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate analysis.'
    
  } catch (error) {
    console.error('LLM API call failed:', error)
    
    // Fallback to template-based analysis
    return `Both "${movie1.title}" and "${movie2.title}" share compelling narrative elements that demonstrate the evolution of ${movie1.genres[0]?.toLowerCase()} cinema. While "${movie1.title}" (${movie1.release_year}) explores themes through the lens of ${movie1.director}'s distinctive directorial style, "${movie2.title}" (${movie2.release_year}) offers a complementary perspective under ${movie2.director}'s vision. The films connect through their shared exploration of human nature, their innovative approach to visual storytelling, and their ability to blend entertainment with deeper philosophical questions. Both works demonstrate how contemporary cinema can address universal themes while pushing the boundaries of their respective genres.`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { movie1Id, movie2Id } = await request.json()
    
    if (!movie1Id || !movie2Id) {
      return NextResponse.json(
        { error: 'Both movie1Id and movie2Id are required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cached = await getCachedAnalysis(movie1Id, movie2Id)
    if (cached) {
      return NextResponse.json({ analysis: cached })
    }

    // Get movie details
    const [movie1, movie2] = await Promise.all([
      getMovieById(movie1Id),
      getMovieById(movie2Id)
    ])

    if (!movie1 || !movie2) {
      return NextResponse.json(
        { error: 'One or both movies not found' },
        { status: 404 }
      )
    }

    // Generate analysis
    const analysis = await callLLMAPI(movie1, movie2)
    
    // Cache the result
    await saveAnalysisToCache(movie1Id, movie2Id, analysis)
    
    return NextResponse.json({ analysis })
    
  } catch (error) {
    console.error('LLM Analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}

// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}