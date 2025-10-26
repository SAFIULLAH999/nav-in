import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// POST - Record a profile view
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const viewerId = authResult.user.userId
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Check if viewer is not the profile owner
    if (viewerId === profileId) {
      return NextResponse.json(
        { success: false, error: 'Cannot view own profile' },
        { status: 400 }
      )
    }

    // Record the view
    await prisma.profileView.upsert({
      where: {
        viewerId_profileId: {
          viewerId,
          profileId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        viewerId,
        profileId
      }
    })

    // Update profile analytics
    await prisma.profileAnalytics.upsert({
      where: { userId: profileId },
      update: {
        profileViews: {
          increment: 1
        }
      },
      create: {
        userId: profileId,
        profileViews: 1
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile view recorded'
    })
  } catch (error) {
    console.error('Error recording profile view:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record profile view' },
      { status: 500 }
    )
  }
}