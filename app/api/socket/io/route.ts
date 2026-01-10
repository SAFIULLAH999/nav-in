import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponseServerIo } from '@/lib/socket'
import { initSocketIO } from '@/lib/socket'

// Initialize Socket.IO server
let io: ServerIO | null = null

// Socket.IO handler for Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  // Initialize Socket.IO server on first request
  if (!io) {
    console.log('Initializing Socket.IO server...')
    io = initSocketIO(res.socket.server)
  }

  // Handle Socket.IO upgrade
  if (!res.socket.server.io) {
    console.log('Attaching Socket.IO to server...')
    res.socket.server.io = io
  }

  // End the request (Socket.IO will handle the rest)
  res.end()
}