import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/logger'

export interface AnalyticsEvent {
  id: string
  userId?: string
  eventType: string
  eventName: string
  properties: Record<string, any>
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  url?: string
  referrer?: string
}

export interface UserMetrics {
  userId: string
  totalSessions: number
  totalPageViews: number
  averageSessionDuration: number
  bounceRate: number
  topPages: Array<{ url: string; views: number }>
  deviceTypes: Record<string, number>
  browsers: Record<string, number>
  locations: Record<string, number>
  lastSeen: Date
}

export interface PlatformMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  totalSessions: number
  totalPageViews: number
  averageSessionDuration: number
  bounceRate: number
  topPages: Array<{ url: string; views: number }>
  userGrowth: Array<{ date: string; users: number }>
  engagementRate: number
  retentionRate: number
}

export class AnalyticsService {
  // Track user event
  static async trackEvent(
    userId: string | undefined,
    eventType: string,
    eventName: string,
    properties: Record<string, any> = {},
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
    url?: string,
    referrer?: string
  ): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventType,
          eventName,
          properties: JSON.stringify(properties),
          sessionId,
          ipAddress,
          userAgent,
          url,
          referrer
        }
      })

      Logger.debug('Analytics event tracked', {
        userId,
        eventType,
        eventName,
        sessionId
      })
    } catch (error) {
      Logger.error('Failed to track analytics event', error as Error, {
        userId,
        eventType,
        eventName
      })
    }
  }

  // Get user-specific metrics
  static async getUserMetrics(userId: string, days: number = 30): Promise<UserMetrics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [
        totalSessions,
        totalPageViews,
        sessionDurations,
        bounceSessions,
        topPages,
        deviceTypes,
        browsers,
        locations,
        lastSeen
      ] = await Promise.all([
        // Total sessions
        prisma.analyticsEvent.count({
          where: {
            userId,
            eventType: 'session',
            timestamp: { gte: startDate }
          }
        }),

        // Total page views
        prisma.analyticsEvent.count({
          where: {
            userId,
            eventType: 'page_view',
            timestamp: { gte: startDate }
          }
        }),

        // Session durations (mock calculation)
        Promise.resolve([]),

        // Bounce sessions (sessions with only 1 page view)
        Promise.resolve(0),

        // Top pages
        prisma.analyticsEvent.groupBy({
          by: ['url'],
          where: {
            userId,
            eventType: 'page_view',
            timestamp: { gte: startDate },
            url: { not: null }
          },
          _count: true,
          orderBy: {
            _count: {
              url: 'desc'
            }
          },
          take: 10
        }),

        // Device types (mock data)
        Promise.resolve({ desktop: 60, mobile: 35, tablet: 5 }),

        // Browsers (mock data)
        Promise.resolve({ chrome: 70, firefox: 15, safari: 10, edge: 5 }),

        // Locations (mock data)
        Promise.resolve({ 'United States': 40, 'Canada': 15, 'United Kingdom': 10 }),

        // Last seen
        prisma.analyticsEvent.findFirst({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        })
      ])

      const averageSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
        : 0

      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0

      return {
        userId,
        totalSessions,
        totalPageViews,
        averageSessionDuration,
        bounceRate,
        topPages: topPages.map(page => ({
          url: page.url || '',
          views: page._count
        })),
        deviceTypes,
        browsers,
        locations,
        lastSeen: lastSeen?.timestamp || new Date()
      }
    } catch (error) {
      Logger.error('Failed to get user metrics', error as Error, { userId })
      throw error
    }
  }

  // Get platform-wide metrics
  static async getPlatformMetrics(days: number = 30): Promise<PlatformMetrics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [
        totalUsers,
        activeUsers,
        newUsers,
        totalSessions,
        totalPageViews,
        topPages,
        userGrowth
      ] = await Promise.all([
        // Total users
        prisma.user.count(),

        // Active users (users with activity in the last 30 days)
        prisma.analyticsEvent.count({
          where: {
            userId: { not: null },
            timestamp: { gte: startDate }
          },
          distinct: ['userId']
        }),

        // New users
        prisma.user.count({
          where: {
            createdAt: { gte: startDate }
          }
        }),

        // Total sessions
        prisma.analyticsEvent.count({
          where: {
            eventType: 'session',
            timestamp: { gte: startDate }
          }
        }),

        // Total page views
        prisma.analyticsEvent.count({
          where: {
            eventType: 'page_view',
            timestamp: { gte: startDate }
          }
        }),

        // Top pages
        prisma.analyticsEvent.groupBy({
          by: ['url'],
          where: {
            eventType: 'page_view',
            timestamp: { gte: startDate },
            url: { not: null }
          },
          _count: true,
          orderBy: {
            _count: {
              url: 'desc'
            }
          },
          take: 20
        }),

        // User growth over time
        this.getUserGrowthData(startDate, days)
      ])

      // Calculate derived metrics
      const averageSessionDuration = 180 // seconds (mock)
      const bounceRate = 35 // percentage (mock)
      const engagementRate = 65 // percentage (mock)
      const retentionRate = 75 // percentage (mock)

      return {
        totalUsers,
        activeUsers,
        newUsers,
        totalSessions,
        totalPageViews,
        averageSessionDuration,
        bounceRate,
        topPages: topPages.map(page => ({
          url: page.url || '',
          views: page._count
        })),
        userGrowth,
        engagementRate,
        retentionRate
      }
    } catch (error) {
      Logger.error('Failed to get platform metrics', error as Error)
      throw error
    }
  }

  // Get user growth data for charts
  private static async getUserGrowthData(startDate: Date, days: number): Promise<Array<{ date: string; users: number }>> {
    try {
      const growthData: Array<{ date: string; users: number }> = []

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

        const users = await prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        })

        growthData.push({
          date: date.toISOString().split('T')[0],
          users
        })
      }

      return growthData
    } catch (error) {
      Logger.error('Failed to get user growth data', error as Error)
      return []
    }
  }

  // Track page view
  static async trackPageView(
    userId: string | undefined,
    url: string,
    referrer?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.trackEvent(
      userId,
      'page_view',
      'page_view',
      { url, referrer },
      sessionId,
      ipAddress,
      userAgent,
      url,
      referrer
    )
  }

  // Track user session
  static async trackSession(
    userId: string | undefined,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.trackEvent(
      userId,
      'session',
      'session_start',
      { sessionId },
      sessionId,
      ipAddress,
      userAgent
    )
  }

  // Track custom business events
  static async trackBusinessEvent(
    userId: string | undefined,
    eventName: string,
    properties: Record<string, any> = {},
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent(
      userId,
      'business',
      eventName,
      properties,
      sessionId
    )
  }

  // Get conversion funnel data
  static async getConversionFunnel(): Promise<Array<{
    stage: string
    users: number
    conversionRate: number
  }>> {
    try {
      // Define funnel stages
      const stages = [
        { name: 'Profile Created', event: 'profile_created' },
        { name: 'First Post', event: 'first_post' },
        { name: 'First Connection', event: 'first_connection' },
        { name: 'Job Applied', event: 'job_applied' },
        { name: 'Premium User', event: 'premium_upgrade' }
      ]

      const funnelData = []

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i]

        // Count users who reached this stage
        const users = await prisma.analyticsEvent.count({
          where: {
            eventName: stage.event,
            eventType: 'business'
          },
          distinct: ['userId']
        })

        // Calculate conversion rate from previous stage
        let conversionRate = 100
        if (i > 0) {
          const prevStageUsers = funnelData[i - 1].users
          conversionRate = prevStageUsers > 0 ? (users / prevStageUsers) * 100 : 0
        }

        funnelData.push({
          stage: stage.name,
          users,
          conversionRate: Math.round(conversionRate * 100) / 100
        })
      }

      return funnelData
    } catch (error) {
      Logger.error('Failed to get conversion funnel', error as Error)
      return []
    }
  }

  // Get real-time active users
  static async getActiveUsers(minutes: number = 15): Promise<number> {
    try {
      const startTime = new Date(Date.now() - minutes * 60 * 1000)

      const activeUsers = await prisma.analyticsEvent.count({
        where: {
          timestamp: { gte: startTime },
          userId: { not: null }
        },
        distinct: ['userId']
      })

      return activeUsers
    } catch (error) {
      Logger.error('Failed to get active users', error as Error)
      return 0
    }
  }

  // Get top performing content
  static async getTopContent(days: number = 7): Promise<Array<{
    id: string
    type: 'post' | 'job'
    title: string
    views: number
    engagement: number
    author: string
  }>> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // Get top posts by views
      const topPosts = await prisma.analyticsEvent.groupBy({
        by: ['properties'],
        where: {
          eventType: 'page_view',
          eventName: 'post_view',
          timestamp: { gte: startDate }
        },
        _count: true,
        orderBy: {
          _count: {
            properties: 'desc'
          }
        },
        take: 10
      })

      // Get top jobs by applications
      const topJobs = await prisma.analyticsEvent.groupBy({
        by: ['properties'],
        where: {
          eventType: 'business',
          eventName: 'job_view',
          timestamp: { gte: startDate }
        },
        _count: true,
        orderBy: {
          _count: {
            properties: 'desc'
          }
        },
        take: 10
      })

      const content = []

      // Process posts data
      for (const post of topPosts) {
        try {
          const props = JSON.parse(post.properties as string)
          if (props.postId) {
            const postData = await prisma.post.findUnique({
              where: { id: props.postId },
              select: {
                id: true,
                content: true,
                author: {
                  select: { name: true }
                }
              }
            })

            if (postData) {
              content.push({
                id: postData.id,
                type: 'post' as const,
                title: postData.content.substring(0, 50) + '...',
                views: post._count,
                engagement: post._count, // Simplified
                author: postData.author?.name || 'Unknown'
              })
            }
          }
        } catch (error) {
          // Skip malformed data
        }
      }

      return content.slice(0, 10)
    } catch (error) {
      Logger.error('Failed to get top content', error as Error)
      return []
    }
  }

  // Clean up old analytics data
  static async cleanupOldData(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

      const result = await prisma.analyticsEvent.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      })

      Logger.info(`Cleaned up ${result.count} old analytics events`)

      return result.count
    } catch (error) {
      Logger.error('Failed to cleanup analytics data', error as Error)
      throw error
    }
  }

  // Export analytics data for external analysis
  static async exportAnalyticsData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'asc' }
      })

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['timestamp', 'userId', 'eventType', 'eventName', 'properties', 'sessionId', 'url']
        const csvData = events.map(event => [
          event.timestamp.toISOString(),
          event.userId || '',
          event.eventType,
          event.eventName,
          JSON.stringify(event.properties),
          event.sessionId || '',
          event.url || ''
        ])

        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n')

        return csvContent
      } else {
        // Return as JSON
        return JSON.stringify(events, null, 2)
      }
    } catch (error) {
      Logger.error('Failed to export analytics data', error as Error)
      throw error
    }
  }
}

// SEO and metadata utilities
export class SEOService {
  // Generate structured data for posts
  static generatePostStructuredData(post: any, author: any): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      'headline': post.content.substring(0, 110),
      'author': {
        '@type': 'Person',
        'name': author.name,
        'url': `${process.env.NEXTAUTH_URL}/profile/${author.username}`
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'NavIN',
        'url': process.env.NEXTAUTH_URL
      },
      'datePublished': post.createdAt,
      'dateModified': post.updatedAt,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${process.env.NEXTAUTH_URL}/posts/${post.id}`
      }
    }
  }

  // Generate structured data for jobs
  static generateJobStructuredData(job: any, company: any): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      'title': job.title,
      'description': job.description,
      'hiringOrganization': {
        '@type': 'Organization',
        'name': job.company,
        'sameAs': company?.website || process.env.NEXTAUTH_URL
      },
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': job.location
        }
      },
      'employmentType': job.type.replace('_', ' ').toUpperCase(),
      'datePosted': job.createdAt,
      'validThrough': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      'baseSalary': job.salaryMin && job.salaryMax ? {
        '@type': 'MonetaryAmount',
        'currency': 'USD',
        'value': {
          '@type': 'QuantitativeValue',
          'minValue': job.salaryMin,
          'maxValue': job.salaryMax,
          'unitText': 'YEAR'
        }
      } : undefined
    }
  }

  // Generate sitemap entries
  static async generateSitemap(): Promise<Array<{
    url: string
    lastModified: Date
    priority: number
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  }>> {
    try {
      const [
        users,
        jobs,
        posts
      ] = await Promise.all([
        prisma.user.findMany({
          where: { isActive: true },
          select: { username: true, updatedAt: true }
        }),
        prisma.job.findMany({
          where: { isActive: true },
          select: { id: true, updatedAt: true }
        }),
        prisma.post.findMany({
          select: { id: true, updatedAt: true },
          take: 1000 // Limit for performance
        })
      ])

      const sitemapEntries = [
        {
          url: `${process.env.NEXTAUTH_URL}`,
          lastModified: new Date(),
          priority: 1.0,
          changefreq: 'daily' as const
        },
        {
          url: `${process.env.NEXTAUTH_URL}/feed`,
          lastModified: new Date(),
          priority: 0.9,
          changefreq: 'hourly' as const
        },
        {
          url: `${process.env.NEXTAUTH_URL}/jobs`,
          lastModified: new Date(),
          priority: 0.8,
          changefreq: 'daily' as const
        }
      ]

      // Add user profile pages
      for (const user of users) {
        if (user.username) {
          sitemapEntries.push({
            url: `${process.env.NEXTAUTH_URL}/profile/${user.username}`,
            lastModified: user.updatedAt,
            priority: 0.6,
            changefreq: 'weekly' as const
          })
        }
      }

      // Add job pages
      for (const job of jobs) {
        sitemapEntries.push({
          url: `${process.env.NEXTAUTH_URL}/jobs/${job.id}`,
          lastModified: job.updatedAt,
          priority: 0.7,
          changefreq: 'weekly' as const
        })
      }

      return sitemapEntries
    } catch (error) {
      Logger.error('Failed to generate sitemap', error as Error)
      return []
    }
  }
}
