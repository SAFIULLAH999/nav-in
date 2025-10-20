'use client'

import React, { useState, useEffect } from 'react'
import { useSocket } from '@/components/SocketProvider'

interface UserPresenceIndicatorProps {
  userId: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLastSeen?: boolean
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  userId,
  showLabel = false,
  size = 'md',
  showLastSeen = false
}) => {
  const { activeUsers, isServerless } = useSocket()
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isOnline = activeUsers.includes(userId)

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const labelClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Fetch last seen time when user is offline
  useEffect(() => {
    if (!isOnline && showLastSeen && !isLoading) {
      setIsLoading(true)
      fetch(`/api/user/activity?limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const user = data.data.activeUsers.find((u: any) => u.id === userId)
            if (user) {
              setLastSeen(user.lastSeen)
            }
          }
        })
        .catch(error => {
          console.error('Failed to fetch last seen:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOnline, userId, showLastSeen, isLoading])

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  const getTooltipText = () => {
    if (isOnline) return 'Online'
    if (lastSeen) return `Last seen ${formatLastSeen(lastSeen)}`
    return 'Offline'
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`rounded-full border-2 border-white ${sizeClasses[size]} ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={getTooltipText()}
      />
      {showLabel && (
        <span className={`${labelClasses[size]} text-text-muted`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
      {showLastSeen && !isOnline && lastSeen && (
        <span className={`${labelClasses[size]} text-text-muted text-xs`}>
          {formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  )
}
