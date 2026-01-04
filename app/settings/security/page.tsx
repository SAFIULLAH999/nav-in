'use client'

import React from 'react'
import { TwoFactorAuth } from '@/components/TwoFactorAuth'
import { Shield, Lock, Eye, Bell } from 'lucide-react'

export default function SecuritySettingsPage() {
  // Mock user data - in real app, this would come from authentication context
  const user = {
    id: 'current-user-id',
    twoFactorEnabled: false
  }

  return (
      <div className="min-h-screen bg-background">

      <div className="max-w-4xl mx-auto pt-6 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Security Settings</h1>
          <p className="text-text-muted">Manage your account security and privacy settings</p>
        </div>

        {/* Security Sections */}
        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <TwoFactorAuth user={user} />

          {/* Password & Authentication */}
          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-text-muted" />
              <div>
                <h3 className="text-lg font-semibold text-text">Password</h3>
                <p className="text-sm text-text-muted">
                  Last updated 30 days ago
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-2">
                  Keep your account secure with a strong password
                </p>
                <p className="text-xs text-text-muted">
                  Password must be at least 8 characters long
                </p>
              </div>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                Change Password
              </button>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-6 h-6 text-text-muted" />
              <div>
                <h3 className="text-lg font-semibold text-text">Active Sessions</h3>
                <p className="text-sm text-text-muted">
                  Manage your active login sessions
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="font-medium text-text">Current Session</p>
                  <p className="text-xs text-text-muted">Chrome on Windows • Active now</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Current
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="font-medium text-text">Mobile App</p>
                  <p className="text-xs text-text-muted">iPhone • 2 hours ago</p>
                </div>
                <button className="text-xs text-red-600 hover:text-red-700">
                  Revoke
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-text-muted" />
              <div>
                <h3 className="text-lg font-semibold text-text">Privacy & Notifications</h3>
                <p className="text-sm text-text-muted">
                  Control who can see your activity and how you get notified
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Profile Visibility</p>
                  <p className="text-xs text-text-muted">Who can see your full profile</p>
                </div>
                <select className="px-3 py-1 border border-border rounded-lg bg-background text-sm">
                  <option>Everyone</option>
                  <option>Connections only</option>
                  <option>Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Connection Requests</p>
                  <p className="text-xs text-text-muted">Who can send you connection requests</p>
                </div>
                <select className="px-3 py-1 border border-border rounded-lg bg-background text-sm">
                  <option>Everyone</option>
                  <option>2nd degree connections</option>
                  <option>3rd degree connections</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Email Notifications</p>
                  <p className="text-xs text-text-muted">How often you receive email updates</p>
                </div>
                <select className="px-3 py-1 border border-border rounded-lg bg-background text-sm">
                  <option>Real-time</option>
                  <option>Daily digest</option>
                  <option>Weekly digest</option>
                  <option>Never</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
