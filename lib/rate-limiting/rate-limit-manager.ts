import { prisma } from '@/lib/prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export class RateLimitManager {
  private limits = {
    scraping: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 requests per hour for scraping
    general: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 } // 5 auth attempts per 15 minutes
  }

  // Check if request is within rate limits
  async checkLimit(key: string, type: 'scraping' | 'general' | 'auth' = 'general'): Promise<RateLimitResult> {
    try {
      const limit = this.limits[type]
      const windowStart = new Date(Date.now() - limit.windowMs)

      // Get current count for this key and time window
      const existingRecord = await prisma.rateLimit.findUnique({
        where: { key }
      })

      let currentCount = 0
      let resetTime = new Date(Date.now() + limit.windowMs)

      if (existingRecord) {
        // Check if we're still in the same window
        if (existingRecord.windowStart > windowStart) {
          currentCount = existingRecord.count
          resetTime = new Date(existingRecord.windowStart.getTime() + limit.windowMs)
        } else {
          // Window expired, reset counter
          await prisma.rateLimit.update({
            where: { key },
            data: {
              count: 1,
              windowStart: new Date()
            }
          })
          currentCount = 1
        }
      } else {
        // First request from this key
        await prisma.rateLimit.create({
          data: {
            key,
            count: 1,
            windowStart: new Date()
          }
        })
        currentCount = 1
      }

      const allowed = currentCount < limit.maxRequests
      const remaining = Math.max(0, limit.maxRequests - currentCount)

      if (!allowed) {
        const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000)
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        }
      }

      // Increment counter for this request
      await prisma.rateLimit.update({
        where: { key },
        data: {
          count: { increment: 1 }
        }
      })

      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime
      }

    } catch (error) {
      console.error('Error checking rate limit:', error)
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 3600000)
      }
    }
  }

  // Log a successful request for analytics
  async logRequest(key: string, type: string, success: boolean): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'rate_limit',
          eventName: `rate_limit_${type}_${success ? 'success' : 'blocked'}`,
          properties: JSON.stringify({
            key,
            type,
            success,
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('Error logging rate limit event:', error)
    }
  }

  // Get rate limit status for a key
  async getLimitStatus(key: string): Promise<{
    scraping: { used: number; limit: number; resetTime: Date }
    general: { used: number; limit: number; resetTime: Date }
    auth: { used: number; limit: number; resetTime: Date }
  }> {
    try {
      const record = await prisma.rateLimit.findUnique({
        where: { key }
      })

      if (!record) {
        return {
          scraping: { used: 0, limit: this.limits.scraping.maxRequests, resetTime: new Date() },
          general: { used: 0, limit: this.limits.general.maxRequests, resetTime: new Date() },
          auth: { used: 0, limit: this.limits.auth.maxRequests, resetTime: new Date() }
        }
      }

      const resetTime = new Date(record.windowStart.getTime() + this.limits.general.windowMs)

      return {
        scraping: {
          used: record.count,
          limit: this.limits.scraping.maxRequests,
          resetTime: new Date(record.windowStart.getTime() + this.limits.scraping.windowMs)
        },
        general: {
          used: record.count,
          limit: this.limits.general.maxRequests,
          resetTime
        },
        auth: {
          used: record.count,
          limit: this.limits.auth.maxRequests,
          resetTime
        }
      }

    } catch (error) {
      console.error('Error getting rate limit status:', error)
      throw error
    }
  }

  // Clean up old rate limit records
  async cleanupOldRecords(hoursOld: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - hoursOld)

      const result = await prisma.rateLimit.deleteMany({
        where: {
          windowStart: { lt: cutoffDate }
        }
      })

      console.log(`Cleaned up ${result.count} old rate limit records`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up rate limit records:', error)
      return 0
    }
  }

  // Get rate limiting statistics
  async getStats(): Promise<{
    totalRequests: number
    blockedRequests: number
    topOffenders: Array<{ key: string; count: number }>
  }> {
    try {
      // Get total rate limit events
      const totalEvents = await prisma.analyticsEvent.count({
        where: { eventType: 'rate_limit' }
      })

      const blockedEvents = await prisma.analyticsEvent.count({
        where: {
          eventType: 'rate_limit',
          eventName: { contains: 'blocked' }
        }
      })

      // Get top offenders (keys with most requests)
      const topKeys = await prisma.rateLimit.findMany({
        orderBy: { count: 'desc' },
        take: 10
      })

      return {
        totalRequests: totalEvents,
        blockedRequests: blockedEvents,
        topOffenders: topKeys.map(record => ({
          key: record.key,
          count: record.count
        }))
      }

    } catch (error) {
      console.error('Error getting rate limit stats:', error)
      return {
        totalRequests: 0,
        blockedRequests: 0,
        topOffenders: []
      }
    }
  }
}