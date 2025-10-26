import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

// GET - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        // If we want to include related data in the future
      }
    })

    // Transform notifications for frontend
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      data: notification.data ? JSON.parse(notification.data) : null,
      createdAt: notification.createdAt.toISOString()
    }))

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId
    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
