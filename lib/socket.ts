import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import jwt from 'jsonwebtoken'

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO
    }
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

        // Check if users are connected (you might want to implement this check)
        // For now, we'll allow messaging between any authenticated users

        // Create message in database (you might want to do this via API call)
        // For real-time demo, we'll just broadcast the message

        const messageData = {
          id: `temp_${Date.now()}`,
          content,
          senderId: socket.userId,
          receiverId,
          timestamp: new Date().toISOString(),
          isRead: false
        }

        // Send to receiver's personal room
        socket.to(`user_${receiverId}`).emit('new_message', messageData)

        // Send confirmation to sender
        socket.emit('message_sent', messageData)

        console.log(`Message from ${socket.userId} to ${receiverId}`)

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', 'Failed to send message')
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
