import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import * as crypto from 'crypto'
import * as speakeasy from 'speakeasy'
import { z } from 'zod'

const verify2FASchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
  backupCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, backupCode } = verify2FASchema.parse(body)

    const userId = authResult.user.userId

    // Get user with 2FA data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        // Note: 2FA fields will be available after Prisma client regeneration
      }
    }) as any

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: '2FA not set up' },
        { status: 400 }
      )
    }

    // Decrypt the secret
    const secret = decrypt(user.twoFactorSecret)

    // Verify TOTP token
    let isValidToken = false
    if (token && !backupCode) {
      isValidToken = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 30 seconds clock drift
      })
    }

    // Verify backup code if TOTP failed
    let isValidBackupCode = false
    if (!isValidToken && backupCode && user.backupCodes) {
      const backupCodes = JSON.parse(decrypt(user.backupCodes))

      if (backupCodes.includes(backupCode)) {
        isValidBackupCode = true
        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter((code: string) => code !== backupCode)
        const encryptedBackupCodes = encrypt(JSON.stringify(updatedBackupCodes))

        await (prisma.user.update as any)({
          where: { id: userId },
          data: { backupCodes: encryptedBackupCodes }
        })
      }
    }

    if (!isValidToken && !isValidBackupCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid 2FA token or backup code' },
        { status: 400 }
      )
    }

    // Enable 2FA if not already enabled
    if (!user.twoFactorEnabled) {
      await (prisma.user.update as any)({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        twoFactorEnabled: true
      },
      message: '2FA verification successful'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error verifying 2FA:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}

// Simple encryption function (in production, use proper key management)
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return iv.toString('hex') + ':' + encrypted
}

// Simple decryption function (in production, use proper key management)
function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-cbc'
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

  const [ivHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}