import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { JWTManager } from '@/lib/jwt'

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO
    }
  }
}

interface AuthenticatedSocket extends Socket {
  userId?: string
  user?: any
}

export const initSocketIO = (httpServer: NetServer) => {
  const io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.NEXTAUTH_URL
        : "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

      if (!token) {
        return next(new Error('Authentication token missing'))
      }

      const payload = JWTManager.verifyAccessToken(token)
      if (!payload) {
        return next(new Error('Invalid token'))
      }

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          email: true
        }
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.userId = user.id
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} connected with socket ID: ${socket.id}`)

    // Join user's personal room
    socket.join(`user:${socket.userId}`)

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`User ${socket.user?.name} joined conversation ${conversationId}`)
    })

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`User ${socket.user?.name} left conversation ${conversationId}`)
    })

    // Handle sending messages
    socket.on('send_message', async (data: {
      content: string
      receiverId: string
      conversationId?: string
    }) => {
      try {
        if (!socket.userId) return

        const { content, receiverId, conversationId } = data

        // Validate message content
        if (!content.trim()) {
          socket.emit('message_error', 'Message content cannot be empty')
          return
        }

        if (content.length > 2000) {
          socket.emit('message_error', 'Message too long')
          return
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.userId,
            receiverId
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true
              }
            }
          }
        })

        // Emit to conversation room
        io.to(`conversation:${conversationId || message.id}`)
          .emit('new_message', {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            isRead: message.isRead,
            createdAt: message.createdAt,
            sender: message.sender,
            receiver: message.receiver
          })

        // Emit notification to receiver
        socket.to(`user:${receiverId}`).emit('message_notification', {
          id: message.id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt
        })

        console.log(`Message sent from ${socket.user?.name} to ${receiverId}`)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('message_error', 'Failed to send message')
      }
    })

    // Handle marking messages as read
    socket.on('mark_as_read', async (messageIds: string[]) => {
      try {
        if (!socket.userId) return

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            receiverId: socket.userId
          },
          data: { isRead: true }
        })

        // Notify sender that messages were read
        const messages = await prisma.message.findMany({
          where: { id: { in: messageIds } },
          select: { senderId: true }
        })

        const uniqueSenderIds = [...new Set(messages.map(m => m.senderId))]

        uniqueSenderIds.forEach(senderId => {
          socket.to(`user:${senderId}`).emit('messages_read', {
            messageIds,
            readBy: socket.userId
          })
        })

        console.log(`Messages ${messageIds.join(', ')} marked as read by ${socket.user?.name}`)
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Handle typing indicators
    socket.on('typing_start', (receiverId: string) => {
      socket.to(`user:${receiverId}`).emit('user_typing', {
        userId: socket.userId,
        user: socket.user
      })
    })

    socket.on('typing_stop', (receiverId: string) => {
      socket.to(`user:${receiverId}`).emit('user_stopped_typing', {
        userId: socket.userId
      })
    })

    // Handle user status updates
    socket.on('update_status', (status: 'online' | 'away' | 'busy' | 'offline') => {
      socket.user!.status = status
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} disconnected`)
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status: 'offline'
      })
    })
  })

  return io
}
