import { Realtime } from 'ably'

export const ably = new Realtime({
  key: process.env.ABLY_API_KEY,
  clientId: Math.random().toString(36).substring(7)
})

export const ablyChannel = ably.channels.get('navin-updates')

// Types for Ably messages
export interface AblyMessage {
  type: 'new_post' | 'new_message' | 'user_online' | 'user_offline' | 'post_like' | 'post_comment'
  data: any
  timestamp: string
}