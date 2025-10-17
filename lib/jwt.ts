import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  type: 'access' | 'refresh'
}

export class JWTManager {
  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' } as object,
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    )
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' } as object,
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    )
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload
      return decoded.type === 'access' ? decoded : null
    } catch {
      return null
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
      return decoded.type === 'refresh' ? decoded : null
    } catch {
      return null
    }
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token, 12)

    await prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = await bcrypt.hash(token, 12)

    await prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { isRevoked: true }
    })
  }

  static async isRefreshTokenValid(token: string): Promise<boolean> {
    const hashedToken = await bcrypt.hash(token, 12)

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken }
    })

    return storedToken ? !storedToken.isRevoked && storedToken.expiresAt > new Date() : false
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    })
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
