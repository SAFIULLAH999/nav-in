import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  // For Vercel deployment, we'll use a different approach
  // Socket.io doesn't work well with serverless functions
  return new Response(JSON.stringify({
    error: 'Socket.io not available in serverless environment',
    fallback: 'Real-time features disabled for serverless deployment'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}