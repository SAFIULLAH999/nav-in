import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get user's connections and requests
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, allow unauthenticated access
    let currentUserId = null
    try {
      const authResult = await authenticateRequest(request)
      currentUserId = authResult && 'user' in authResult ? authResult.user.userId : null
    } catch (error) {
      // Continue without authentication for testing
      console.log('Authentication failed, continuing without auth')
    }

    // If no authenticated user, return empty data for testing
    if (!currentUserId) {
      return NextResponse.json({
        success: true,
        data: {
          connections: [],
          pendingRequests: [],
          sentRequests: []
        }
      })
    }

    // Get accepted connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: currentUserId, status: 'ACCEPTED' },
          { receiverId: currentUserId, status: 'ACCEPTED' }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            location: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            location: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get pending requests received
    const pendingRequests = await prisma.connection.findMany({
      where: {
        receiverId: currentUserId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            location: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get sent requests
    const sentRequests = await prisma.connection.findMany({
      where: {
        senderId: currentUserId,
        status: 'PENDING'
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            location: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format connections
    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      user: conn.senderId === currentUserId ? conn.receiver : conn.sender,
      connectedAt: conn.createdAt.toISOString()
    }))

    // Format requests
    const formattedPendingRequests = pendingRequests.map(req => ({
      id: req.id,
      user: req.sender,
      requestedAt: req.createdAt.toISOString(),
      type: 'received' as const
    }))

    const formattedSentRequests = sentRequests.map(req => ({
      id: req.id,
      user: req.receiver,
      requestedAt: req.createdAt.toISOString(),
      type: 'sent' as const
    }))

    return NextResponse.json({
      success: true,
      data: {
        connections: formattedConnections,
        pendingRequests: formattedPendingRequests,
        sentRequests: formattedSentRequests
      }
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}
