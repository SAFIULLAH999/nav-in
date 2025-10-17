import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get analytics for user's posts
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

    const userId = authResult.user.userId

    // Get user's posts with engagement metrics
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate total metrics
    const totalPosts = posts.length
    const totalLikes = posts.reduce((sum, post) => sum + post._count.likes, 0)
    const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)
    const totalShares = posts.reduce((sum, post) => sum + post._count.shares, 0)

    // Calculate engagement rate (likes + comments + shares per post)
    const avgEngagementRate = totalPosts > 0
      ? (totalLikes + totalComments + totalShares) / totalPosts
      : 0

    // Get posts from last 30 days for trend analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentPosts = posts.filter(post => post.createdAt >= thirtyDaysAgo)

    const recentTotalLikes = recentPosts.reduce((sum, post) => sum + post._count.likes, 0)
    const recentTotalComments = recentPosts.reduce((sum, post) => sum + post._count.comments, 0)
    const recentTotalShares = recentPosts.reduce((sum, post) => sum + post._count.shares, 0)

    // Transform posts for response
    const transformedPosts = posts.map(post => ({
      id: post.id,
      content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      createdAt: post.createdAt.toISOString(),
      metrics: {
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        engagement: post._count.likes + post._count.comments + post._count.shares
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPosts,
          totalLikes,
          totalComments,
          totalShares,
          avgEngagementRate: Math.round(avgEngagementRate * 100) / 100
        },
        recent: {
          postsCount: recentPosts.length,
          likes: recentTotalLikes,
          comments: recentTotalComments,
          shares: recentTotalShares,
          engagement: recentTotalLikes + recentTotalComments + recentTotalShares
        },
        posts: transformedPosts
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
