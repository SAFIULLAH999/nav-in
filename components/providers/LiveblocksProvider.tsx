'use client'

import React, { createContext, useContext } from 'react'
import { LiveblocksProvider as LBProvider, ClientSideSuspense } from '@liveblocks/react'
import { liveblocks } from '@/lib/liveblocks'

interface LiveblocksContextType {
  enterRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  isConnected: boolean
}

const LiveblocksContext = createContext<LiveblocksContextType | undefined>(undefined)

export const useLiveblocks = (): LiveblocksContextType => {
  const context = useContext(LiveblocksContext)
  if (context === undefined) {
    throw new Error('useLiveblocks must be used within a LiveblocksProvider')
  }
  return context
}

interface LiveblocksProviderProps {
  children: React.ReactNode
  publicKey?: string
}

const LiveblocksProviderContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LiveblocksContext.Provider value={{
      enterRoom: (roomId: string) => {
        console.log('Entering room:', roomId)
      },
      leaveRoom: (roomId: string) => {
        console.log('Leaving room:', roomId)
      },
      isConnected: true
    }}>
      {children}
    </LiveblocksContext.Provider>
  )
}

export const LiveblocksProvider: React.FC<LiveblocksProviderProps> = ({ children }) => {
  // Always use mock provider in development to avoid configuration issues
  return (
    <LiveblocksProviderContent>
      {children}
    </LiveblocksProviderContent>
  )
}
