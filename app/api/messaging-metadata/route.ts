import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')
    const userIdParam = searchParams.get('userId')

    if (!messageId && !userIdParam) {
      return NextResponse.json({ error: 'Message ID or User ID is required' }, { status: 400 })
    }

    let metadata = null

    if (messageId) {
      // Get metadata for a specific message
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      })

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Check if user has access to this message
      if (message.senderId !== userId && message.receiverId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      metadata = {
        id: message.id,
        messageId: message.id,
        isRead: message.isRead,
        readAt: message.readAt,
        deliveredAt: message.deliveredAt,
        connectionStatus: 'online', // This would come from real-time connection status
        lastSeen: null, // This would come from user presence
        messageStatus: message.status as 'sending' | 'sent' | 'delivered' | 'read',
        retryCount: message.retryCount,
        error: message.error,
        encryptionStatus: message.encryptionStatus as 'encrypted' | 'decrypted' | 'pending',
        mediaStatus: message.mediaUrl ? 'loaded' : undefined,
        reactions: message.reactions ? JSON.parse(message.reactions) : [],
        replyTo: message.replyTo,
        forwardedFrom: message.forwardedFrom
      }
    } else if (userIdParam) {
      // Get connection status for a user
      const user = await prisma.user.findUnique({
        where: { id: userIdParam }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      metadata = {
        userId: user.id,
        connectionStatus: 'online', // This would come from real-time connection status
        lastSeen: user.lastLoginAt,
        isTyping: false, // This would come from real-time typing indicators
        typingUserId: null
      }
    }

    return NextResponse.json({
      success: true,
      data: metadata
    })
  } catch (error) {
    console.error('Error fetching messaging metadata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const body = await req.json()
    const {
      messageId,
      action,
      data
    } = body

    if (!messageId || !action) {
      return NextResponse.json({ error: 'Message ID and action are required' }, { status: 400 })
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user has access to this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let updatedMessage = null

    switch (action) {
      case 'mark_read':
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            isRead: true,
            readAt: new Date()
          }
        })
        break

      case 'mark_delivered':
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            deliveredAt: new Date()
          }
        })
        break

      case 'add_reaction':
        const currentReactions = message.reactions ? JSON.parse(message.reactions) : []
        const newReactions = [...currentReactions, data.reaction]
        
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            reactions: JSON.stringify(newReactions)
          }
        })
        break

      case 'remove_reaction':
        const existingReactions = message.reactions ? JSON.parse(message.reactions) : []
        const filteredReactions = existingReactions.filter((r: string) => r !== data.reaction)
        
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            reactions: JSON.stringify(filteredReactions)
          }
        })
        break

      case 'update_status':
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            status: data.status
          }
        })
        break

      case 'update_retry_count':
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            retryCount: message.retryCount + 1
          }
        })
        break

      case 'update_error':
        updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            error: data.error
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully',
      data: {
        messageId: updatedMessage.id,
        status: updatedMessage.status,
        isRead: updatedMessage.isRead,
        readAt: updatedMessage.readAt,
        deliveredAt: updatedMessage.deliveredAt,
        reactions: updatedMessage.reactions ? JSON.parse(updatedMessage.reactions) : [],
        retryCount: updatedMessage.retryCount,
        error: updatedMessage.error
      }
    })
  } catch (error) {
    console.error('Error updating messaging metadata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const body = await req.json()
    const {
      messageId,
      metadata
    } = body

    if (!messageId || !metadata) {
      return NextResponse.json({ error: 'Message ID and metadata are required' }, { status: 400 })
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user has access to this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update message metadata
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Message metadata updated successfully',
      data: {
        messageId: updatedMessage.id,
        metadata: updatedMessage.metadata
      }
    })
  } catch (error) {
    console.error('Error updating message metadata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}