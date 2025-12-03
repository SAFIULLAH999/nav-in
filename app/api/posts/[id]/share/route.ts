import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// POST - Share a post
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

    // Create a share record
    const share = await prisma.share.create({
      data: {
        userId: userId,
        postId: postId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        id: share.id,
        postId: postId,
        userId: userId,
        timestamp: share.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error sharing post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to share post' },
      { status: 500 }
    )
  }
}
