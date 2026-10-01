/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server in .next/standalone for the Docker image (Cloud Run)
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig