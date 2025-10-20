'use client'

import React, { useState } from 'react'
import { Shield, ShieldCheck, ShieldX, Copy, Eye, EyeOff, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TwoFactorAuthProps {
  user: {
    id: string
    twoFactorEnabled?: boolean
  }
}

export function TwoFactorAuth({ user }: TwoFactorAuthProps) {
  const [isEnabled, setIsEnabled] = useState(user.twoFactorEnabled || false)
  const [showSetup, setShowSetup] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [token, setToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setup2FA = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.data.qrCodeUrl)
        setSecret(data.data.secret)
        setBackupCodes(data.data.backupCodes)
        setShowSetup(true)
      } else {
        setError(data.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setError('Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token?.trim(),
          backupCode: backupCode.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsEnabled(true)
        setShowSetup(false)
        setToken('')
        setBackupCode('')
        alert('2FA has been successfully enabled!')
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify 2FA')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setIsEnabled(false)
        alert('2FA has been disabled')
      } else {
        setError(data.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      setError('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border p-6">
      <div className="flex items-center space-x-3 mb-4">
        {isEnabled ? (
          <ShieldCheck className="w-6 h-6 text-green-500" />
        ) : (
          <Shield className="w-6 h-6 text-text-muted" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-text">Two-Factor Authentication</h3>
          <p className="text-sm text-text-muted">
            {isEnabled
              ? 'Your account is protected with 2FA'
              : 'Add an extra layer of security to your account'
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        {!isEnabled && !showSetup && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={setup2FA}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Smartphone className="w-4 h-4" />
            <span>{loading ? 'Setting up...' : 'Enable 2FA'}</span>
          </motion.button>
        )}

        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Step 1: Scan QR Code</h4>
              <p className="text-sm text-blue-700 mb-3">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              {qrCode && (
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="w-32 h-32"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-700">Manual entry code:</span>
                <code className="bg-white px-2 py-1 rounded text-blue-900 font-mono">
                  {secret}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(secret)}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Copy className="w-3 h-3 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Step 2: Enter Verification Code</h4>
              <p className="text-sm text-green-700 mb-3">
                Enter the 6-digit code from your authenticator app
              </p>

              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg font-mono"
                  maxLength={6}
                />
                <button
                  onClick={verify2FA}
                  disabled={loading || token.length !== 6}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              <div className="text-sm text-green-700">
                <p className="mb-2">Or use a backup code:</p>
                <input
                  type="text"
                  placeholder="Enter backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Step 3: Save Backup Codes</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>

              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="flex items-center space-x-2 text-yellow-800 hover:text-yellow-900"
              >
                {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showBackupCodes ? 'Hide' : 'Show'} Backup Codes</span>
              </button>

              {showBackupCodes && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="bg-yellow-100 px-2 py-1 rounded text-yellow-900 font-mono text-sm">
                      {code}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2 text-green-600">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">2FA is enabled</span>
            </div>
            <button
              onClick={disable2FA}
              disabled={loading}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}