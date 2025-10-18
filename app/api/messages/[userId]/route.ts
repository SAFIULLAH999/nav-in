import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get messages between current user and target user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
    const targetUserId = params.userId

    // Check if users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId, status: 'ACCEPTED' },
          { senderId: targetUserId, receiverId: currentUserId, status: 'ACCEPTED' }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'You can only view messages with connected users' },
        { status: 403 }
      )
    }

    // Get messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
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
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: targetUserId,
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    })

    // Transform messages for frontend
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      timestamp: message.createdAt.toISOString(),
      isRead: message.isRead,
      sender: {
        name: message.sender.name || 'Unknown User',
        username: message.sender.username || 'user',
        avatar: message.sender.avatar || '',
        title: message.sender.title || 'NavIN User'
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedMessages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}