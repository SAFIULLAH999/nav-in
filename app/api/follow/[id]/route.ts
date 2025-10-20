import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const followSchema = z.object({
  followType: z.enum(['USER', 'COMPANY', 'TOPIC']).default('USER')
})

// POST - Follow a user/company/topic
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { followType } = followSchema.parse(body)

    const followerId = authResult.user.userId
    const followingId = params.id

    // Prevent self-following
    if (followerId === followingId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if target exists and is active (for users)
    if (followType === 'USER') {
      const targetUser = await prisma.user.findUnique({
        where: { id: followingId }
      })

      if (!targetUser || !targetUser.isActive) {
        return NextResponse.json(
          { success: false, error: 'User not found or inactive' },
          { status: 404 }
        )
      }
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId
      }
    })

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Already following' },
        { status: 400 }
      )
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: follow.id,
        followingId: follow.followingId,
        createdAt: follow.createdAt.toISOString()
      },
      message: 'Successfully followed'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error following:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to follow' },
      { status: 500 }
    )
  }
}

// DELETE - Unfollow a user/company/topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const followerId = authResult.user.userId
    const followingId = params.id

    // Find and delete follow relationship
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId
      }
    })

    if (!follow) {
      return NextResponse.json(
        { success: false, error: 'Not following this user' },
        { status: 404 }
      )
    }

    await prisma.follow.delete({
      where: { id: follow.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed'
    })
  } catch (error) {
    console.error('Error unfollowing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unfollow' },
      { status: 500 }
    )
  }
}
