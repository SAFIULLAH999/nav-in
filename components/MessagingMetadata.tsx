'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { 
  CheckCircle, 
  CheckCheck, 
  Clock, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh
} from 'lucide-react'

interface MessageMetadata {
  id: string
  messageId: string
  isRead: boolean
  readAt?: Date
  deliveredAt?: Date
  typingIndicator?: boolean
  typingUserId?: string
  connectionStatus: 'online' | 'offline' | 'connecting'
  lastSeen?: Date
  messageStatus: 'sending' | 'sent' | 'delivered' | 'read'
  retryCount: number
  error?: string
  encryptionStatus: 'encrypted' | 'decrypted' | 'pending'
  mediaStatus?: 'loading' | 'loaded' | 'error'
  reactions?: string[]
  replyTo?: string
  forwardedFrom?: string
}

interface MessagingMetadataProps {
  metadata: MessageMetadata
  showConnectionStatus?: boolean
  showReadReceipts?: boolean
  showTypingIndicator?: boolean
  showEncryptionStatus?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const MessagingMetadata: React.FC<MessagingMetadataProps> = ({
  metadata,
  showConnectionStatus = true,
  showReadReceipts = true,
  showTypingIndicator = true,
  showEncryptionStatus = true,
  size = 'md'
}) => {
  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-500" />
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-blue-500" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-green-500" />
      default:
        return <Clock className="w-3 h-3 text-gray-500" />
    }
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <SignalHigh className="w-3 h-3 text-green-500" />
      case 'offline':
        return <WifiOff className="w-3 h-3 text-gray-500" />
      case 'connecting':
        return <Signal className="w-3 h-3 text-yellow-500 animate-pulse" />
      default:
        return <WifiOff className="w-3 h-3 text-gray-500" />
    }
  }

  const getEncryptionStatusIcon = (status: string) => {
    switch (status) {
      case 'encrypted':
        return <EyeOff className="w-3 h-3 text-blue-500" />
      case 'decrypted':
        return <Eye className="w-3 h-3 text-green-500" />
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />
      default:
        return <EyeOff className="w-3 h-3 text-gray-500" />
    }
  }

  const getMessageStatusText = (status: string) => {
    switch (status) {
      case 'sending':
        return 'Sending...'
      case 'sent':
        return 'Sent'
      case 'delivered':
        return 'Delivered'
      case 'read':
        return 'Read'
      default:
        return status
    }
  }

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'offline':
        return 'Offline'
      case 'connecting':
        return 'Connecting...'
      default:
        return status
    }
  }

  const getEncryptionStatusText = (status: string) => {
    switch (status) {
      case 'encrypted':
        return 'Encrypted'
      case 'decrypted':
        return 'Decrypted'
      case 'pending':
        return 'Encrypting...'
      default:
        return status
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Message Status */}
      {showReadReceipts && (
        <Tooltip 
          content={
            <div>
              <p>{getMessageStatusText(metadata.messageStatus)}</p>
              {metadata.readAt && (
                <p className="text-xs text-gray-500">
                  Read at {new Date(metadata.readAt).toLocaleTimeString()}
                </p>
              )}
              {metadata.deliveredAt && (
                <p className="text-xs text-gray-500">
                  Delivered at {new Date(metadata.deliveredAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          }
        >
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {getMessageStatusIcon(metadata.messageStatus)}
          </Badge>
        </Tooltip>
      )}

      {/* Connection Status */}
      {showConnectionStatus && (
        <Tooltip 
          content={
            <div>
              <p>{getConnectionStatusText(metadata.connectionStatus)}</p>
              {metadata.lastSeen && metadata.connectionStatus === 'offline' && (
                <p className="text-xs text-gray-500">
                  Last seen {new Date(metadata.lastSeen).toLocaleString()}
                </p>
              )}
            </div>
          }
        >
          <Badge variant="outline" className="text-xs px-1 py-0">
            {getConnectionStatusIcon(metadata.connectionStatus)}
          </Badge>
        </Tooltip>
      )}

      {/* Encryption Status */}
      {showEncryptionStatus && (
        <Tooltip 
          content={<p>{getEncryptionStatusText(metadata.encryptionStatus)}</p>}
        >
          <Badge variant="outline" className="text-xs px-1 py-0">
            {getEncryptionStatusIcon(metadata.encryptionStatus)}
          </Badge>
        </Tooltip>
      )}

      {/* Typing Indicator */}
      {showTypingIndicator && metadata.typingIndicator && (
        <Badge variant="secondary" className="text-xs px-2 py-0 animate-pulse">
          Typing...
        </Badge>
      )}

      {/* Error Indicator */}
      {metadata.error && (
        <Badge variant="destructive" className="text-xs px-2 py-0">
          Error: {metadata.error}
        </Badge>
      )}

      {/* Retry Count */}
      {metadata.retryCount > 0 && (
        <Badge variant="outline" className="text-xs px-1 py-0">
          Retry: {metadata.retryCount}
        </Badge>
      )}

      {/* Media Status */}
      {metadata.mediaStatus && (
        <Badge variant="secondary" className="text-xs px-2 py-0">
          {metadata.mediaStatus === 'loading' && 'Loading...'}
          {metadata.mediaStatus === 'loaded' && 'Loaded'}
          {metadata.mediaStatus === 'error' && 'Error'}
        </Badge>
      )}

      {/* Reactions */}
      {metadata.reactions && metadata.reactions.length > 0 && (
        <Badge variant="outline" className="text-xs px-2 py-0">
          {metadata.reactions.join(' ')} {metadata.reactions.length}
        </Badge>
      )}
    </div>
  )
}

// Component for displaying connection status in chat headers
export const ConnectionStatusIndicator: React.FC<{
  userId: string
  connectionStatus: 'online' | 'offline' | 'connecting'
  lastSeen?: Date
  size?: 'sm' | 'md' | 'lg'
}> = ({
  userId,
  connectionStatus,
  lastSeen,
  size = 'md'
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-400'
      case 'connecting':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'offline':
        return lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : 'Offline'
      case 'connecting':
        return 'Connecting...'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}></div>
      <span className="text-sm text-text-muted">{getStatusText(connectionStatus)}</span>
    </div>
  )
}

// Component for displaying message delivery status
export const MessageDeliveryStatus: React.FC<{
  status: 'sending' | 'sent' | 'delivered' | 'read'
  readAt?: Date
  deliveredAt?: Date
  size?: 'sm' | 'md' | 'lg'
}> = ({
  status,
  readAt,
  deliveredAt,
  size = 'md'
}) => {
  const getIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getText = (status: string) => {
    switch (status) {
      case 'sending':
        return 'Sending...'
      case 'sent':
        return 'Sent'
      case 'delivered':
        return 'Delivered'
      case 'read':
        return readAt ? `Read ${new Date(readAt).toLocaleTimeString()}` : 'Read'
      default:
        return status
    }
  }

  return (
    <div className="flex items-center space-x-1 text-xs text-text-muted">
      {getIcon(status)}
      <span>{getText(status)}</span>
    </div>
  )
}