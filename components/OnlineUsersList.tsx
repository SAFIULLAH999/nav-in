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
  const { activeUsers } = useSocket()
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

      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

        if (!token) {
          setLoading(false)
          return
        }

        // Get user details for online users
        const usersData = await Promise.all(
          activeUsers.map(async (userId) => {
            try {
              const response = await fetch(`/api/profile/public/${userId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })

              if (response.ok) {
                const data = await response.json()
                return data.user
              }
            } catch (error) {
              console.error(`Error loading user ${userId}:`, error)
            }
            return null
          })
        )

        const validUsers = usersData.filter(user => user !== null) as OnlineUser[]
        setOnlineUsers(validUsers)
      } catch (error) {
        console.error('Error loading online users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOnlineUsers()
  }, [activeUsers])

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
        <span className="text-sm text-text-muted bg-secondary px-2 py-1 rounded-full">
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