import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/jwt'
import { checkPremiumStatus } from '@/lib/subscription'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    const premiumStatus = await checkPremiumStatus(userId)

    return NextResponse.json({
      success: true,
      ...premiumStatus
    })
  } catch (error) {
    console.error('Error checking premium status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check premium status' },
      { status: 500 }
    )
  }
}
