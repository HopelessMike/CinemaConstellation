// lib/movieStore.ts
import { Movie, MovieCluster, AppState } from './types';

class MovieStore {
  private state: AppState = {
    movies: [],
    clusters: [],
    selectedMovie: null,
    isLoading: true,
    loadingProgress: 0,
    currentClusterView: null,
    cameraPosition: [0, 0, 30],
    llmCache: new Map(),      // Map<string, { movie1Id, movie2Id, analysis, timestamp }>
    levelOfDetail: 'high',
  };

  private listeners: (() => void)[] = [];
  private visibleMovies: Set<number> = new Set();
  private clustersInView: Set<number> = new Set();

  // Stato transitorio per lo streaming in corso: key -> partial text + controller
  private llmProgress = new Map<
    string,
    { text: string; controller: AbortController }
  >();

  // ——————————————————————————————————————————————————————————
  // Pub/Sub
  // ——————————————————————————————————————————————————————————
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getState(): AppState {
    // Evita di esporre la Map interna mutabile
    return { ...this.state, llmCache: new Map(this.state.llmCache) } as AppState;
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ——————————————————————————————————————————————————————————
  // Caricamento dati film
  // ——————————————————————————————————————————————————————————
  async loadMovieData(): Promise<void> {
    try {
      this.updateLoadingProgress(10);

      const response = await fetch('/movie-data.json');
      if (!response.ok) throw new Error('Failed to fetch movies');

      this.updateLoadingProgress(40);
      const rawMovies: Movie[] = await response.json();

      this.updateLoadingProgress(60);
      const processedMovies = this.processMovieData(rawMovies);

      this.updateLoadingProgress(80);
      const clusters = this.createClustersFromData(processedMovies);

      const randomCamera = this.generateOptimalCameraPosition(
        clusters,
        processedMovies,
      );

      this.state.movies = processedMovies;
      this.state.clusters = clusters;
      this.state.cameraPosition = randomCamera;
      this.state.isLoading = false;
      this.state.loadingProgress = 100;
      this.notify();
    } catch (error) {
      console.error('Error loading movie data:', error);

      // Fallback: API interna
      try {
        const response = await fetch('/api/movies');
        if (response.ok) {
          const rawMovies: Movie[] = await response.json();
          const processedMovies = this.processMovieData(rawMovies);
          const clusters = this.createClustersFromData(processedMovies);
          const randomCamera = this.generateOptimalCameraPosition(
            clusters,
            processedMovies,
          );

          this.state.movies = processedMovies;
          this.state.clusters = clusters;
          this.state.cameraPosition = randomCamera;
        }
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
      }

      this.state.isLoading = false;
      this.state.loadingProgress = 100;
      this.notify();
    }
  }

  private updateLoadingProgress(progress: number) {
    this.state.loadingProgress = progress;
    this.notify();
  }

  private processMovieData(movies: Movie[]): Movie[] {
    const POSITION_SCALE = 5;
    return movies.map((movie) => {
      const jitter = () => (Math.random() - 0.5) * 0.5;

      const scaledX = movie.x * POSITION_SCALE + jitter();
      const scaledY = movie.y * POSITION_SCALE + jitter();
      const scaledZ = movie.z * POSITION_SCALE + jitter();

      return {
        ...movie,
        position: [scaledX, scaledY, scaledZ] as [number, number, number],
        color: this.getColorByGenre(movie.genres?.[0] || 'Unknown'),
        size: Math.max(0.4, Math.min(1.0, (movie.rating / 10) * 1.2)),
      };
    });
  }

  private getColorByGenre(genre: string): string {
    const colorMap: Record<string, string> = {
      Azione: '#ff6b6b',
      Avventura: '#4ecdc4',
      Commedia: '#ffe66d',
      Drammatico: '#a8e6cf',
      Fantasy: '#ff8b94',
      Horror: '#c7ceea',
      Romantico: '#ffd3a5',
      Fantascienza: '#8b5cf6',
      Thriller: '#3b82f6',
      Western: '#d4a574',
      Animazione: '#ffaaa5',
      Documentario: '#a8dadc',
      Crime: '#ff6b9d',
      Mistero: '#c44569',
      Musica: '#f8b500',
      Guerra: '#786fa6',
      Storia: '#f19066',
      Famiglia: '#c7ecee',
      Sport: '#22a6b3',
      Biografico: '#6c5ce7',
    };
    return colorMap[genre] || '#64748b';
  }

  private createClustersFromData(movies: Movie[]): MovieCluster[] {
    const clusterMap = new Map<number, Movie[]>();
    const POSITION_SCALE = 5;

    movies.forEach((m) => {
      if (!clusterMap.has(m.cluster_id)) clusterMap.set(m.cluster_id, []);
      clusterMap.get(m.cluster_id)!.push(m);
    });

    return Array.from(clusterMap.entries()).map(([clusterId, clusterMovies]) => {
      const center = this.calculateCenter(clusterMovies, POSITION_SCALE);
      const radius = this.calculateRadius(clusterMovies, center);
      const dominantGenre = this.getDominantGenre(clusterMovies);

      return {
        id: clusterId,
        movies: clusterMovies,
        center,
        radius,
        color: this.getColorByGenre(dominantGenre),
        genre: dominantGenre,
      };
    });
  }

  private calculateCenter(
    movies: Movie[],
    scale: number = 1,
  ): [number, number, number] {
    if (movies.length === 0) return [0, 0, 0];
    const sum = movies.reduce(
      (acc, m) => [acc[0] + m.x * scale, acc[1] + m.y * scale, acc[2] + m.z * scale],
      [0, 0, 0],
    );
    return [sum[0] / movies.length, sum[1] / movies.length, sum[2] / movies.length];
  }

  private calculateRadius(
    movies: Movie[],
    center: [number, number, number],
  ): number {
    if (movies.length === 0) return 1;
    const distances = movies.map((m) => {
      const pos = (m as any).position || [m.x, m.y, m.z];
      return Math.hypot(pos[0] - center[0], pos[1] - center[1], pos[2] - center[2]);
    });
    return Math.max(...distances) * 1.2;
  }

  private getDominantGenre(movies: Movie[]): string {
    const map = new Map<string, number>();
    movies.forEach((m) => {
      (m.genres || []).forEach((g) => map.set(g, (map.get(g) || 0) + 1));
    });
    let best = 'Unknown';
    let max = 0;
    for (const [g, n] of map) {
      if (n > max) {
        max = n;
        best = g;
      }
    }
    return best;
  }

  private generateOptimalCameraPosition(
    clusters: MovieCluster[],
    movies: Movie[],
  ): [number, number, number] {
    if (clusters.length === 0) return [0, 0, 30];
    const densest = clusters.reduce((a, b) => (b.movies.length > a.movies.length ? b : a));
    const [cx, cy, cz] = densest.center;
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.2;
    const distance = densest.radius * 0.8;

    return [
      cx + Math.cos(angle) * Math.cos(elevation) * distance,
      cy + Math.sin(elevation) * distance * 0.5,
      cz + Math.sin(angle) * Math.cos(elevation) * distance,
    ];
  }

  updateCameraPosition(position: [number, number, number]) {
    this.state.cameraPosition = position;
    this.notify();
  }

  getCameraTargetForMovie(movieId: number): [number, number, number] | null {
    const movie = this.getMovieById(movieId);
    if (!movie || !movie.position) return null;
    const [mx, my, mz] = movie.position;
    const d = 5;
    return [mx + d, my + d * 0.3, mz + d];
  }

  // Performance: visibilità in base alla distanza
  updateVisibleMovies(
    cameraPosition: [number, number, number],
    maxDistance: number = 80,
  ) {
    this.visibleMovies.clear();
    this.clustersInView.clear();

    this.state.clusters.forEach((c) => {
      const distance = Math.hypot(
        c.center[0] - cameraPosition[0],
        c.center[1] - cameraPosition[1],
        c.center[2] - cameraPosition[2],
      );
      if (distance <= maxDistance + c.radius) {
        this.clustersInView.add(c.id);
        c.movies.forEach((m) => this.visibleMovies.add(m.id));
      }
    });
  }

  getVisibleMovies(): Movie[] {
    if (this.visibleMovies.size === 0) return this.state.movies.slice(0, 500);
    return this.state.movies.filter((m) => this.visibleMovies.has(m.id));
  }

  getClustersInView(): MovieCluster[] {
    if (this.clustersInView.size === 0) return this.state.clusters.slice(0, 20);
    return this.state.clusters.filter((c) => this.clustersInView.has(c.id));
  }

  setSelectedMovie(movie: Movie | null) {
    this.state.selectedMovie = movie;
    this.notify();
  }

  setLevelOfDetail(lod: 'high' | 'medium' | 'low') {
    this.state.levelOfDetail = lod;
    this.notify();
  }

  searchMovies(query: string): Movie[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();

    return this.state.movies
      .filter((m) => {
        if (m.title?.toLowerCase().includes(q)) return true;
        if (m.director?.toLowerCase().includes(q)) return true;
        if (m.genres?.some((g) => g?.toLowerCase().includes(q))) return true;
        return false;
      })
      .slice(0, 5);
  }

  getMovieById(id: number): Movie | undefined {
    return this.state.movies.find((m) => m.id === id);
  }

  getSimilarMovies(movieId: number): Movie[] {
    const movie = this.getMovieById(movieId);
    if (!movie || !(movie as any).neighbor_ids) return [];
    const neighbors = (movie as any).neighbor_ids
      .map((id: number) => this.getMovieById(id))
      .filter(Boolean) as Movie[];
    return neighbors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  // ——————————————————————————————————————————————————————————
  // LLM: analisi con supporto streaming
  // ——————————————————————————————————————————————————————————

  /**
   * Recupera l'analisi LLM. Se la risposta è streaming (text/plain),
   * aggiorna progressivamente la UI. Se è JSON, la gestisce come prima.
   */
  async getLLMAnalysis(movie1Id: number, movie2Id: number): Promise<string> {
    const cacheKey = `${Math.min(movie1Id, movie2Id)}-${Math.max(movie1Id, movie2Id)}`;

    // Cache valida 24h
    const cached = this.state.llmCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.analysis;
    }

    // Se è già in corso uno stream per la stessa coppia → restituisci il parziale
    const inFlight = this.llmProgress.get(cacheKey);
    if (inFlight) return inFlight.text;

    const controller = new AbortController();
    this.llmProgress.set(cacheKey, { text: '', controller });
    this.notify();

    try {
      const response = await fetch('/api/llm-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Preferiamo lo stream testuale; la rotta tornerà JSON se necessario
          Accept: 'text/plain, */*',
        },
        body: JSON.stringify({ movie1Id, movie2Id }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`LLM API call failed: ${response.status}`);

      const contentType = response.headers.get('content-type') || '';

      // Caso JSON classico
      if (/application\/json/i.test(contentType)) {
        const { analysis } = await response.json();
        this.state.llmCache.set(cacheKey, {
          movie1Id,
          movie2Id,
          analysis,
          timestamp: Date.now(),
        });
        this.llmProgress.delete(cacheKey);
        this.notify();
        return analysis;
      }

      // Caso streaming di testo (text/plain, event-stream, ecc.)
      if (!response.body) throw new Error('ReadableStream not supported by the browser.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partial = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });

        // Aggiorna progress e notifica la UI
        this.llmProgress.set(cacheKey, { text: partial, controller });
        this.notify();
      }

      partial += decoder.decode(); // flush finale

      // Salva in cache il risultato finale
      this.state.llmCache.set(cacheKey, {
        movie1Id,
        movie2Id,
        analysis: partial,
        timestamp: Date.now(),
      });
      this.llmProgress.delete(cacheKey);
      this.notify();
      return partial;
    } catch (error) {
      console.error('Error getting LLM analysis:', error);

      this.llmProgress.delete(cacheKey);
      this.notify();

      // Fallback coerente col tuo testo precedente
      const movie1 = this.getMovieById(movie1Id);
      const movie2 = this.getMovieById(movie2Id);
      if (movie1 && movie2) {
        const sharedGenres = (movie1.genres || []).filter((g) =>
          (movie2.genres || []).includes(g),
        );
        const yearDiff = Math.abs(
          (movie1 as any).release_year - (movie2 as any).release_year,
        );

        return `"${movie1.title}" (${(movie1 as any).release_year}) e "${movie2.title}" (${(movie2 as any).release_year}) sono collegati nel nostro universo cinematografico per le loro profonde similitudini. ${
          sharedGenres.length > 0
            ? `Entrambi appartengono ai generi ${sharedGenres.join(', ')}, creando un ponte tematico evidente.`
            : 'Pur appartenendo a generi diversi, condividono approcci narrativi e stilistici simili.'
        } ${
          yearDiff < 5
            ? 'Prodotti nello stesso periodo, riflettono lo zeitgeist cinematografico del loro tempo.'
            : `Con ${yearDiff} anni di differenza, mostrano l'evoluzione di temi universali nel cinema.`
        } La loro vicinanza nell'universo 3D riflette connessioni profonde nei temi, nelle tecniche cinematografiche e nell'impatto emotivo sul pubblico.`;
      }

      return 'Analisi temporaneamente non disponibile. Riprova più tardi.';
    }
  }

  /**
   * Restituisce (se presente) il testo parziale in streaming per la coppia.
   * Utile per renderizzare la UI “mentre scrive”.
   */
  getLLMProgress(movie1Id: number, movie2Id: number): string | null {
    const key = `${Math.min(movie1Id, movie2Id)}-${Math.max(movie1Id, movie2Id)}`;
    return this.llmProgress.get(key)?.text ?? null;
  }

  /**
   * Permette di annullare lo streaming per una coppia di film.
   */
  cancelLLMAnalysis(movie1Id: number, movie2Id: number) {
    const key = `${Math.min(movie1Id, movie2Id)}-${Math.max(movie1Id, movie2Id)}`;
    const prog = this.llmProgress.get(key);
    if (prog) {
      try {
        prog.controller.abort();
      } catch {
        // ignore
      }
      this.llmProgress.delete(key);
      this.notify();
    }
  }
}

export const movieStore = new MovieStore();
