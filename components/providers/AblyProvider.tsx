'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import * as Ably from 'ably'

interface AblyContextType {
  ably: Ably.Realtime | null
  isConnected: boolean
  channel: any
  publish: (event: string, data: any) => void
  subscribe: (event: string, callback: (data: any) => void) => () => void
}

const AblyContext = createContext<AblyContextType | undefined>(undefined)

export const useAbly = (): AblyContextType => {
  const context = useContext(AblyContext)
  if (context === undefined) {
    throw new Error('useAbly must be used within an AblyProvider')
  }
  return context
}

interface AblyProviderProps {
  children: React.ReactNode
  apiKey?: string
  channelName?: string
}

export const AblyProvider: React.FC<AblyProviderProps> = ({
  children,
  apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY,
  channelName = 'navin-updates'
}) => {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!apiKey) {
      console.warn('Ably API key not provided')
      return
    }

    const realtime = new Ably.Realtime({
      key: apiKey,
      clientId: Math.random().toString(36).substring(7)
    })

    realtime.connection.on('connected', () => {
      setIsConnected(true)
      console.log('Connected to Ably')
    })

    realtime.connection.on('failed', () => {
      setIsConnected(false)
      console.error('Failed to connect to Ably')
    })

    const ablyChannel = realtime.channels.get(channelName)
    setChannel(ablyChannel)
    setAbly(realtime)

    return () => {
      realtime.close()
    }
  }, [apiKey, channelName])

  const publish = (event: string, data: any) => {
    if (channel && isConnected) {
      channel.publish(event, { ...data, timestamp: new Date().toISOString() })
    }
  }

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!channel) return () => {}

    const listener = (message: any) => {
      callback(message.data)
    }

    channel.subscribe(event, listener)

    return () => {
      channel.unsubscribe(event, listener)
    }
  }

  const value: AblyContextType = {
    ably,
    isConnected,
    channel,
    publish,
    subscribe
  }

  return (
    <AblyContext.Provider value={value}>
      {children}
    </AblyContext.Provider>
  )
}