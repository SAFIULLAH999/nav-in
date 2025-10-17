/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'avatars.githubusercontent.com'],
  },
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force static optimization for pages that don't need server features
  generateBuildId: async () => {
    return 'build-cache-' + Date.now()
  },
}

module.exports = nextConfig
