/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'avatars.githubusercontent.com'],
  },
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'cheerio', 'undici'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude cheerio and undici from webpack bundling on server
      config.externals = [...(config.externals || []), 'cheerio', 'undici']
    }
    return config
  },
  // Force static optimization for pages that don't need server features
  generateBuildId: async () => {
    return 'build-cache-' + Date.now()
  },
}

module.exports = nextConfig
