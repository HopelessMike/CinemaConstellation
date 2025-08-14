// lib/types.ts
export interface Movie {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  poster_path: string;
  x: number;
  y: number;
  z: number;
  cluster_id: number;
  neighbor_ids: number[];
  release_year: number;
  duration: number;
  rating: number;
  director: string;
  // Additional computed properties
  position?: [number, number, number];
  color?: string;
  size?: number;
}

export interface MovieCluster {
  id: number;
  movies: Movie[];
  center: [number, number, number];
  radius: number;
  color: string;
  genre: string;
}

export interface LLMAnalysis {
  movie1Id: number;
  movie2Id: number;
  analysis: string;
  timestamp: number;
}

export interface AppState {
  movies: Movie[];
  clusters: MovieCluster[];
  selectedMovie: Movie | null;
  isLoading: boolean;
  loadingProgress: number;
  currentClusterView: number | null;
  cameraPosition: [number, number, number];
  llmCache: Map<string, LLMAnalysis>;
  levelOfDetail: 'high' | 'medium' | 'low';
}
