import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch public user profile by username
export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        website: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            sentConnections: {
              where: { status: 'ACCEPTED' }
            },
            receivedConnections: {
              where: { status: 'ACCEPTED' }
            },
            posts: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const profile = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      title: user.title,
      company: user.company,
      location: user.location,
      website: user.website,
      avatar: user.avatar,
      createdAt: user.createdAt,
      connections: user._count.sentConnections + user._count.receivedConnections,
      posts: user._count.posts
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Public profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}