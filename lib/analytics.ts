import { prisma } from '@/lib/prisma'

export interface AnalyticsEventData {
  userId?: string
  eventType: string
  eventName: string
  properties?: Record<string, any>
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  url?: string
  referrer?: string
}

export class AnalyticsService {
  // Track an analytics event
  static async trackEvent(eventData: AnalyticsEventData): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: eventData.userId,
          eventType: eventData.eventType,
          eventName: eventData.eventName,
          properties: eventData.properties ? JSON.stringify(eventData.properties) : null,
          sessionId: eventData.sessionId,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          url: eventData.url,
          referrer: eventData.referrer
        }
      })
    } catch (error) {
      console.error('Failed to track analytics event:', error)
      // Don't throw error to avoid disrupting user experience
    }
  }

  // Track post view
  static async trackPostView(
    postId: string,
    userId?: string,
    request?: {
      ipAddress?: string
      userAgent?: string
      referrer?: string
    }
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'POST_VIEW',
      eventName: 'post_viewed',
      properties: { postId },
      ipAddress: request?.ipAddress,
      userAgent: request?.userAgent,
      referrer: request?.referrer
    })
  }

  // Track profile view
  static async trackProfileView(
    profileUserId: string,
    viewerUserId?: string,
    request?: {
      ipAddress?: string
      userAgent?: string
      referrer?: string
    }
  ): Promise<void> {
    await this.trackEvent({
      userId: viewerUserId,
      eventType: 'PROFILE_VIEW',
      eventName: 'profile_viewed',
      properties: { profileUserId },
      ipAddress: request?.ipAddress,
      userAgent: request?.userAgent,
      referrer: request?.referrer
    })
  }

  // Track job view
  static async trackJobView(
    jobId: string,
    userId?: string,
    request?: {
      ipAddress?: string
      userAgent?: string
      referrer?: string
    }
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'JOB_VIEW',
      eventName: 'job_viewed',
      properties: { jobId },
      ipAddress: request?.ipAddress,
      userAgent: request?.userAgent,
      referrer: request?.referrer
    })
  }

  // Track connection request
  static async trackConnectionRequest(
    senderId: string,
    receiverId: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'CONNECTION_REQUEST',
      eventName: 'connection_request_sent',
      properties: { senderId, receiverId }
    })
  }

  // Track job application
  static async trackJobApplication(
    jobId: string,
    userId: string,
    applicationId: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'JOB_APPLICATION',
      eventName: 'job_application_submitted',
      properties: { jobId, applicationId }
    })
  }

  // Get post analytics summary
  static async getPostAnalytics(
    postId: string,
    days: number = 30
  ): Promise<{
    views: number
    uniqueViewers: number
    likes: number
    comments: number
    shares: number
    engagementRate: number
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get view events
    const viewEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'POST_VIEW',
        properties: {
          contains: `"postId":"${postId}"`
        },
        timestamp: {
          gte: startDate
        }
      }
    })

    // Get post engagement metrics
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    if (!post) {
      throw new Error('Post not found')
    }

    const totalViews = viewEvents.length
    const uniqueViewers = new Set(viewEvents.map(event => event.userId).filter(Boolean)).size
    const totalEngagements = post._count.likes + post._count.comments + post._count.shares
    const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0

    return {
      views: totalViews,
      uniqueViewers,
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      engagementRate: Math.round(engagementRate * 100) / 100
    }
  }

  // Get user profile analytics
  static async getProfileAnalytics(
    userId: string,
    days: number = 30
  ): Promise<{
    profileViews: number
    uniqueViewers: number
    postViews: number
    connectionRequests: number
    jobApplications: number
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get profile view events
    const profileViewEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'PROFILE_VIEW',
        properties: {
          contains: `"profileUserId":"${userId}"`
        },
        timestamp: {
          gte: startDate
        }
      }
    })

    // Get user's posts view events
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true }
    })

    const postIds = userPosts.map(post => post.id)
    const postViewEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'POST_VIEW',
        properties: {
          in: postIds.map(id => `"postId":"${id}"`)
        },
        timestamp: {
          gte: startDate
        }
      }
    })

    // Get connection requests received
    const connectionRequests = await prisma.connection.count({
      where: {
        receiverId: userId,
        status: 'PENDING',
        createdAt: {
          gte: startDate
        }
      }
    })

    // Get job applications
    const jobApplications = await prisma.application.count({
      where: {
        userId,
        appliedAt: {
          gte: startDate
        }
      }
    })

    return {
      profileViews: profileViewEvents.length,
      uniqueViewers: new Set(profileViewEvents.map(event => event.userId).filter(Boolean)).size,
      postViews: postViewEvents.length,
      connectionRequests,
      jobApplications
    }
  }
}
