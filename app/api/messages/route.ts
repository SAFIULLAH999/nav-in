import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const getConversationsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional()
})

// GET - Get user's conversations
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get unique conversations (users the current user has messaged with)
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Group by conversation partner and get latest message
    const conversationMap = new Map()

    conversations.forEach(message => {
      const otherUser = message.senderId === currentUserId
        ? message.receiver
        : message.sender

      const otherUserId = otherUser.id

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: {
            id: message.id,
            content: message.content,
            timestamp: message.createdAt.toISOString(),
            isRead: message.isRead,
            isFromMe: message.senderId === currentUserId
          },
          unreadCount: 0
        })
      }

      // Update unread count if message is from other user and unread
      if (message.receiverId === currentUserId && !message.isRead) {
        conversationMap.get(otherUserId).unreadCount++
      }
    })

    const conversationList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())

    return NextResponse.json({
      success: true,
      data: conversationList,
      pagination: {
        page,
        limit,
        hasMore: conversations.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST - Send a message (alternative to Socket.IO)
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
    const { receiverId, content } = z.object({
      receiverId: z.string().min(1, 'Receiver ID is required'),
      content: z.string().min(1, 'Message content is required').max(1000, 'Message too long')
    }).parse(body)

    const currentUserId = authResult.user.userId

    // Check if users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId, status: 'ACCEPTED' },
          { senderId: receiverId, receiverId: currentUserId, status: 'ACCEPTED' }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'You can only message users you are connected with' },
        { status: 400 }
      )
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: currentUserId,
        receiverId,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true
          }
        }
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        message: `${message.sender.name || 'Someone'} sent you a message`,
        data: JSON.stringify({
          messageId: message.id,
          senderId: currentUserId
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.createdAt.toISOString(),
        isRead: message.isRead,
        sender: message.sender
      },
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
