import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Browse all users (for the browse tab)
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

    // Get all users except current user
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
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
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get existing connections and requests for the current user
    const [connections, sentRequests, receivedRequests] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: currentUserId, status: 'ACCEPTED' },
            { receiverId: currentUserId, status: 'ACCEPTED' }
          ]
        },
        select: {
          senderId: true,
          receiverId: true,
          status: true
        }
      }),
      prisma.connection.findMany({
        where: {
          senderId: currentUserId,
          status: 'PENDING'
        },
        select: {
          receiverId: true
        }
      }),
      prisma.connection.findMany({
        where: {
          receiverId: currentUserId,
          status: 'PENDING'
        },
        select: {
          senderId: true
        }
      })
    ])

    // Create sets for quick lookup
    const connectedUserIds = new Set(
      connections.flatMap(conn =>
        [conn.senderId, conn.receiverId].filter(id => id !== currentUserId)
      )
    )

    const sentRequestUserIds = new Set(
      sentRequests.map(req => req.receiverId)
    )

    const receivedRequestUserIds = new Set(
      receivedRequests.map(req => req.senderId)
    )

    // Add connection status to each user
    const usersWithStatus = allUsers.map(user => {
      let connectionStatus = 'none'

      if (connectedUserIds.has(user.id)) {
        connectionStatus = 'connected'
      } else if (sentRequestUserIds.has(user.id)) {
        // Current user sent a request to this user
        connectionStatus = 'pending'
      } else if (receivedRequestUserIds.has(user.id)) {
        // Current user received a request from this user
        // Don't show them in browse - they should respond in Pending Requests tab
        connectionStatus = 'received'
      }

      return {
        ...user,
        connectionStatus,
        // Add some basic stats for display
        mutualConnections: 0, // Could be calculated if needed
        reasons: ['Available to connect']
      }
    })

    // Filter out users who sent requests to current user (they appear in Pending Requests tab)
    const filteredUsers = usersWithStatus.filter(user => user.connectionStatus !== 'received')

    return NextResponse.json({
      success: true,
      data: filteredUsers
    })
  } catch (error) {
    console.error('Error browsing users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
