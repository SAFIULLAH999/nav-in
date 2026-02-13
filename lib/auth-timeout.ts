import { jwtVerify, SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface AuthSession {
  userId: string
  email: string
  username?: string
  lastActivity: number
  loginTime: number
  sessionId: string
  ipAddress?: string
  userAgent?: string
  isTwoFactorVerified?: boolean
  permissions: string[]
}

export class AuthTimeoutManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  private static readonly MAX_SESSIONS = 5 // Max concurrent sessions per user

  private static activeSessions = new Map<string, AuthSession>()

  static async createSession(
    userId: string,
    email: string,
    username?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = crypto.randomUUID()
    const now = Date.now()

    const session: AuthSession = {
      userId,
      email,
      username,
      lastActivity: now,
      loginTime: now,
      sessionId,
      ipAddress,
      userAgent,
      isTwoFactorVerified: false,
      permissions: ['READ_PROFILE', 'READ_POSTS', 'READ_CONNECTIONS']
    }

    // Clean up old sessions for this user
    this.cleanupOldSessions(userId)

    // Store session
    this.activeSessions.set(sessionId, session)

    // Create JWT
    const jwt = await new SignJWT({ userId, sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(JWT_SECRET)

    return jwt
  }

  static async verifySession(token: string): Promise<AuthSession | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const sessionId = payload.sessionId as string

      if (!sessionId) {
        return null
      }

      const session = this.activeSessions.get(sessionId)

      if (!session) {
        return null
      }

      // Check if session has timed out
      const now = Date.now()
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.activeSessions.delete(sessionId)
        return null
      }

      // Update last activity
      session.lastActivity = now

      return session
    } catch (error) {
      console.error('Session verification failed:', error)
      return null
    }
  }

  static async refreshSession(token: string): Promise<string | null> {
    try {
      const session = await this.verifySession(token)
      
      if (!session) {
        return null
      }

      // Create new JWT
      const jwt = await new SignJWT({ 
        userId: session.userId, 
        sessionId: session.sessionId 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(JWT_SECRET)

      return jwt
    } catch (error) {
      console.error('Session refresh failed:', error)
      return null
    }
  }

  static async updateSessionActivity(token: string): Promise<void> {
    const session = await this.verifySession(token)
    if (session) {
      session.lastActivity = Date.now()
    }
  }

  static async logoutSession(token: string): Promise<void> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const sessionId = payload.sessionId as string

      if (sessionId) {
        this.activeSessions.delete(sessionId)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  static async logoutAllSessions(userId: string): Promise<void> {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  static async updateTwoFactorStatus(token: string, verified: boolean): Promise<void> {
    const session = await this.verifySession(token)
    if (session) {
      session.isTwoFactorVerified = verified
      if (verified) {
        session.permissions.push('ACCESS_SENSITIVE_DATA')
      }
    }
  }

  static getSessionStatus(token: string): { isActive: boolean; timeRemaining: number; needsRefresh: boolean } {
    try {
      const session = this.activeSessions.get(token)
      
      if (!session) {
        return { isActive: false, timeRemaining: 0, needsRefresh: false }
      }

      const now = Date.now()
      const timeElapsed = now - session.lastActivity
      const timeRemaining = this.SESSION_TIMEOUT - timeElapsed
      const needsRefresh = timeRemaining < this.REFRESH_THRESHOLD

      return {
        isActive: timeRemaining > 0,
        timeRemaining: Math.max(0, timeRemaining),
        needsRefresh
      }
    } catch (error) {
      return { isActive: false, timeRemaining: 0, needsRefresh: false }
    }
  }

  static getActiveSessions(userId: string): AuthSession[] {
    const sessions: AuthSession[] = []
    
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId) {
        sessions.push(session)
      }
    }

    return sessions
  }

  private static cleanupOldSessions(userId: string): void {
    const userSessions: { sessionId: string; loginTime: number }[] = []
    
    // Find all sessions for this user
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({ sessionId, loginTime: session.loginTime })
      }
    }

    // Sort by login time (oldest first)
    userSessions.sort((a, b) => a.loginTime - b.loginTime)

    // Remove oldest sessions if over the limit
    while (userSessions.length > this.MAX_SESSIONS) {
      const oldestSession = userSessions.shift()
      if (oldestSession) {
        this.activeSessions.delete(oldestSession.sessionId)
      }
    }
  }
}

// Middleware for API routes
export function withAuthTimeout(handler: (req: NextRequest, session: AuthSession) => Promise<NextResponse>) {
  return async function authHandler(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await AuthTimeoutManager.verifySession(token)

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Check if session needs refresh
    const status = AuthTimeoutManager.getSessionStatus(token)
    const response = await handler(req, session)

    if (status.needsRefresh) {
      response.headers.set('X-Session-Needs-Refresh', 'true')
      response.headers.set('X-Session-Time-Remaining', status.timeRemaining.toString())
    }

    return response
  }
}

// Utility functions for client-side
export const AuthUtils = {
  // Check if token is about to expire
  isTokenExpiringSoon: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = payload.exp - now
      return timeUntilExpiry < 300 // 5 minutes
    } catch {
      return true
    }
  },

  // Get time until expiry in seconds
  getTokenTimeUntilExpiry: (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      return Math.max(0, payload.exp - now)
    } catch {
      return 0
    }
  },

  // Format time remaining for display
  formatTimeRemaining: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}