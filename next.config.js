/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'cheerio', 'undici'],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  // Force static optimization for pages that don't need server features
  generateBuildId: async () => {
    return 'build-cache-' + Date.now()
  },
}

module.exports = nextConfig
