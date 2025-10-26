import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { validateData, profileUpdateSchema, ProfileUpdateInput } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        experiences: true,
        education: true,
        _count: {
          select: {
            sentConnections: {
              where: { status: 'ACCEPTED' }
            },
            receivedConnections: {
              where: { status: 'ACCEPTED' }
            }
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
      email: user.email,
      username: user.username,
      bio: user.bio,
      title: user.title,
      company: user.company,
      location: user.location,
      website: user.website,
      skills: user.skills,
      avatar: user.avatar,
      summary: user.summary,
      socialLinks: user.socialLinks,
      connections: user._count.sentConnections + user._count.receivedConnections,
      experiences: user.experiences,
      education: user.education,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateData(profileUpdateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      )
    }

    const updateData: ProfileUpdateInput = validation.data

    // Check if username is already taken (if being updated)
    if (updateData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: updateData.username }
      })

      if (existingUser && existingUser.id !== payload.userId) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 409 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: updateData.name,
        username: updateData.username,
        bio: updateData.bio,
        title: updateData.title,
        company: updateData.company,
        location: updateData.location,
        website: updateData.website,
        skills: updateData.skills ? JSON.stringify(updateData.skills) : null,
        avatar: updateData.avatar,
        summary: updateData.summary,
        socialLinks: updateData.socialLinks,
        updatedAt: new Date()
      },
      include: {
        experiences: true,
        education: true
      }
    })

    const profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      bio: updatedUser.bio,
      title: updatedUser.title,
      company: updatedUser.company,
      location: updatedUser.location,
      website: updatedUser.website,
      skills: updatedUser.skills,
      avatar: updatedUser.avatar,
      summary: updatedUser.summary,
      socialLinks: updatedUser.socialLinks,
      updatedAt: updatedUser.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
