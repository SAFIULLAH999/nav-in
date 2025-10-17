import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const likeSchema = z.object({
  action: z.enum(['like', 'unlike'])
})

// POST - Like/Unlike a post
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
    const { action } = likeSchema.parse(body)

    const postId = params.id
    const userId = authResult.user.userId

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (action === 'like') {
      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      })

      if (existingLike) {
        return NextResponse.json(
          { success: false, error: 'Post already liked' },
          { status: 400 }
        )
      }

      // Create like
      await prisma.like.create({
        data: {
          userId: userId,
          postId: postId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Post liked successfully',
        action: 'liked'
      })
    } else {
      // Unlike post
      const deletedLike = await prisma.like.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      })

      if (!deletedLike) {
        return NextResponse.json(
          { success: false, error: 'Like not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Post unliked successfully',
        action: 'unliked'
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error toggling like:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
