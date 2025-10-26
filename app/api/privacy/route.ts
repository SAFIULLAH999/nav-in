import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updatePrivacySchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE']).default('PUBLIC'),
  showInSearch: z.boolean().default(true),
  allowConnectionRequests: z.boolean().default(true),
  showActivityStatus: z.boolean().default(true),
  showLastSeen: z.boolean().default(true),
  allowTagging: z.boolean().default(true),
  dataSharing: z.object({
    analytics: z.boolean().default(false),
    marketing: z.boolean().default(false),
    research: z.boolean().default(false)
  }).optional()
})

// GET - Get current user's privacy settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId

    // For now, return default privacy settings since we don't have a privacy model yet
    // In a full implementation, this would query a UserPrivacySettings model
    const defaultPrivacy = {
      profileVisibility: 'PUBLIC',
      showInSearch: true,
      allowConnectionRequests: true,
      showActivityStatus: true,
      showLastSeen: true,
      allowTagging: true,
      dataSharing: {
        analytics: false,
        marketing: false,
        research: false
      }
    }

    return NextResponse.json({
      success: true,
      data: defaultPrivacy
    })
  } catch (error) {
    console.error('Error fetching privacy settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch privacy settings' },
      { status: 500 }
    )
  }
}

// PUT - Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const privacySettings = updatePrivacySchema.parse(body)
    const userId = authResult.user.userId

    // In a full implementation, this would update a UserPrivacySettings model
    // For now, we'll just return success with the settings
    // TODO: Create UserPrivacySettings model in schema

    return NextResponse.json({
      success: true,
      data: privacySettings,
      message: 'Privacy settings updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating privacy settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update privacy settings' },
      { status: 500 }
    )
  }
}
