import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export interface GeneratedURL {
  id: string
  userId: string
  slug: string
  type: 'profile' | 'portfolio' | 'resume' | 'custom'
  isActive: boolean
  clickCount: number
  expiresAt?: Date
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export class URLGenerator {
  private readonly SLUG_LENGTH = 8
  private readonly MAX_SLUG_ATTEMPTS = 10

  // Generate a unique slug
  private generateSlug(length: number = this.SLUG_LENGTH): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Generate a unique URL slug for a user
  async generateUniqueSlug(
    userId: string,
    type: 'profile' | 'portfolio' | 'resume' | 'custom' = 'profile',
    customSlug?: string,
    metadata?: any
  ): Promise<string> {
    try {
      let slug = customSlug || this.generateSlug()
      let attempts = 0

      // Ensure uniqueness
      while (attempts < this.MAX_SLUG_ATTEMPTS) {
        const existing = await prisma.generatedURL.findFirst({
          where: { slug, isActive: true }
        })

        if (!existing) {
          // Create the URL record
          await prisma.generatedURL.create({
            data: {
              userId,
              slug,
              type,
              isActive: true,
              clickCount: 0,
              metadata: metadata ? JSON.stringify(metadata) : null,
              expiresAt: type === 'custom' && metadata?.expiresAfter ?
                new Date(Date.now() + metadata.expiresAfter * 24 * 60 * 60 * 1000) : null
            }
          })

          return slug
        }

        slug = customSlug || this.generateSlug()
        attempts++
      }

      // If we couldn't generate a unique slug, append timestamp
      slug = `${customSlug || this.generateSlug()}-${Date.now()}`
      await prisma.generatedURL.create({
        data: {
          userId,
          slug,
          type,
          isActive: true,
          clickCount: 0,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })

      return slug

    } catch (error) {
      console.error('Error generating unique slug:', error)
      throw new Error('Failed to generate unique URL slug')
    }
  }

  // Get full URL for a slug
  getFullURL(slug: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return `${base}/${slug}`
  }

  // Track click on a generated URL
  async trackClick(slug: string): Promise<boolean> {
    try {
      const urlRecord = await prisma.generatedURL.findFirst({
        where: { slug, isActive: true }
      })

      if (!urlRecord) {
        return false
      }

      // Check if expired
      if (urlRecord.expiresAt && urlRecord.expiresAt < new Date()) {
        return false
      }

      // Increment click count
      await prisma.generatedURL.update({
        where: { id: urlRecord.id },
        data: {
          clickCount: { increment: 1 },
          updatedAt: new Date()
        }
      })

      // Log analytics event
      await prisma.analyticsEvent.create({
        data: {
          userId: urlRecord.userId,
          eventType: 'url_click',
          eventName: `url_click_${urlRecord.type}`,
          properties: JSON.stringify({
            slug,
            type: urlRecord.type,
            userAgent: 'unknown', // Would be populated from request headers
            ipAddress: 'unknown', // Would be populated from request
            referrer: 'unknown' // Would be populated from request headers
          })
        }
      })

      return true

    } catch (error) {
      console.error('Error tracking URL click:', error)
      return false
    }
  }

  // Get URL record by slug
  async getURLBySlug(slug: string): Promise<GeneratedURL | null> {
    try {
      const record = await prisma.generatedURL.findFirst({
        where: { slug, isActive: true }
      })

      if (!record) {
        return null
      }

      // Check if expired
      if (record.expiresAt && record.expiresAt < new Date()) {
        return null
      }

      return {
        id: record.id,
        userId: record.userId,
        slug: record.slug,
        type: record.type as any,
        isActive: record.isActive,
        clickCount: record.clickCount,
        expiresAt: record.expiresAt || undefined,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }

    } catch (error) {
      console.error('Error getting URL by slug:', error)
      return null
    }
  }

  // Get all URLs for a user
  async getUserURLs(userId: string): Promise<GeneratedURL[]> {
    try {
      const records = await prisma.generatedURL.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return records.map(record => ({
        id: record.id,
        userId: record.userId,
        slug: record.slug,
        type: record.type as any,
        isActive: record.isActive,
        clickCount: record.clickCount,
        expiresAt: record.expiresAt || undefined,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }))

    } catch (error) {
      console.error('Error getting user URLs:', error)
      return []
    }
  }

  // Deactivate a URL
  async deactivateURL(slug: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.generatedURL.updateMany({
        where: {
          slug,
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      return result.count > 0

    } catch (error) {
      console.error('Error deactivating URL:', error)
      return false
    }
  }

  // Get URL analytics
  async getURLAnalytics(slug: string): Promise<{
    totalClicks: number
    recentClicks: any[]
    demographics?: any
  } | null> {
    try {
      const urlRecord = await prisma.generatedURL.findFirst({
        where: { slug }
      })

      if (!urlRecord) {
        return null
      }

      // Get recent click events
      const recentClicks = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'url_click',
          eventName: { contains: `url_click_${urlRecord.type}` },
          properties: { contains: slug }
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      })

      return {
        totalClicks: urlRecord.clickCount,
        recentClicks: recentClicks.map(event => ({
          timestamp: event.timestamp,
          properties: JSON.parse(event.properties || '{}')
        })),
        demographics: {
          // This would be populated with actual demographic data
          // from user agents, IP geolocation, etc.
        }
      }

    } catch (error) {
      console.error('Error getting URL analytics:', error)
      return null
    }
  }

  // Clean up expired URLs
  async cleanupExpiredURLs(): Promise<number> {
    try {
      const result = await prisma.generatedURL.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      console.log(`Deactivated ${result.count} expired URLs`)
      return result.count

    } catch (error) {
      console.error('Error cleaning up expired URLs:', error)
      return 0
    }
  }

  // Generate QR code data for a URL (base64 data URL)
  async generateQRCodeData(slug: string): Promise<string | null> {
    try {
      const fullURL = this.getFullURL(slug)

      // In a real implementation, you'd use a QR code library
      // For now, return a placeholder
      const qrData = `QR_CODE_DATA_FOR:${fullURL}`

      return Buffer.from(qrData).toString('base64')

    } catch (error) {
      console.error('Error generating QR code data:', error)
      return null
    }
  }
}