import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// PUT - Update connection request (accept/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult || !('user' in authResult)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const currentUserId = authResult.user.userId
    const connectionId = params.id
    const body = await request.json()
    const { action } = body

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid action (accept/reject) is required' },
        { status: 400 }
      )
    }

    // Find the connection request
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
            location: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            location: true,
          }
        }
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection request not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized to update this connection
    if (connection.receiverId !== currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this connection' },
        { status: 403 }
      )
    }

    if (connection.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Connection request is no longer pending' },
        { status: 400 }
      )
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
        strength: action === 'accept' ? 5 : 1 // Higher strength for accepted connections
      }
    })

    // Create notification for the sender
    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Request Accepted',
          message: `${connection.receiver.name} accepted your connection request`,
          data: JSON.stringify({
            connectionId: connection.id,
            accepterId: currentUserId,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedConnection
    })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}
