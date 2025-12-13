import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  // Socket.io server is not initialized in API routes
  // This endpoint serves as a health check for socket connections
  return new Response(JSON.stringify({
    status: 'Socket.io server not available via API routes',
    message: 'Real-time features use polling fallback in development',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
