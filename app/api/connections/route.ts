import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get user's connections and pending requests
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

    // Get accepted connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
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
      orderBy: { updatedAt: 'desc' }
    })

    // Get pending requests (received)
    const pendingRequests = await prisma.connection.findMany({
      where: {
        receiverId: userId,
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

    // Get sent requests (pending)
    const sentRequests = await prisma.connection.findMany({
      where: {
        senderId: userId,
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

    // Transform connections for frontend
    const transformedConnections = connections.map(conn => {
      const otherUser = conn.senderId === userId ? conn.receiver : conn.sender
      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          name: otherUser.name || 'Unknown User',
          username: otherUser.username || 'user',
          avatar: otherUser.avatar || '',
          title: otherUser.title || 'NavIN User',
          location: otherUser.location || ''
        },
        connectedAt: conn.updatedAt.toISOString()
      }
    })

    const transformedPendingRequests = pendingRequests.map(req => ({
      id: req.id,
      user: {
        id: req.sender.id,
        name: req.sender.name || 'Unknown User',
        username: req.sender.username || 'user',
        avatar: req.sender.avatar || '',
        title: req.sender.title || 'NavIN User',
        location: req.sender.location || ''
      },
      requestedAt: req.createdAt.toISOString(),
      type: 'received'
    }))

    const transformedSentRequests = sentRequests.map(req => ({
      id: req.id,
      user: {
        id: req.receiver.id,
        name: req.receiver.name || 'Unknown User',
        username: req.receiver.username || 'user',
        avatar: req.receiver.avatar || '',
        title: req.receiver.title || 'NavIN User',
        location: req.receiver.location || ''
      },
      requestedAt: req.createdAt.toISOString(),
      type: 'sent'
    }))

    return NextResponse.json({
      success: true,
      data: {
        connections: transformedConnections,
        pendingRequests: transformedPendingRequests,
        sentRequests: transformedSentRequests,
        counts: {
          connections: transformedConnections.length,
          pendingRequests: transformedPendingRequests.length,
          sentRequests: transformedSentRequests.length
        }
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