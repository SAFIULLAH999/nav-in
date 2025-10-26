import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

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

    const subscription = await prisma.premiumSubscription.findUnique({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}