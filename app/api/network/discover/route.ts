import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Discover people you may know
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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current user's connections and follows
    const [userConnections, userFollows] = await Promise.all([
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
      prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      })
    ])

    // Extract connected and followed user IDs
    const connectedUserIds = new Set([
      ...userConnections.map(c => c.senderId),
      ...userConnections.map(c => c.receiverId)
    ].filter(id => id !== currentUserId))

    const followedUserIds = new Set(
      userFollows.map(f => f.followingId).filter(id => id !== currentUserId)
    )

    // Combine into users to exclude
    const excludeUserIds = new Set([...connectedUserIds, ...followedUserIds, currentUserId])

    // Find users with mutual connections, same company, or similar interests
    const potentialConnections = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeUserIds) },
        isActive: true,
        AND: [
          // Not already connected or followed
          { id: { notIn: Array.from(excludeUserIds) } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        _count: {
          select: {
            sentConnections: {
              where: { status: 'ACCEPTED' }
            },
            receivedConnections: {
              where: { status: 'ACCEPTED' }
            },
            followers: true,
            following: true
          }
        }
      },
      take: limit,
      orderBy: [
        // Prioritize by mutual connections (simplified algorithm)
        { createdAt: 'desc' }
      ]
    })

    // Calculate mutual connections for each user
    const usersWithMutualCount = await Promise.all(
      potentialConnections.map(async (user) => {
        // Get this user's connections
        const userConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { senderId: user.id, status: 'ACCEPTED' },
              { receiverId: user.id, status: 'ACCEPTED' }
            ]
          },
          select: {
            senderId: true,
            receiverId: true
          }
        })

        const userConnectedIds = new Set([
          ...userConnections.map(c => c.senderId),
          ...userConnections.map(c => c.receiverId)
        ].filter(id => id !== user.id))

        // Find intersection with current user's connections
        const mutualConnections = Array.from(connectedUserIds).filter(id =>
          userConnectedIds.has(id)
        )

        return {
          id: user.id,
          name: user.name || 'Unknown User',
          username: user.username || 'user',
          avatar: user.avatar || '',
          title: user.title || 'NavIN User',
          company: user.company || '',
          location: user.location || '',
          mutualConnections: mutualConnections.length,
          connectionsCount: user._count.sentConnections + user._count.receivedConnections,
          followersCount: user._count.followers
        }
      })
    )

    // Sort by mutual connections (descending)
    usersWithMutualCount.sort((a, b) => b.mutualConnections - a.mutualConnections)

    return NextResponse.json({
      success: true,
      data: usersWithMutualCount,
      total: usersWithMutualCount.length
    })
  } catch (error) {
    console.error('Error discovering network:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to discover network' },
      { status: 500 }
    )
  }
}
