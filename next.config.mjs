/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // se usi <Image/>, consenti poster TMDB; con <img> non è obbligatorio
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
