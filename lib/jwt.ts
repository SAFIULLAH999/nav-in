import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    {
      expiresIn: '30d'
    }
  )
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret') as { userId: string }
  } catch (error) {
    return null
  }
}

/**
 * Extract token from request headers
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Extract token from cookies
 */
export function extractTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get('accessToken')?.value || null
}

/**
 * Middleware to verify JWT and add user to request
 */
export async function authenticateRequest(request: NextRequest): Promise<{ user: JWTPayload } | { error: string }> {
  const token = extractTokenFromHeader(request) || extractTokenFromCookie(request)

  if (!token) {
    return { error: 'No token provided' }
  }

  const payload = verifyAccessToken(token)

  if (!payload) {
    return { error: 'Invalid token' }
  }

  return { user: payload }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Role-based authorization middleware
 */
export function requireRoles(roles: string[]) {
  return async (request: NextRequest): Promise<{ user?: JWTPayload; error?: string }> => {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return { error: authResult.error }
    }

    if (!hasRole(authResult.user.role, roles)) {
      return { error: 'Insufficient permissions' }
    }

    return { user: authResult.user }
  }
}

/**
 * Common role constants
 */
export const ROLES = {
  USER: 'USER',
  RECRUITER: 'RECRUITER',
  ADMIN: 'ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]
