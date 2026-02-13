import { NextRequest, NextResponse } from 'next/server'
import { AuthTimeoutManager, AuthUtils } from '@/lib/auth-timeout'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await AuthTimeoutManager.verifySession(token)

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const status = AuthTimeoutManager.getSessionStatus(token)
    const activeSessions = AuthTimeoutManager.getActiveSessions(session.userId)

    return NextResponse.json({
      success: true,
      data: {
        session: {
          userId: session.userId,
          email: session.email,
          username: session.username,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          sessionId: session.sessionId,
          isTwoFactorVerified: session.isTwoFactorVerified,
          permissions: session.permissions
        },
        status,
        activeSessions: activeSessions.map(s => ({
          sessionId: s.sessionId,
          loginTime: s.loginTime,
          lastActivity: s.lastActivity,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          isCurrent: s.sessionId === session.sessionId
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching session info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, token } = body

    if (!action || !token) {
      return NextResponse.json({ error: 'Action and token are required' }, { status: 400 })
    }

    const session = await AuthTimeoutManager.verifySession(token)

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    let result = null

    switch (action) {
      case 'refresh':
        const newToken = await AuthTimeoutManager.refreshSession(token)
        if (!newToken) {
          return NextResponse.json({ error: 'Failed to refresh session' }, { status: 400 })
        }
        
        result = {
          token: newToken,
          message: 'Session refreshed successfully'
        }
        break

      case 'update_activity':
        await AuthTimeoutManager.updateSessionActivity(token)
        result = {
          message: 'Session activity updated'
        }
        break

      case 'logout':
        await AuthTimeoutManager.logoutSession(token)
        result = {
          message: 'Session logged out successfully'
        }
        break

      case 'logout_all':
        await AuthTimeoutManager.logoutAllSessions(session.userId)
        result = {
          message: 'All sessions logged out successfully'
        }
        break

      case 'check_status':
        const status = AuthTimeoutManager.getSessionStatus(token)
        result = {
          status,
          timeRemaining: AuthUtils.formatTimeRemaining(Math.floor(status.timeRemaining / 1000))
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error processing session action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, twoFactorVerified } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const session = await AuthTimeoutManager.verifySession(token)

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    await AuthTimeoutManager.updateTwoFactorStatus(token, twoFactorVerified)

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication status updated successfully'
    })
  } catch (error) {
    console.error('Error updating two-factor status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await AuthTimeoutManager.verifySession(token)

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Logout specific session
      const sessions = AuthTimeoutManager.getActiveSessions(session.userId)
      const targetSession = sessions.find(s => s.sessionId === sessionId)

      if (!targetSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      if (targetSession.sessionId === session.sessionId) {
        return NextResponse.json({ error: 'Cannot logout current session via this endpoint' }, { status: 400 })
      }

      // Find and remove the session
      for (const [id, s] of AuthTimeoutManager['activeSessions'].entries()) {
        if (s.sessionId === sessionId) {
          AuthTimeoutManager['activeSessions'].delete(id)
          break
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Session logged out successfully'
      })
    } else {
      // Logout current session
      await AuthTimeoutManager.logoutSession(token)

      return NextResponse.json({
        success: true,
        message: 'Current session logged out successfully'
      })
    }
  } catch (error) {
    console.error('Error logging out session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}