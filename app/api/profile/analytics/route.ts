import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

// GET - Get user's profile analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId

    // Get profile analytics
    const analytics = await prisma.profileAnalytics.findUnique({
      where: { userId }
    })

    // Get profile views with demographic breakdown
    const profileViews = await prisma.profileView.findMany({
      where: { profileId: userId },
      include: {
        viewer: {
          select: {
            title: true,
            company: true,
            location: true,
            industry: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: 100
    })

    // Get post analytics
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        analytics: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    // Calculate totals
    const totalViews = analytics?.profileViews || 0
    const totalPostImpressions = posts.reduce((sum, post) => sum + (post.analytics?.impressions || 0), 0)
    const totalEngagement = posts.reduce((sum, post) => sum + (post._count.likes + post._count.comments + post._count.shares), 0)

    // Demographic breakdown
    const demographics = {
      jobTitles: profileViews.reduce((acc, view) => {
        const title = view.viewer.title || 'Unknown'
        acc[title] = (acc[title] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      companies: profileViews.reduce((acc, view) => {
        const company = view.viewer.company || 'Unknown'
        acc[company] = (acc[company] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      locations: profileViews.reduce((acc, view) => {
        const location = view.viewer.location || 'Unknown'
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      industries: profileViews.reduce((acc, view) => {
        const industry = view.viewer.industry || 'Unknown'
        acc[industry] = (acc[industry] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      data: {
        profileViews: totalViews,
        postImpressions: totalPostImpressions,
        totalEngagement,
        demographics,
        recentViews: profileViews.slice(0, 10).map(view => ({
          viewedAt: view.viewedAt,
          viewer: view.viewer
        })),
        posts: posts.map(post => ({
          id: post.id,
          impressions: post.analytics?.impressions || 0,
          views: post.analytics?.views || 0,
          likes: post._count.likes,
          comments: post._count.comments,
          shares: post._count.shares,
          engagementRate: post.analytics?.engagementRate || 0
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching profile analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
