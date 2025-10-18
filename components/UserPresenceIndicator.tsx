'use client'

import React from 'react'
import { useSocket } from '@/components/SocketProvider'

interface UserPresenceIndicatorProps {
  userId: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  userId,
  showLabel = false,
  size = 'md'
}) => {
  const { activeUsers } = useSocket()
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

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`rounded-full border-2 border-white ${sizeClasses[size]} ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={isOnline ? 'Online' : 'Offline'}
      />
      {showLabel && (
        <span className={`${labelClasses[size]} text-text-muted`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}