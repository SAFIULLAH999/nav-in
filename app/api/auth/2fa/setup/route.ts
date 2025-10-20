import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import * as crypto from 'crypto'
import * as speakeasy from 'speakeasy'

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

    const userId = authResult.user.userId

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: 'NavIN',
      issuer: 'NavIN Platform'
    })

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomInt(100000, 999999).toString()
    )

    // Encrypt secret and backup codes before storing
    const encryptedSecret = encrypt(secret.base32)
    const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes))

    // Update user with 2FA data
    await (prisma.user.update as any)({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        twoFactorEnabled: false // Will be enabled after verification
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: secret.otpauth_url!,
        secret: secret.base32,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32
      },
      message: '2FA setup initiated. Please verify with your authenticator app.'
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
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