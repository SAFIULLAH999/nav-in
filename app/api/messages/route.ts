import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required').max(1000, 'Message too long')
})

// GET - Get messages between current user and another user
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
    const otherUserId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId, status: 'ACCEPTED' },
          { senderId: otherUserId, receiverId: currentUserId, status: 'ACCEPTED' }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Users are not connected' },
        { status: 403 }
      )
    }

    // Get messages between users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Transform messages for frontend (reverse for chronological order)
    const transformedMessages = messages.reverse().map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      timestamp: message.createdAt.toISOString(),
      sender: {
        name: message.sender.name || 'Unknown User',
        username: message.sender.username || 'user',
        avatar: message.sender.avatar || ''
      }
    }))

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: transformedMessages,
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        }
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a message
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
    const { receiverId, content } = sendMessageSchema.parse(body)

    const senderId = authResult.user.userId

    // Prevent self-messaging
    if (senderId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver || !receiver.isActive) {
      return NextResponse.json(
        { success: false, error: 'Receiver not found or inactive' },
        { status: 404 }
      )
    }

    // Check if users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'ACCEPTED' },
          { senderId: receiverId, receiverId: senderId, status: 'ACCEPTED' }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Users must be connected to message' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        receiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${message.sender.name || 'Someone'} sent you a message`,
        data: JSON.stringify({
          messageId: message.id,
          senderId: senderId
        })
      }
    })

    // Transform for frontend response
    const transformedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      timestamp: message.createdAt.toISOString(),
      sender: {
        name: message.sender.name || 'Unknown User',
        username: message.sender.username || 'user',
        avatar: message.sender.avatar || ''
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedMessage,
      message: 'Message sent successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
