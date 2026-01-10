'use client'

import React, { useState, useEffect } from 'react'
import { Users, Circle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSocket } from '@/components/SocketProvider'

interface OnlineUser {
  id: string
  name: string
  avatar?: string
  title?: string
}

interface OnlineUsersListProps {
  className?: string
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({ className = '' }) => {
  const { activeUsers, activeUserDetails, onUserOnline, onUserOffline } = useSocket()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  // Load online users details
  useEffect(() => {
    const loadOnlineUsers = async () => {
      if (activeUsers.length === 0) {
        setOnlineUsers([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // If provider already has detailed active user info, use it (faster / realtime)
        if (activeUserDetails && activeUserDetails.length > 0) {
          const currentTime = new Date()
          const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000)

          const recentUsers = activeUserDetails.filter((user: any) => {
            const lastSeen = new Date(user.lastSeen)
            return lastSeen >= fiveMinutesAgo
          })

          setOnlineUsers(recentUsers)
          setLoading(false)
          return
        }

        // Fallback: Use the activity API to get user details for online users
        const response = await fetch('/api/user/activity?limit=100')

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const currentTime = new Date()
            const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000)

            const recentUsers = data.data.activeUsers.filter((user: any) => {
              const lastSeen = new Date(user.lastSeen)
              return lastSeen >= fiveMinutesAgo
            })

            setOnlineUsers(recentUsers)
          }
        }
      } catch (error) {
        console.error('Error loading online users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOnlineUsers()
  }, [activeUsers, activeUserDetails])

  // Set up real-time user presence listeners
  useEffect(() => {
    // Using handlers from top-level useSocket() call

    const handleUserOnline = (data: { userId: string }) => {
      // When a user comes online, fetch their details and add to the list
      console.log(`User ${data.userId} came online`)
      
      // Fetch user details for the newly online user
      const fetchUserDetails = async () => {
        try {
          const response = await fetch(`/api/user/activity?userId=${data.userId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data.activeUsers.length > 0) {
              const user = result.data.activeUsers[0]
              setOnlineUsers(prev => {
                // Check if user is already in the list
                const userExists = prev.some(u => u.id === user.id)
                if (!userExists) {
                  return [...prev, user]
                }
                return prev
              })
            }
          }
        } catch (error) {
          console.error('Error fetching online user details:', error)
        }
      }

      fetchUserDetails()
    }

    const handleUserOffline = (data: { userId: string }) => {
      // When a user goes offline, remove them from the list
      console.log(`User ${data.userId} went offline`)
      setOnlineUsers(prev => prev.filter(user => user.id !== data.userId))
    }

    // Subscribe to real-time events
    const unsubscribeOnline = onUserOnline(handleUserOnline)
    const unsubscribeOffline = onUserOffline(handleUserOffline)

    return () => {
      // Clean up subscriptions
      unsubscribeOnline()
      unsubscribeOffline()
    }
  }, [onUserOnline, onUserOffline])

  if (loading) {
    return (
      <div className={`bg-card rounded-xl shadow-soft border border-border p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text">Online Users</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-secondary rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card rounded-xl shadow-soft border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text">Online Users</h3>
        </div>
        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center justify-center">
          {onlineUsers.length}
        </span>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="text-center py-8">
          <Circle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No users online</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {onlineUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {user.name}
                </p>
                {user.title && (
                  <p className="text-xs text-text-muted truncate">
                    {user.title}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
