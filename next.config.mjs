/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⬇️ disattiva lint e type-check in build (come in origine)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', port: '', pathname: '/t/p/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
