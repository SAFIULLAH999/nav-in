import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JWTManager } from '@/lib/jwt'
import { Logger } from '@/lib/logger'

// PATCH - Update user status (ban, activate, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = JWTManager.verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!action || !['ban', 'unban', 'activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user status based on action
    let updateData: any = {}
    let newStatus = user.isActive

    switch (action) {
      case 'ban':
      case 'deactivate':
        updateData.isActive = false
        newStatus = false
        break
      case 'unban':
      case 'activate':
        updateData.isActive = true
        newStatus = true
        break
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isActive: true,
        createdAt: true
      }
    })

    Logger.info('Admin user action performed', {
      adminId: payload.userId,
      targetUserId: userId,
      action,
      newStatus
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User ${action}ed successfully`
    })
  } catch (error) {
    Logger.error('Admin user action failed', error as Error, {
      userId: params.id,
      action: 'unknown'
    })

    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = JWTManager.verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete - mark as inactive and anonymize
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        name: '[Deleted User]',
        email: `deleted.${userId}@deleted.local`,
        username: null,
        bio: null,
        title: null,
        company: null,
        location: null,
        website: null,
        skills: [],
        avatar: null,
        summary: null,
        socialLinks: null
      }
    })

    Logger.info('User soft deleted by admin', {
      adminId: payload.userId,
      deletedUserId: userId
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    Logger.error('Admin user deletion failed', error as Error, {
      userId: params.id
    })

    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
