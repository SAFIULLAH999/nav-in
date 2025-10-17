import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow'])
})

// POST - Follow/Unfollow a user
export async function POST(
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
    const { action } = followSchema.parse(body)

    const targetUserId = params.id
    const currentUserId = authResult.user.userId

    // Prevent self-follow
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if target user exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    if (action === 'follow') {
      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      })

      if (existingFollow) {
        return NextResponse.json(
          { success: false, error: 'Already following this user' },
          { status: 400 }
        )
      }

      // Check if there's a connection request
      const existingConnection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUserId }
          ]
        }
      })

      // Create follow relationship
      const follow = await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId
        },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              title: true,
            }
          }
        }
      })

      // Create notification for followed user
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'NEW_FOLLOWER',
          title: 'New Follower',
          message: `${follow.following.name || 'Someone'} started following you`,
          data: JSON.stringify({
            followerId: currentUserId
          })
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: follow.id,
          following: {
            name: follow.following.name || 'Unknown User',
            username: follow.following.username || 'user',
            avatar: follow.following.avatar || '',
            title: follow.following.title || 'NavIN User'
          },
          createdAt: follow.createdAt.toISOString()
        },
        message: 'User followed successfully'
      })
    } else {
      // Unfollow user
      const deletedFollow = await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      })

      if (!deletedFollow) {
        return NextResponse.json(
          { success: false, error: 'Follow relationship not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'User unfollowed successfully'
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error toggling follow:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle follow' },
      { status: 500 }
    )
  }
}

// GET - Check if current user is following target user
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

    const targetUserId = params.id
    const currentUserId = authResult.user.userId

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!follow,
        followId: follow?.id || null
      }
    })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check follow status' },
      { status: 500 }
    )
  }
}
