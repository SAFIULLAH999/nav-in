import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'
import { canSendConnectionRequest } from '@/lib/privacy'

const sendConnectionSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  connectionType: z.enum(['PROFESSIONAL', 'COLLEAGUE', 'FRIEND', 'MENTOR', 'MENTEE']).default('PROFESSIONAL'),
  message: z.string().optional(),
  tags: z.array(z.string()).optional()
})

// POST - Send a connection request
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiverId, connectionType, message, tags } = sendConnectionSchema.parse(body)

    const senderId = authResult.user.userId

    // Prevent self-connection
    if (senderId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists and is active
    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiverUser || !receiverUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Check privacy settings for connection requests
    const canRequest = await canSendConnectionRequest(receiverId, senderId)
    if (!canRequest) {
      return NextResponse.json(
        { success: false, error: 'User does not accept connection requests' },
        { status: 403 }
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    if (existingConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection already exists' },
        { status: 400 }
      )
    }

    // Create connection request
    const connection = await (prisma.connection.create as any)({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
        connectionType,
        notes: message,
        tags: tags ? JSON.stringify(tags) : null
      }
    })

    // Get sender and receiver details for response
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true, username: true, avatar: true, title: true }
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, name: true, username: true, avatar: true, title: true }
      })
    ])

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${sender?.name || 'Someone'} wants to connect with you`,
        data: JSON.stringify({
          connectionId: connection.id,
          senderId: senderId
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        status: connection.status,
        createdAt: connection.createdAt.toISOString(),
        sender: {
          name: sender?.name || 'Unknown User',
          username: sender?.username || 'user',
          avatar: sender?.avatar || '',
          title: sender?.title || 'NavIN User'
        }
      },
      message: 'Connection request sent successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending connection request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send connection request' },
      { status: 500 }
    )
  }
}
