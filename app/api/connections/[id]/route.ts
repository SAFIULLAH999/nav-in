import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const updateConnectionSchema = z.object({
  action: z.enum(['accept', 'reject', 'block'])
})

// GET - Get connection details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const connectionId = params.id
    const userId = authResult.user.userId

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          }
        }
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this connection
    if (connection.senderId !== userId && connection.receiverId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        status: connection.status,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
        sender: {
          name: connection.sender.name || 'Unknown User',
          username: connection.sender.username || 'user',
          avatar: connection.sender.avatar || '',
          title: connection.sender.title || 'NavIN User',
          company: connection.sender.company || ''
        },
        receiver: {
          name: connection.receiver.name || 'Unknown User',
          username: connection.receiver.username || 'user',
          avatar: connection.receiver.avatar || '',
          title: connection.receiver.title || 'NavIN User',
          company: connection.receiver.company || ''
        }
      }
    })
  } catch (error) {
    console.error('Error fetching connection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connection' },
      { status: 500 }
    )
  }
}

// PUT - Update connection status (accept/reject/block)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = updateConnectionSchema.parse(body)

    const connectionId = params.id
    const userId = authResult.user.userId

    // Get connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: {
          select: { id: true, name: true, username: true }
        },
        receiver: {
          select: { id: true, name: true, username: true }
        }
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Only receiver can accept/reject, either user can block
    if (action === 'block') {
      // Block the connection
      const updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: { status: 'BLOCKED' }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: updatedConnection.id,
          status: updatedConnection.status,
          updatedAt: updatedConnection.updatedAt.toISOString()
        },
        message: 'Connection blocked successfully'
      })
    }

    // For accept/reject, user must be the receiver
    if (connection.receiverId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only receiver can perform this action' },
        { status: 403 }
      )
    }

    let newStatus: 'ACCEPTED' | 'BLOCKED'
    if (action === 'accept') {
      newStatus = 'ACCEPTED'

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Request Accepted',
          message: `${connection.receiver.name || 'Someone'} accepted your connection request`,
          data: JSON.stringify({
            connectionId: connection.id,
            receiverId: userId
          })
        }
      })
    } else {
      newStatus = 'BLOCKED'
    }

    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: newStatus }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        updatedAt: updatedConnection.updatedAt.toISOString()
      },
      message: `Connection ${action}ed successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating connection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}
