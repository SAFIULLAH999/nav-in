'use client'

import React from 'react'
import { AblyProvider } from './AblyProvider'
import { PusherProvider } from './PusherProvider'
import { LiveblocksProvider } from './LiveblocksProvider'
import { SupabaseProvider } from './SupabaseProvider'

interface RealTimeProviderProps {
  children: React.ReactNode
  enableAbly?: boolean
  enablePusher?: boolean
  enableLiveblocks?: boolean
  enableSupabase?: boolean
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({
  children,
  enableAbly = !!process.env.NEXT_PUBLIC_ABLY_API_KEY,
  enablePusher = !!process.env.NEXT_PUBLIC_PUSHER_KEY,
  enableLiveblocks = !!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
  enableSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL
}) => {
  // For development, use SocketProvider
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isServerless = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

  if (isDevelopment && !isServerless) {
    // Use existing SocketProvider for development
    return <>{children}</>
  }

  // For production, wrap with available real-time providers
  return (
    <SupabaseProvider>
      {enableAbly && (
        <AblyProvider>
          {children}
        </AblyProvider>
      )}
      {enablePusher && (
        <PusherProvider>
          {children}
        </PusherProvider>
      )}
      {enableLiveblocks && (
        <LiveblocksProvider>
          {children}
        </LiveblocksProvider>
      )}
      {!enableAbly && !enablePusher && !enableLiveblocks && children}
    </SupabaseProvider>
  )
}