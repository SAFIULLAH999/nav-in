'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import Pusher from 'pusher-js'

interface PusherContextType {
  pusher: Pusher | null
  isConnected: boolean
  channel: any
  publish: (event: string, data: any) => void
  subscribe: (event: string, callback: (data: any) => void) => () => void
}

const PusherContext = createContext<PusherContextType | undefined>(undefined)

export const usePusher = (): PusherContextType => {
  const context = useContext(PusherContext)
  if (context === undefined) {
    throw new Error('usePusher must be used within a PusherProvider')
  }
  return context
}

interface PusherProviderProps {
  children: React.ReactNode
  appKey?: string
  cluster?: string
  channelName?: string
}

export const PusherProvider: React.FC<PusherProviderProps> = ({
  children,
  appKey = process.env.NEXT_PUBLIC_PUSHER_KEY,
  cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  channelName = 'navin-updates'
}) => {
  const [pusher, setPusher] = useState<Pusher | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!appKey) {
      console.warn('Pusher app key not provided')
      return
    }

    const pusherClient = new Pusher(appKey, {
      cluster,
      useTLS: true,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`
        }
      }
    })

    pusherClient.connection.bind('connected', () => {
      setIsConnected(true)
      console.log('Connected to Pusher')
    })

    pusherClient.connection.bind('disconnected', () => {
      setIsConnected(false)
      console.log('Disconnected from Pusher')
    })

    pusherClient.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error)
    })

    const pusherChannel = pusherClient.subscribe(channelName)
    setChannel(pusherChannel)
    setPusher(pusherClient)

    return () => {
      pusherClient.disconnect()
    }
  }, [appKey, cluster, channelName])

  const publish = (event: string, data: any) => {
    // Pusher publishing requires server-side API
    fetch('/api/pusher/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        channel: channelName,
        event,
        data: { ...data, timestamp: new Date().toISOString() }
      })
    }).catch(console.error)
  }

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!channel) return () => {}

    const listener = (data: any) => {
      callback(data)
    }

    channel.bind(event, listener)

    return () => {
      channel.unbind(event, listener)
    }
  }

  const value: PusherContextType = {
    pusher,
    isConnected,
    channel,
    publish,
    subscribe
  }

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  )
}