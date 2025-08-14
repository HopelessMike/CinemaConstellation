/** @type {import('next').NextConfig} */
const nextConfig = {
  // L'app vive sotto questo sotto-percorso quando servita dietro il portfolio
  basePath: '/cinema-constellations',

  // Mantieni le tue impostazioni esistenti
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Se in futuro usi <Image/>, abilita TMDB; con <img> non è necessario.
  images: {
    unoptimized: true, // continui a bypassare l'optimizer
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**', // copre w200, w500, original, ecc.
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
