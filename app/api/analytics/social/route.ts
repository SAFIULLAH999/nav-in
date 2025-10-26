import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const socialAnalyticsSchema = z.object({
  userId: z.string().optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month')
})

// GET - Get social analytics for a user
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || authResult.user.userId
    const timeframe = (url.searchParams.get('timeframe') as 'week' | 'month' | 'quarter' | 'year') || 'month'

    const targetUserId = userId

    // Calculate date range based on timeframe
    const now = new Date()
    const timeRangeMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    }

    const daysBack = timeRangeMap[timeframe]
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get comprehensive social analytics
    const [
      followersCount,
      followingCount,
      newFollowers,
      connectionsCount,
      newConnections,
      postsCount,
      newPosts,
      likesReceived,
      commentsReceived,
      sharesReceived,
      profileViews,
      searchAppearances
    ] = await Promise.all([
      // Total followers count
      prisma.follow.count({
        where: { followingId: targetUserId }
      }),

      // Total following count
      prisma.follow.count({
        where: { followerId: targetUserId }
      }),

      // New followers in timeframe
      prisma.follow.count({
        where: {
          followingId: targetUserId,
          createdAt: { gte: startDate }
        }
      }),

      // Total connections count
      prisma.connection.count({
        where: {
          OR: [
            { senderId: targetUserId, status: 'ACCEPTED' },
            { receiverId: targetUserId, status: 'ACCEPTED' }
          ]
        }
      }),

      // New connections in timeframe
      prisma.connection.count({
        where: {
          OR: [
            { senderId: targetUserId, status: 'ACCEPTED' },
            { receiverId: targetUserId, status: 'ACCEPTED' }
          ],
          createdAt: { gte: startDate }
        }
      }),

      // Total posts count
      prisma.post.count({
        where: { authorId: targetUserId }
      }),

      // New posts in timeframe
      prisma.post.count({
        where: {
          authorId: targetUserId,
          createdAt: { gte: startDate }
        }
      }),

      // Total likes received
      prisma.like.count({
        where: {
          post: {
            authorId: targetUserId
          }
        }
      }),

      // Total comments received
      prisma.comment.count({
        where: {
          post: {
            authorId: targetUserId
          }
        }
      }),

      // Total shares received
      prisma.share.count({
        where: {
          post: {
            authorId: targetUserId
          }
        }
      }),

      // Profile views (using analytics events)
      prisma.analyticsEvent.count({
        where: {
          userId: targetUserId,
          eventType: 'profile_view',
          timestamp: { gte: startDate }
        }
      }),

      // Search appearances (using analytics events)
      prisma.analyticsEvent.count({
        where: {
          userId: targetUserId,
          eventType: 'search_appearance',
          timestamp: { gte: startDate }
        }
      })
    ])

    // Calculate engagement rate
    const totalEngagements = likesReceived + commentsReceived + sharesReceived
    const engagementRate = postsCount > 0 ? (totalEngagements / postsCount) * 100 : 0

    // Calculate growth rates
    const followersGrowthRate = followersCount > 0 ? (newFollowers / followersCount) * 100 : 0
    const connectionsGrowthRate = connectionsCount > 0 ? (newConnections / connectionsCount) * 100 : 0

    // Get top performing posts
    const topPosts = await prisma.post.findMany({
      where: { authorId: targetUserId },
      include: {
        likes: true,
        comments: true,
        shares: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const transformedTopPosts = topPosts.map(post => ({
      id: post.id,
      content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      createdAt: post.createdAt.toISOString(),
      engagement: {
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        total: post._count.likes + post._count.comments + post._count.shares
      }
    }))

    // Get follower demographics (simplified)
    const followerDemographics = await prisma.$queryRaw`
      SELECT
        COUNT(*) as count,
        COALESCE(u.company, 'Unknown') as company,
        COALESCE(u.location, 'Unknown') as location
      FROM Follow f
      JOIN User u ON f.followerId = u.id
      WHERE f.followingId = ${targetUserId}
      GROUP BY u.company, u.location
      ORDER BY count DESC
      LIMIT 10
    ` as any[]

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          timeframe,
          periodStart: startDate.toISOString(),
          followers: followersCount,
          following: followingCount,
          connections: connectionsCount,
          posts: postsCount
        },
        growth: {
          newFollowers,
          newConnections,
          newPosts,
          followersGrowthRate: Math.round(followersGrowthRate * 100) / 100,
          connectionsGrowthRate: Math.round(connectionsGrowthRate * 100) / 100
        },
        engagement: {
          totalLikes: likesReceived,
          totalComments: commentsReceived,
          totalShares: sharesReceived,
          totalEngagements: totalEngagements,
          engagementRate: Math.round(engagementRate * 100) / 100
        },
        reach: {
          profileViews,
          searchAppearances
        },
        topPosts: transformedTopPosts,
        demographics: followerDemographics.map(d => ({
          company: d.company,
          location: d.location,
          count: Number(d.count)
        })),
        insights: {
          mostEngagedPost: transformedTopPosts[0] || null,
          averageEngagementPerPost: postsCount > 0 ? Math.round(totalEngagements / postsCount * 100) / 100 : 0,
          followerQualityScore: Math.min(100, (connectionsCount * 2 + followersCount) / 10), // Simple quality metric
          networkStrength: followersCount > 0 && followingCount > 0
            ? Math.round((followersCount / followingCount) * 100) / 100
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching social analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social analytics' },
      { status: 500 }
    )
  }
}
