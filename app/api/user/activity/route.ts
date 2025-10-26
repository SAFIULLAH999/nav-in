import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

// Schema for activity updates
const activitySchema = z.object({
  userId: z.string(),
  action: z.enum(['heartbeat', 'page_view', 'profile_view', 'connection_made', 'post_created', 'login', 'logout']),
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// GET - Get active users (users who have been active in the last 5 minutes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get users who have been active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const activeUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: fiveMinutesAgo
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        title: true,
        lastLoginAt: true
      },
      take: limit,
      orderBy: {
        lastLoginAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: activeUsers.map(user => ({
          id: user.id,
          name: user.name || 'Unknown User',
          avatar: user.avatar || '',
          title: user.title || 'NavIN User',
          lastSeen: user.lastLoginAt?.toISOString() || new Date().toISOString(),
          isOnline: true
        })),
        count: activeUsers.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching active users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active users' },
      { status: 500 }
    )
  }
}

// POST - Update user activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, timestamp, metadata } = activitySchema.parse(body)

    // Update user's last activity timestamp (only if user exists)
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date()
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          lastLoginAt: true
        }
      })
    } catch (error) {
      // User doesn't exist, skip the update
      if (process.env.NODE_ENV === 'development') {
        // Don't log in development to avoid console noise
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: userId,
              name: 'Unknown User',
              avatar: '',
              title: 'NavIN User',
              lastSeen: new Date().toISOString(),
              isOnline: true
            },
            action,
            timestamp: new Date().toISOString()
          },
          message: 'Activity logged (user not in database)'
        })
      }

      console.log(`User ${userId} not found in database, skipping activity update`)
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: userId,
            name: 'Unknown User',
            avatar: '',
            title: 'NavIN User',
            lastSeen: new Date().toISOString(),
            isOnline: true
          },
          action,
          timestamp: new Date().toISOString()
        },
        message: 'Activity logged (user not in database)'
      })
    }

    // Store activity log for analytics (optional)
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: userId,
          eventType: 'user_activity',
          eventName: action,
          properties: JSON.stringify({
            action,
            timestamp: timestamp || new Date().toISOString(),
            metadata: metadata || {}
          }),
          timestamp: new Date()
        }
      })
    } catch (analyticsError) {
      // Don't fail the request if analytics logging fails
      console.error('Failed to log analytics event:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name || 'Unknown User',
          avatar: updatedUser.avatar || '',
          title: updatedUser.title || 'NavIN User',
          lastSeen: updatedUser.lastLoginAt?.toISOString() || new Date().toISOString(),
          isOnline: true
        },
        action,
        timestamp: new Date().toISOString()
      },
      message: 'Activity updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user activity' },
      { status: 500 }
    )
  }
}

// DELETE - Mark user as offline (logout)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId

    // Update user's last activity (don't clear it completely for presence tracking)
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          // Keep lastLoginAt for presence tracking but mark as offline in analytics
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          lastLoginAt: true
        }
      })
    } catch (error) {
      // User doesn't exist, skip the update
      if (process.env.NODE_ENV === 'development') {
        // Don't log in development to avoid console noise
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: userId,
              name: 'Unknown User',
              avatar: '',
              title: 'NavIN User',
              lastSeen: new Date().toISOString(),
              isOnline: false
            },
            timestamp: new Date().toISOString()
          },
          message: 'User logged out (user not in database)'
        })
      }

      console.log(`User ${userId} not found in database, skipping logout update`)
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: userId,
            name: 'Unknown User',
            avatar: '',
            title: 'NavIN User',
            lastSeen: new Date().toISOString(),
            isOnline: false
          },
          timestamp: new Date().toISOString()
        },
        message: 'User logged out (user not in database)'
      })
    }

    // Log logout event
    await prisma.analyticsEvent.create({
      data: {
        userId: userId,
        eventType: 'user_activity',
        eventName: 'logout',
        properties: JSON.stringify({
          timestamp: new Date().toISOString()
        }),
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name || 'Unknown User',
          avatar: updatedUser.avatar || '',
          title: updatedUser.title || 'NavIN User',
          lastSeen: updatedUser.lastLoginAt?.toISOString() || new Date().toISOString(),
          isOnline: false
        },
        timestamp: new Date().toISOString()
      },
      message: 'User marked as offline'
    })
  } catch (error) {
    console.error('Error marking user as offline:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark user as offline' },
      { status: 500 }
    )
  }
}
