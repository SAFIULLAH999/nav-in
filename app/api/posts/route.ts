import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  image: z.string().optional(),
  video: z.string().optional(),
})

// GET /api/posts - Fetch posts for feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get posts from connections and own posts
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: session.user.id, status: 'ACCEPTED' },
          { receiverId: session.user.id, status: 'ACCEPTED' }
        ]
      },
      select: { senderId: true, receiverId: true }
    })

    const connectionIds = connections.flatMap((conn: { senderId: string; receiverId: string }) =>
      conn.senderId === session.user.id ? [conn.receiverId] : [conn.senderId]
    )

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { authorId: session.user.id },
          { authorId: { in: connectionIds } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            title: true,
            company: true,
          }
        },
        likes: {
          where: { userId: session.user.id },
          select: { id: true }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    })

    const hasMore = posts.length === limit

    return NextResponse.json({
      posts: posts.map((post: any) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined // Remove detailed likes array
      })),
      hasMore
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, image, video } = createPostSchema.parse(body)

    const post = await prisma.post.create({
      data: {
        content,
        image,
        video,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            title: true,
            company: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
