import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const sendConnectionSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required')
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
    const { receiverId } = sendConnectionSchema.parse(body)

    const senderId = authResult.user.userId

    // Prevent self-connection
    if (senderId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver || !receiver.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
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
    const connection = await prisma.connection.create({
      data: {
        senderId,
        receiverId,
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
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          }
        }
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${connection.sender.name || 'Someone'} wants to connect with you`,
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
          name: connection.sender.name || 'Unknown User',
          username: connection.sender.username || 'user',
          avatar: connection.sender.avatar || '',
          title: connection.sender.title || 'NavIN User'
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
