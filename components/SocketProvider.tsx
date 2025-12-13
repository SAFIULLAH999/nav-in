'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useUser, useAuth } from '@clerk/nextjs'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  isServerless: boolean
  activeUsers: string[]
  sendMessage: (receiverId: string, content: string) => void
  joinConversation: (otherUserId: string) => void
  leaveConversation: (otherUserId: string) => void
  sendConnectionRequest: (receiverId: string, connectionType?: string, message?: string) => void
  respondConnectionRequest: (requestId: string, action: 'accept' | 'reject') => void
  onMessage: (callback: (message: any) => void) => void
  onUserOnline: (callback: (data: { userId: string }) => void) => void
  onUserOffline: (callback: (data: { userId: string }) => void) => void
  onNotification: (callback: (notification: any) => void) => void
  onPostUpdate: (callback: (data: any) => void) => void
  onConnectionRequestReceived: (callback: (data: any) => void) => () => void
  onConnectionRequestSent: (callback: (data: any) => void) => () => void
  onConnectionRequestResponded: (callback: (data: any) => void) => () => void
  onConnectionStatusChanged: (callback: (data: any) => void) => () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isServerless, setIsServerless] = useState(false)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const { user } = useUser()
  const { getToken } = useAuth()
  const messageCallbacks = useRef<((message: any) => void)[]>([])
  const userOnlineCallbacks = useRef<((data: { userId: string }) => void)[]>([])
  const userOfflineCallbacks = useRef<((data: { userId: string }) => void)[]>([])
  const notificationCallbacks = useRef<((notification: any) => void)[]>([])
  const postUpdateCallbacks = useRef<((data: any) => void)[]>([])
  const connectionRequestReceivedCallbacks = useRef<((data: any) => void)[]>([])
  const connectionRequestSentCallbacks = useRef<((data: any) => void)[]>([])
  const connectionRequestRespondedCallbacks = useRef<((data: any) => void)[]>([])
  const connectionStatusChangedCallbacks = useRef<((data: any) => void)[]>([])

  // Function to update user activity in serverless environment
  const updateUserActivity = async () => {
    if (user && isServerless) {
      try {
        await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            action: 'heartbeat',
            timestamp: new Date().toISOString()
          })
        })

        // Also fetch and update active users list
        await fetchActiveUsers()
      } catch (error) {
        console.error('Failed to update user activity:', error)
      }
    }
  }

  // Function to fetch active users in serverless environment
  const fetchActiveUsers = async () => {
    if (isServerless) {
      try {
        const response = await fetch('/api/user/activity?limit=100')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const activeUserIds = data.data.activeUsers.map((user: any) => user.id)
            setActiveUsers(activeUserIds)
          }
        }
      } catch (error) {
        console.error('Failed to fetch active users:', error)
      }
    }
  }

  useEffect(() => {
    const initializeSocket = async () => {
      if (user && !socket) {
        // For now, always use serverless mode (API polling) since socket.io server is not set up
        const useServerless = true

        if (useServerless) {
          console.log('Using API-based real-time features (socket.io server not configured)')
          setIsConnected(true)
          setIsServerless(true)

          // Set up periodic activity updates
          const activityInterval = setInterval(() => {
            updateUserActivity()
          }, 30000) // Update every 30 seconds

          // Initial activity update
          updateUserActivity()

          return () => {
            clearInterval(activityInterval)
          }
        }

        // Legacy socket.io code (currently disabled)
        /*
        // Get token for authentication
        const token = await getToken()

        // Initialize socket connection for development
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
          path: '/api/socket',
          auth: {
            token: token
          }
        })

        newSocket.on('connect', () => {
          console.log('Connected to socket server')
          setIsConnected(true)

          // Authenticate user
          newSocket.emit('authenticate', token)
        })

        newSocket.on('disconnect', () => {
          console.log('Disconnected from socket server')
          setIsConnected(false)
        })

        newSocket.on('auth_error', (error: string) => {
          console.error('Socket authentication failed:', error)
        })

        // Handle real-time messaging
        newSocket.on('new_message', (message: any) => {
          messageCallbacks.current.forEach(callback => callback(message))
        })

        newSocket.on('message_sent', (message: any) => {
          messageCallbacks.current.forEach(callback => callback(message))
        })

        // Handle user presence
        newSocket.on('user_online', (data: { userId: string }) => {
          setActiveUsers(prev => {
            const newUsers = [...prev, data.userId]
            return Array.from(new Set(newUsers))
          })
          userOnlineCallbacks.current.forEach(callback => callback(data))
        })

        newSocket.on('user_offline', (data: { userId: string }) => {
          setActiveUsers(prev => prev.filter(id => id !== data.userId))
          userOfflineCallbacks.current.forEach(callback => callback(data))
        })

        // Handle notifications
        newSocket.on('new_notification', (notification: any) => {
          notificationCallbacks.current.forEach(callback => callback(notification))
        })

        // Handle post updates (likes, comments, shares)
        newSocket.on('post_liked', (data: any) => {
          postUpdateCallbacks.current.forEach(callback => callback(data))
        })

        newSocket.on('post_commented', (data: any) => {
          postUpdateCallbacks.current.forEach(callback => callback(data))
        })

        newSocket.on('post_shared', (data: any) => {
          postUpdateCallbacks.current.forEach(callback => callback(data))
        })

        setSocket(newSocket)
        */
      }
    }

    initializeSocket()

    return () => {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user, socket, getToken])

  const sendMessage = (receiverId: string, content: string) => {
    if (isServerless) {
      console.log('Serverless environment - real-time messaging not available')
      return
    }
    if (socket && isConnected) {
      socket.emit('send_message', { receiverId, content })
    }
  }

  const joinConversation = (otherUserId: string) => {
    if (isServerless) {
      console.log('Serverless environment - conversation rooms not available')
      return
    }
    if (socket && isConnected) {
      socket.emit('join_conversation', otherUserId)
    }
  }

  const leaveConversation = (otherUserId: string) => {
    if (isServerless) {
      console.log('Serverless environment - conversation rooms not available')
      return
    }
    if (socket && isConnected) {
      socket.emit('leave_conversation', otherUserId)
    }
  }

  const sendConnectionRequest = (receiverId: string, connectionType?: string, message?: string) => {
    if (isServerless) {
      console.log('Serverless environment - real-time connection requests not available')
      return
    }
    if (socket && isConnected) {
      socket.emit('send_connection_request', { receiverId, connectionType, message })
    }
  }

  const respondConnectionRequest = (requestId: string, action: 'accept' | 'reject') => {
    if (isServerless) {
      console.log('Serverless environment - real-time connection responses not available')
      return
    }
    if (socket && isConnected) {
      socket.emit('respond_connection_request', { requestId, action })
    }
  }

  const onMessage = (callback: (message: any) => void) => {
    messageCallbacks.current.push(callback)
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onUserOnline = (callback: (data: { userId: string }) => void) => {
    userOnlineCallbacks.current.push(callback)
    return () => {
      userOnlineCallbacks.current = userOnlineCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onUserOffline = (callback: (data: { userId: string }) => void) => {
    userOfflineCallbacks.current.push(callback)
    return () => {
      userOfflineCallbacks.current = userOfflineCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onNotification = (callback: (notification: any) => void) => {
    notificationCallbacks.current.push(callback)
    return () => {
      notificationCallbacks.current = notificationCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onPostUpdate = (callback: (data: any) => void) => {
    postUpdateCallbacks.current.push(callback)
    return () => {
      postUpdateCallbacks.current = postUpdateCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onConnectionRequestReceived = (callback: (data: any) => void) => {
    connectionRequestReceivedCallbacks.current.push(callback)
    return () => {
      connectionRequestReceivedCallbacks.current = connectionRequestReceivedCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onConnectionRequestSent = (callback: (data: any) => void) => {
    connectionRequestSentCallbacks.current.push(callback)
    return () => {
      connectionRequestSentCallbacks.current = connectionRequestSentCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onConnectionRequestResponded = (callback: (data: any) => void) => {
    connectionRequestRespondedCallbacks.current.push(callback)
    return () => {
      connectionRequestRespondedCallbacks.current = connectionRequestRespondedCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const onConnectionStatusChanged = (callback: (data: any) => void) => {
    connectionStatusChangedCallbacks.current.push(callback)
    return () => {
      connectionStatusChangedCallbacks.current = connectionStatusChangedCallbacks.current.filter(cb => cb !== callback)
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    isServerless,
    activeUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendConnectionRequest,
    respondConnectionRequest,
    onMessage,
    onUserOnline,
    onUserOffline,
    onNotification,
    onPostUpdate,
    onConnectionRequestReceived,
    onConnectionRequestSent,
    onConnectionRequestResponded,
    onConnectionStatusChanged
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
