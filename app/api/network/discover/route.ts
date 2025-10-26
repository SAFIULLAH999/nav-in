import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

// GET - Get "People You May Know" recommendations
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user's connections and profile info
    const [userConnections, userProfile] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: currentUserId, status: 'ACCEPTED' },
            { receiverId: currentUserId, status: 'ACCEPTED' }
          ]
        },
        select: {
          senderId: true,
          receiverId: true
        }
      }),
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          company: true,
          location: true,
          interests: true,
          experiences: {
            select: { company: true },
            orderBy: { startDate: 'desc' },
            take: 3
          },
          education: {
            select: { institution: true },
            orderBy: { startDate: 'desc' },
            take: 3
          }
        }
      })
    ])

    // Extract connection IDs
    const connectionIds = userConnections.flatMap(conn =>
      [conn.senderId, conn.receiverId].filter(id => id !== currentUserId)
    )

    // Get second-degree connections (friends of friends)
    const secondDegreeConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: { in: connectionIds }, status: 'ACCEPTED' },
          { receiverId: { in: connectionIds }, status: 'ACCEPTED' }
        ]
      },
      select: {
        senderId: true,
        receiverId: true
      }
    })

    // Extract potential recommendations (excluding already connected users)
    const potentialUserIds = secondDegreeConnections
      .flatMap(conn => [conn.senderId, conn.receiverId])
      .filter(id => id !== currentUserId && !connectionIds.includes(id))

    // Remove duplicates and limit
    const uniquePotentialIds = [...new Set(potentialUserIds)].slice(offset, offset + limit)

    if (uniquePotentialIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No recommendations found'
      })
    }

    // Get user details and calculate recommendation scores
    const potentialUsers = await prisma.user.findMany({
      where: {
        id: { in: uniquePotentialIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        bio: true,
        interests: true,
        experiences: {
          select: { company: true },
          orderBy: { startDate: 'desc' },
          take: 3
        },
        education: {
          select: { institution: true },
          orderBy: { startDate: 'desc' },
          take: 3
        },
        _count: {
          select: {
            sentConnections: {
              where: { status: 'PENDING' }
            },
            receivedConnections: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    })

    // Calculate recommendation scores based on multiple factors
    const scoredUsers = await Promise.all(
      potentialUsers.map(async (user) => {
        let score = 0
        let reasons = []

        // Factor 1: Mutual connections
        const mutualConnections = await prisma.connection.count({
          where: {
            OR: [
              {
                senderId: currentUserId,
                receiverId: user.id,
                status: 'ACCEPTED'
              },
              {
                senderId: user.id,
                receiverId: currentUserId,
                status: 'ACCEPTED'
              }
            ]
          }
        })

        if (mutualConnections > 0) {
          score += mutualConnections * 10
          reasons.push(`${mutualConnections} mutual connection${mutualConnections > 1 ? 's' : ''}`)
        }

        // Factor 2: Same company
        if (userProfile?.company && user.company === userProfile.company) {
          score += 15
          reasons.push('Same company')
        }

        // Factor 3: Same location
        if (userProfile?.location && user.location === userProfile.location) {
          score += 8
          reasons.push('Same location')
        }

        // Factor 4: Shared workplace (from experience)
        const sharedWorkplace = userProfile?.experiences?.some(exp =>
          user.experiences?.some(userExp => userExp.company === exp.company)
        )
        if (sharedWorkplace) {
          score += 12
          reasons.push('Shared workplace')
        }

        // Factor 5: Same educational institution
        const sharedEducation = userProfile?.education?.some(edu =>
          user.education?.some(userEdu => userEdu.institution === edu.institution)
        )
        if (sharedEducation) {
          score += 10
          reasons.push('Same school')
        }

        // Factor 6: Profile completeness (encourage connecting with active users)
        const profileCompleteness = [
          user.title,
          user.company,
          user.bio,
          user.avatar
        ].filter(Boolean).length
        score += profileCompleteness * 2

        // Factor 7: Shared interests
        const userInterests = (user as any).interests ? JSON.parse((user as any).interests) : []
        const profileInterests = userProfile?.interests ? JSON.parse(userProfile.interests) : []
        const sharedInterests = userInterests.filter((i: string) => profileInterests.includes(i)).length
        if (sharedInterests > 0) {
          score += sharedInterests * 5
          reasons.push(`${sharedInterests} shared interest${sharedInterests > 1 ? 's' : ''}`)
        }

        return {
          ...user,
          mutualConnections,
          recommendationScore: score,
          reasons: reasons.slice(0, 2), // Limit to top 2 reasons
          pendingConnectionRequests: user._count.sentConnections + user._count.receivedConnections
        }
      })
    )

    // Sort by recommendation score and return top results
    const sortedUsers = scoredUsers
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: sortedUsers.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        title: user.title,
        company: user.company,
        location: user.location,
        bio: user.bio,
        mutualConnections: user.mutualConnections,
        reasons: user.reasons,
        recommendationScore: user.recommendationScore
      }))
    })
  } catch (error) {
    console.error('Error fetching network discoveries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
