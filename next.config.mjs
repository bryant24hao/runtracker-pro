/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone mode for Docker deployments
  output: 'standalone',
  // Optimize for production
  compress: true,
  // Handle SQLite files properly
  outputFileTracingIncludes: {
    '/api/**/*': ['./scripts/**/*'],
  },
}

export default nextConfig
