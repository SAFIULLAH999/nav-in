import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const updateConnectionStrengthSchema = z.object({
  connectionId: z.string(),
  strength: z.number().min(1).max(10),
  category: z.string().optional(),
  notes: z.string().optional()
})

const getConnectionInsightsSchema = z.object({
  userId: z.string().optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month')
})

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
            bio: true,
            skills: true,
            company: true
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
            bio: true,
            skills: true,
            company: true
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
            bio: true,
            skills: true,
            company: true
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
            bio: true,
            skills: true,
            company: true
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
          location: otherUser.location || '',
          bio: otherUser.bio || '',
          skills: otherUser.skills || '',
          company: otherUser.company || ''
        },
        connectedAt: conn.updatedAt.toISOString(),
        strength: 5, // Default since not in current schema
        connectionType: 'PROFESSIONAL', // Default since not in current schema
        tags: '', // Default since not in current schema
        notes: '' // Default since not in current schema
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
        location: req.sender.location || '',
        bio: req.sender.bio || '',
        skills: req.sender.skills || '',
        company: req.sender.company || ''
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
        location: req.receiver.location || '',
        bio: req.receiver.bio || '',
        skills: req.receiver.skills || '',
        company: req.receiver.company || ''
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

// PUT - Update connection strength and metadata
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { connectionId, strength, category, notes } = updateConnectionStrengthSchema.parse(body)

    const userId = authResult.user.userId

    // Verify user is part of this connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    })

    if (!connection || (connection.senderId !== userId && connection.receiverId !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or access denied' },
        { status: 404 }
      )
    }

    // Update connection with enhanced metadata
    const updateData: any = {
      updatedAt: new Date()
    }

    if (strength) updateData.strength = strength
    if (notes !== undefined) updateData.notes = notes
    if (category) updateData.tags = JSON.stringify([category])

    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConnection.id,
        strength: strength || 5, // Use provided value or default
        notes: notes || '', // Use provided value or default
        tags: category ? JSON.stringify([category]) : '', // Use provided category or default
        updatedAt: updatedConnection.updatedAt.toISOString()
      },
      message: 'Connection updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating connection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}

// POST - Get connection insights and analytics
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, timeframe } = getConnectionInsightsSchema.parse(body)

    const targetUserId = userId || authResult.user.userId

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

    // Get connection analytics
    const [
      totalConnections,
      newConnections,
      connectionTypes,
      topConnections,
      interactionSummary
    ] = await Promise.all([
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

      // Connection status distribution (using status field instead of connectionType)
      prisma.connection.groupBy({
        by: ['status'],
        where: {
          OR: [
            { senderId: targetUserId, status: 'ACCEPTED' },
            { receiverId: targetUserId, status: 'ACCEPTED' }
          ]
        },
        _count: { status: true }
      }),

      // Top connections by recency (since strength doesn't exist in current schema)
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: targetUserId, status: 'ACCEPTED' },
            { receiverId: targetUserId, status: 'ACCEPTED' }
          ]
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, title: true }
          },
          receiver: {
            select: { id: true, name: true, avatar: true, title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Interaction summary (likes, comments, shares)
      prisma.$transaction(async (tx) => {
        const posts = await tx.post.findMany({
          where: { authorId: targetUserId },
          select: { id: true }
        })

        if (posts.length === 0) {
          return { likes: 0, comments: 0, shares: 0 }
        }

        const postIds = posts.map(p => p.id)
        const [likes, comments, shares] = await Promise.all([
          tx.like.count({ where: { postId: { in: postIds } } }),
          tx.comment.count({ where: { postId: { in: postIds } } }),
          tx.share.count({ where: { postId: { in: postIds } } })
        ])

        return { likes, comments, shares }
      })
    ])

    // Transform top connections
    const transformedTopConnections = topConnections.map(conn => {
      const otherUser = conn.senderId === targetUserId ? conn.receiver : conn.sender
      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          name: otherUser.name || 'Unknown User',
          avatar: otherUser.avatar || '',
          title: otherUser.title || 'NavIN User'
        },
        strength: 5, // Default since not in current schema
        connectionType: 'PROFESSIONAL', // Default since not in current schema
        connectedAt: conn.createdAt.toISOString()
      }
    })

    // Transform connection types (using status field)
    const transformedConnectionTypes = connectionTypes.map(type => ({
      type: type.status,
      count: type._count.status
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalConnections,
          newConnections,
          timeframe,
          periodStart: startDate.toISOString()
        },
        connectionTypes: transformedConnectionTypes,
        topConnections: transformedTopConnections,
        interactions: interactionSummary,
        insights: {
          strongestConnectionType: transformedConnectionTypes.reduce((max, type) =>
            type.count > max.count ? type : max, transformedConnectionTypes[0] || { type: 'None', count: 0 }
          ),
          averageStrength: 5, // Default since not in current schema
          networkGrowth: newConnections > 0 ? 'growing' : 'stable'
        }
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching connection insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connection insights' },
      { status: 500 }
    )
  }
}
