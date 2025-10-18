import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get post analytics for current user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const currentUserId = authResult.user.userId
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d

    // Calculate date range
    const now = new Date()
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    let analytics

    if (postId) {
      // Get analytics for specific post
      analytics = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'POST_VIEW',
          properties: {
            contains: `"postId":"${postId}"`
          },
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      })

      // Get post metrics
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
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        )
      }

      // Calculate engagement rate
      const totalEngagements = post._count.likes + post._count.comments + post._count.shares
      const engagementRate = post._count.likes > 0 ? (totalEngagements / post._count.likes) * 100 : 0

      return NextResponse.json({
        success: true,
        data: {
          postId,
          metrics: {
            views: analytics.length,
            likes: post._count.likes,
            comments: post._count.comments,
            shares: post._count.shares,
            engagementRate: Math.round(engagementRate * 100) / 100
          },
          views: analytics.map(event => ({
            timestamp: event.timestamp.toISOString(),
            userAgent: event.userAgent,
            ipAddress: event.ipAddress,
            referrer: event.referrer
          }))
        }
      })
    } else {
      // Get analytics for all user's posts
      const userPosts = await prisma.post.findMany({
        where: { authorId: currentUserId },
        select: { id: true },
        orderBy: { createdAt: 'desc' }
      })

      const postIds = userPosts.map(post => post.id)

      // Get all analytics events for user's posts
      const postAnalytics = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'POST_VIEW',
          properties: {
            contains: 'postId',
            in: postIds.map(id => `"postId":"${id}"`)
          },
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      })

      // Aggregate metrics by post
      const metricsByPost = postIds.map(postId => {
        const postViews = postAnalytics.filter(event =>
          event.properties?.includes(`"postId":"${postId}"`)
        )

        return {
          postId,
          views: postViews.length,
          uniqueViewers: new Set(postViews.map(v => v.userId)).size
        }
      })

      // Overall metrics
      const totalViews = postAnalytics.length
      const totalUniqueViewers = new Set(postAnalytics.map(v => v.userId).filter(Boolean)).size

      return NextResponse.json({
        success: true,
        data: {
          period,
          totalPosts: postIds.length,
          totalViews,
          totalUniqueViewers,
          averageViewsPerPost: postIds.length > 0 ? Math.round((totalViews / postIds.length) * 100) / 100 : 0,
          metricsByPost
        }
      })
    }
  } catch (error) {
    console.error('Error fetching post analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
