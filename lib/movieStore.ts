// lib/movieStore.ts
import { Movie, MovieCluster, LLMAnalysis, AppState } from './types';

class MovieStore {
  private state: AppState = {
    movies: [],
    clusters: [],
    selectedMovie: null,
    isLoading: true,
    loadingProgress: 0,
    currentClusterView: null,
    cameraPosition: [0, 0, 15],
    llmCache: new Map()
  };

  private listeners: (() => void)[] = [];
  private visibleMovies: Set<number> = new Set();
  private clustersInView: Set<number> = new Set();

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AppState {
    return { ...this.state, llmCache: new Map(this.state.llmCache) };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  async loadMovieData(): Promise<void> {
    try {
      this.updateLoadingProgress(10);
      
      // Simulate fetching movie data
      const response = await fetch('/api/movies');
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      
      this.updateLoadingProgress(40);
      
      const rawMovies: Movie[] = await response.json();
      
      this.updateLoadingProgress(60);
      
      // Process movies and add computed properties
      const processedMovies = this.processMovieData(rawMovies);
      
      this.updateLoadingProgress(80);
      
      // Create clusters for performance
      const clusters = this.createClusters(processedMovies);
      
      // Generate random starting camera position
      const randomCamera = this.generateRandomCameraPosition(clusters);
      
      this.state.movies = processedMovies;
      this.state.clusters = clusters;
      this.state.cameraPosition = randomCamera;
      this.state.isLoading = false;
      this.state.loadingProgress = 100;
      
      this.notify();
    } catch (error) {
      console.error('Error loading movie data:', error);
      this.state.isLoading = false;
      this.notify();
    }
  }

  private updateLoadingProgress(progress: number) {
    this.state.loadingProgress = progress;
    this.notify();
  }

  private processMovieData(movies: Movie[]): Movie[] {
    return movies.map(movie => ({
      ...movie,
      position: [movie.x, movie.y, movie.z] as [number, number, number],
      color: this.getColorByGenre(movie.genres[0] || 'Unknown'),
      size: Math.max(0.5, Math.min(1.5, movie.rating / 10))
    }));
  }

  private getColorByGenre(genre: string): string {
    const colorMap: { [key: string]: string } = {
      'Azione': '#ff6b6b',
      'Avventura': '#4ecdc4',
      'Commedia': '#ffe66d',
      'Drammatico': '#a8e6cf',
      'Fantasy': '#ff8b94',
      'Horror': '#c7ceea',
      'Romantico': '#ffd3a5',
      'Fantascienza': '#8b5cf6',
      'Thriller': '#3b82f6',
      'Western': '#d4a574',
      'Animazione': '#ffaaa5',
      'Documentario': '#a8dadc'
    };
    return colorMap[genre] || '#64748b';
  }

  private createClusters(movies: Movie[]): MovieCluster[] {
    const clusterMap = new Map<number, Movie[]>();
    
    movies.forEach(movie => {
      if (!clusterMap.has(movie.cluster_id)) {
        clusterMap.set(movie.cluster_id, []);
      }
      clusterMap.get(movie.cluster_id)!.push(movie);
    });

    return Array.from(clusterMap.entries()).map(([clusterId, clusterMovies]) => {
      const center = this.calculateClusterCenter(clusterMovies);
      const radius = this.calculateClusterRadius(clusterMovies, center);
      const dominantGenre = this.getDominantGenre(clusterMovies);
      
      return {
        id: clusterId,
        movies: clusterMovies,
        center,
        radius,
        color: this.getColorByGenre(dominantGenre),
        genre: dominantGenre
      };
    });
  }

  private calculateClusterCenter(movies: Movie[]): [number, number, number] {
    const sum = movies.reduce(
      (acc, movie) => [acc[0] + movie.x, acc[1] + movie.y, acc[2] + movie.z],
      [0, 0, 0]
    );
    return [sum[0] / movies.length, sum[1] / movies.length, sum[2] / movies.length];
  }

  private calculateClusterRadius(movies: Movie[], center: [number, number, number]): number {
    const maxDistance = Math.max(
      ...movies.map(movie => 
        Math.sqrt(
          Math.pow(movie.x - center[0], 2) +
          Math.pow(movie.y - center[1], 2) +
          Math.pow(movie.z - center[2], 2)
        )
      )
    );
    return maxDistance * 1.2; // 20% padding
  }

  private getDominantGenre(movies: Movie[]): string {
    const genreCount = new Map<string, number>();
    movies.forEach(movie => {
      movie.genres.forEach(genre => {
        genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
      });
    });
    
    let maxCount = 0;
    let dominantGenre = 'Unknown';
    genreCount.forEach((count, genre) => {
      if (count > maxCount) {
        maxCount = count;
        dominantGenre = genre;
      }
    });
    
    return dominantGenre;
  }

  private generateRandomCameraPosition(clusters: MovieCluster[]): [number, number, number] {
    if (clusters.length === 0) return [0, 0, 15];
    
    const randomCluster = clusters[Math.floor(Math.random() * clusters.length)];
    const [cx, cy, cz] = randomCluster.center;
    const radius = randomCluster.radius;
    
    // Position camera at cluster edge with some randomness
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
    const distance = radius * (2 + Math.random());
    
    return [
      cx + Math.cos(angle) * Math.cos(elevation) * distance,
      cy + Math.sin(elevation) * distance,
      cz + Math.sin(angle) * Math.cos(elevation) * distance
    ];
  }

  // Performance optimization: Track visible movies
  updateVisibleMovies(cameraPosition: [number, number, number], maxDistance: number = 50) {
    this.visibleMovies.clear();
    this.clustersInView.clear();
    
    this.state.clusters.forEach(cluster => {
      const distance = Math.sqrt(
        Math.pow(cluster.center[0] - cameraPosition[0], 2) +
        Math.pow(cluster.center[1] - cameraPosition[1], 2) +
        Math.pow(cluster.center[2] - cameraPosition[2], 2)
      );
      
      if (distance <= maxDistance + cluster.radius) {
        this.clustersInView.add(cluster.id);
        cluster.movies.forEach(movie => this.visibleMovies.add(movie.id));
      }
    });
  }

  getVisibleMovies(): Movie[] {
    return this.state.movies.filter(movie => this.visibleMovies.has(movie.id));
  }

  getClustersInView(): MovieCluster[] {
    return this.state.clusters.filter(cluster => this.clustersInView.has(cluster.id));
  }

  setSelectedMovie(movie: Movie | null) {
    this.state.selectedMovie = movie;
    this.notify();
  }

  // LLM Analysis caching
  async getLLMAnalysis(movie1Id: number, movie2Id: number): Promise<string> {
    const cacheKey = `${Math.min(movie1Id, movie2Id)}-${Math.max(movie1Id, movie2Id)}`;
    
    // Check cache first
    const cached = this.state.llmCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours cache
      return cached.analysis;
    }

    try {
      // Make API call to LLM
      const response = await fetch('/api/llm-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie1Id, movie2Id })
      });

      if (!response.ok) {
        throw new Error('LLM API call failed');
      }

      const { analysis } = await response.json();
      
      // Cache the result
      this.state.llmCache.set(cacheKey, {
        movie1Id,
        movie2Id,
        analysis,
        timestamp: Date.now()
      });

      this.notify();
      return analysis;
    } catch (error) {
      console.error('Error getting LLM analysis:', error);
      return "Unable to generate similarity analysis at this time.";
    }
  }

  getMovieById(id: number): Movie | undefined {
    return this.state.movies.find(movie => movie.id === id);
  }

  getSimilarMovies(movieId: number): Movie[] {
    const movie = this.getMovieById(movieId);
    if (!movie) return [];
    
    return movie.neighbor_ids
      .map(id => this.getMovieById(id))
      .filter(Boolean) as Movie[];
  }
}

export const movieStore = new MovieStore();