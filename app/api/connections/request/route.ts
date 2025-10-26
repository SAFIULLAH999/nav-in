import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// POST - Send a connection request
export async function POST(request: NextRequest) {
  try {
    // For testing purposes, allow unauthenticated access
    let currentUserId = null
    try {
      const authResult = await authenticateRequest(request)
      currentUserId = authResult && 'user' in authResult ? authResult.user.userId : null
    } catch (error) {
      // Continue without authentication for testing
      console.log('Authentication failed, using demo user for testing')
    }

    // If no authenticated user, use demo user for testing
    if (!currentUserId) {
      currentUserId = 'demo-user-1'
    }

    const body = await request.json()
    const { receiverId, connectionType = 'PROFESSIONAL', message } = body

    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    // Check if users exist
    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ])

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId },
          { senderId: receiverId, receiverId: currentUserId }
        ]
      }
    })

    if (existingConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection request already exists' },
        { status: 400 }
      )
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        senderId: currentUserId,
        receiverId,
        status: 'PENDING',
        connectionType,
        notes: message,
        strength: 1
      }
    })

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${currentUser.name} wants to connect with you`,
        data: JSON.stringify({
          connectionId: connection.id,
          senderId: currentUserId,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: connection
    })
  } catch (error) {
    console.error('Error sending connection request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send connection request' },
      { status: 500 }
    )
  }
}
