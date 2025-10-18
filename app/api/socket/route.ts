import { NextRequest } from 'next/server'
import { initSocketIO } from '@/lib/socket'

export async function GET(req: NextRequest) {
  // Socket.io setup will be handled by the client-side connection
  return new Response('Socket.io endpoint', { status: 200 })
}