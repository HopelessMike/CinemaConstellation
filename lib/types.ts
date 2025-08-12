export interface Movie {
  id: any;
  title: string;
  year: number | string;
  runtime: number;
  genre: string;
  plot: string;
  poster: string;
  rating: number | string;
  director: string;
  // Proprietà per la visualizzazione 3D
  position: [number, number, number];
  color: string;
  size: number;
}