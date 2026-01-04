import { NextRequest, NextResponse } from 'next/server'
import { WebSocketServer } from 'ws'
import { prisma } from '@/lib/prisma-mock'

// WebSocket server for real-time job updates
let wss: WebSocketServer
let connectedClients = 0
let maxClients = 100
let connectionStats: { clientId: string, connectedAt: Date, lastPing: Date, ipAddress: string }[] = []

// Network performance metrics
let totalMessagesSent = 0
let totalBytesSent = 0
let lastResetTime = new Date()

function setupWebSocketServer() {
  if (wss) return wss

  wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws, req) => {
    const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 8)
    const ipAddress = req.socket.remoteAddress || 'unknown'
    connectedClients++

    // Add connection stats
    connectionStats.push({
      clientId,
      connectedAt: new Date(),
      lastPing: new Date(),
      ipAddress
    })

    console.log(`New client connected to job WebSocket (ID: ${clientId}, IP: ${ipAddress}, Total: ${connectedClients})`)

    // Send initial job data to new client
    const initialData = JSON.stringify({
      type: 'INITIAL_DATA',
      data: {
        message: 'Connected to job updates',
        clientId,
        connectedAt: new Date().toISOString(),
        totalConnectedClients: connectedClients
      }
    })
    
    sendWithStats(ws, initialData)

    // Heartbeat/ping mechanism
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.ping()
        // Update last ping time
        const clientIndex = connectionStats.findIndex(c => c.clientId === clientId)
        if (clientIndex >= 0) {
          connectionStats[clientIndex].lastPing = new Date()
        }
      }
    }, 30000) // Ping every 30 seconds

    ws.on('close', () => {
      clearInterval(pingInterval)
      connectedClients--
      connectionStats = connectionStats.filter(c => c.clientId !== clientId)
      console.log(`Client disconnected from job WebSocket (ID: ${clientId}, Remaining: ${connectedClients})`)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error)
      clearInterval(pingInterval)
      connectedClients--
      connectionStats = connectionStats.filter(c => c.clientId !== clientId)
    })

    ws.on('pong', () => {
      // Client responded to ping - update stats
      const clientIndex = connectionStats.findIndex(c => c.clientId === clientId)
      if (clientIndex >= 0) {
        connectionStats[clientIndex].lastPing = new Date()
      }
    })
  })

  return wss
}

// Helper function to send messages and track stats
function sendWithStats(ws: any, message: string) {
  if (ws.readyState === 1) { // 1 = OPEN
    ws.send(message)
    totalMessagesSent++
    totalBytesSent += Buffer.byteLength(message, 'utf8')
  }
}

// Handle WebSocket upgrade
export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return NextResponse.json(
      { error: 'Expected WebSocket connection' },
      { status: 400 }
    )
  }

  // Check connection limits
  if (connectedClients >= maxClients) {
    return NextResponse.json(
      { error: 'WebSocket server at capacity', details: `Maximum ${maxClients} clients connected` },
      { status: 503 }
    )
  }

  const wss = setupWebSocketServer()

  // This is a simplified implementation
  // In a real Next.js app, you'd need to handle the WebSocket upgrade properly
  return NextResponse.json(
    { message: 'WebSocket endpoint - use ws:// protocol' },
    { status: 200 }
  )
}

// Broadcast job updates to all connected clients
export function broadcastJobUpdate(data: any) {
  if (!wss) {
    setupWebSocketServer()
  }

  const message = JSON.stringify({
    type: 'JOB_UPDATE',
    data,
    timestamp: new Date().toISOString()
  })

  let successfulSends = 0
  let failedSends = 0

  wss?.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      try {
        sendWithStats(client, message)
        successfulSends++
      } catch (error) {
        console.error('Failed to send to client:', error)
        failedSends++
      }
    }
  })

  // Log broadcast stats
  if (successfulSends > 0 || failedSends > 0) {
    console.log(`Broadcast: ${successfulSends} successful, ${failedSends} failed, ${connectedClients} total clients`)
  }
}

// Function to monitor job changes and broadcast updates
export async function monitorJobChanges() {
  // This would typically be run as a background process
  // For demo purposes, we'll just log the function
  console.log('Job monitoring service started')

  // In a real implementation, you would:
  // 1. Set up database change listeners
  // 2. Poll for changes periodically
  // 3. Broadcast updates to WebSocket clients
}

// GET endpoint to get WebSocket status
export async function GETStatus() {
  try {
    const uptime = Date.now() - lastResetTime.getTime()
    const uptimeSeconds = Math.floor(uptime / 1000)
    
    // Calculate network stats
    const avgMessageSize = totalMessagesSent > 0 ? Math.round(totalBytesSent / totalMessagesSent) : 0
    const messagesPerSecond = uptimeSeconds > 0 ? (totalMessagesSent / uptimeSeconds).toFixed(2) : '0'
    
    return NextResponse.json({
      success: true,
      data: {
        websocketStatus: 'active',
        connectedClients,
        maxClients,
        connectionCapacity: Math.round((connectedClients / maxClients) * 100) + '%',
        totalMessagesSent,
        totalBytesSent,
        avgMessageSize: `${avgMessageSize} bytes`,
        messagesPerSecond: `${messagesPerSecond} msg/sec`,
        uptimeSeconds,
        activeConnections: connectionStats.map(c => ({
          clientId: c.clientId,
          connectedAt: c.connectedAt.toISOString(),
          lastPing: c.lastPing.toISOString(),
          ipAddress: c.ipAddress
        })),
        lastUpdate: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching WebSocket status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch WebSocket status' },
      { status: 500 }
    )
  }
}

// Reset network statistics
export async function resetNetworkStats() {
  totalMessagesSent = 0
  totalBytesSent = 0
  lastResetTime = new Date()
  
  return NextResponse.json({
    success: true,
    data: {
      message: 'Network statistics reset successfully',
      resetTime: lastResetTime.toISOString()
    }
  })
}

// Set maximum clients
export async function setMaxClients(newMax: number) {
  if (newMax < 1 || newMax > 1000) {
    return NextResponse.json(
      { success: false, error: 'Max clients must be between 1 and 1000' },
      { status: 400 }
    )
  }

  const oldMax = maxClients
  maxClients = newMax

  return NextResponse.json({
    success: true,
    data: {
      message: 'Maximum clients updated successfully',
      oldMax,
      newMax: maxClients
    }
  })
}

// Get connection statistics
export async function getConnectionStats() {
  const now = new Date()
  
  // Calculate connection durations
  const connectionsWithDuration = connectionStats.map(c => ({
    ...c,
    durationSeconds: Math.floor((now.getTime() - c.connectedAt.getTime()) / 1000),
    pingLatencySeconds: Math.floor((now.getTime() - c.lastPing.getTime()) / 1000)
  }))

  return NextResponse.json({
    success: true,
    data: {
      totalConnections: connectionsWithDuration.length,
      averageConnectionDuration: connectionsWithDuration.reduce((sum, c) => sum + c.durationSeconds, 0) / (connectionsWithDuration.length || 1),
      connections: connectionsWithDuration
    }
  })
}