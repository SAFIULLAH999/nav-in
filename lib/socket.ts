import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Extend Socket.IO socket interface to include userId
declare module 'socket.io' {
  interface Socket {
    userId?: string
  }
}

// Store active users and their socket IDs
const activeUsers = new Map<string, string>()

export const initSocketIO = (httpServer: NetServer) => {
  const io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Authenticate user on connection
    socket.on('authenticate', (token: string) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        const userId = decoded.userId

        // Store user-socket mapping
        activeUsers.set(userId, socket.id)
        socket.userId = userId

        console.log(`User ${userId} authenticated with socket ${socket.id}`)

        // Join user to their personal room for direct messages
        socket.join(`user_${userId}`)

        // Broadcast user online status
        socket.broadcast.emit('user_online', { userId })

      } catch (error) {
        console.error('Socket authentication failed:', error)
        socket.emit('auth_error', 'Invalid token')
        socket.disconnect()
      }
    })

    // Handle joining conversation rooms
    socket.on('join_conversation', (otherUserId: string) => {
      if (socket.userId) {
        const roomId = [socket.userId, otherUserId].sort().join('_')
        socket.join(roomId)
        console.log(`User ${socket.userId} joined conversation ${roomId}`)
      }
    })

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (otherUserId: string) => {
      if (socket.userId) {
        const roomId = [socket.userId, otherUserId].sort().join('_')
        socket.leave(roomId)
        console.log(`User ${socket.userId} left conversation ${roomId}`)
      }
    })

    // Handle real-time messaging
    socket.on('send_message', async (data: {
      receiverId: string
      content: string
      conversationId?: string
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', 'Not authenticated')
          return
        }

        const { receiverId, content } = data

        // Check if users are connected
        const connection = await prisma.connection.findFirst({
          where: {
            OR: [
              { senderId: socket.userId, receiverId, status: 'ACCEPTED' },
              { senderId: receiverId, receiverId: socket.userId, status: 'ACCEPTED' }
            ]
          }
        })

        if (!connection) {
          socket.emit('error', 'You can only message users you are connected with')
          return
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.userId,
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

        const messageData = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          timestamp: message.createdAt.toISOString(),
          isRead: message.isRead,
          sender: message.sender
        }

        // Send to receiver's personal room
        socket.to(`user_${receiverId}`).emit('new_message', messageData)

        // Send confirmation to sender
        socket.emit('message_sent', messageData)

        // Create notification for receiver if they're offline
        const receiverSocketId = activeUsers.get(receiverId)
        if (!receiverSocketId) {
          await prisma.notification.create({
            data: {
              userId: receiverId,
              type: 'MESSAGE',
              title: 'New Message',
              message: `${message.sender.name || 'Someone'} sent you a message`,
              data: JSON.stringify({
                messageId: message.id,
                senderId: socket.userId
              })
            }
          })
        }

        console.log(`Message from ${socket.userId} to ${receiverId} saved to database`)

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Handle loading conversation history
    socket.on('load_conversation', async (otherUserId: string) => {
      try {
        if (!socket.userId) {
          socket.emit('error', 'Not authenticated')
          return
        }

        // Get conversation messages
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: socket.userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: socket.userId }
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
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 50 // Last 50 messages
        })

        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            senderId: otherUserId,
            receiverId: socket.userId,
            isRead: false
          },
          data: { isRead: true }
        })

        const conversationData = messages.map(message => ({
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          timestamp: message.createdAt.toISOString(),
          isRead: message.isRead,
          sender: message.sender
        }))

        socket.emit('conversation_loaded', conversationData)

      } catch (error) {
        console.error('Error loading conversation:', error)
        socket.emit('error', 'Failed to load conversation')
      }
    })

    // Handle typing indicators
    socket.on('typing_start', (receiverId: string) => {
      if (socket.userId) {
        socket.to(`user_${receiverId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: true
        })
      }
    })

    socket.on('typing_stop', (receiverId: string) => {
      if (socket.userId) {
        socket.to(`user_${receiverId}`).emit('user_typing', {
          userId: socket.userId,
          isTyping: false
        })
      }
    })

    // Handle user disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId)
        console.log(`User ${socket.userId} disconnected`)

        // Broadcast user offline status
        socket.broadcast.emit('user_offline', { userId: socket.userId })
      }
    })
  })

  return io
}

// Helper function to get active users
export const getActiveUsers = () => Array.from(activeUsers.keys())

// Helper function to check if user is online
export const isUserOnline = (userId: string) => activeUsers.has(userId)

// Helper function to get user's socket ID
export const getUserSocketId = (userId: string) => activeUsers.get(userId)
