'use client'

import { useState } from 'react'
import { ArrowLeft, Save, User, Settings as SettingsIcon, Bell, Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: 'John Doe',
    title: 'Senior Software Engineer',
    company: 'NavIN Corp',
    location: 'San Francisco, CA',
    email: 'john.doe@navin.com',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
    website: 'https://johndoe.dev',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
    experience: [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'NavIN Corp',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Lead development of key platform features, mentor junior developers, and architect scalable solutions.'
      }
    ],
    education: [
      {
        id: '1',
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        startDate: '2016-09',
        endDate: '2020-05',
        description: 'GPA: 3.8/4.0 • Relevant Coursework: Data Structures, Algorithms, Software Engineering'
      }
    ]
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings: ' + result.error)
      }
    } catch (error) {
      alert('Failed to save settings: ' + error)
    }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'privacy', label: 'Privacy', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/feed" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-lg border border-border p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface rounded-lg border border-border p-6"
          >
            {activeTab === 'account' && <AccountSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'privacy' && <PrivacySettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'notifications' && <NotificationSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'security' && <SecuritySettings formData={formData} setFormData={setFormData} />}

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <button
                onClick={handleSave}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function AccountSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Account Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-muted mt-1">This email is used for login and notifications</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Account Type</label>
          <div className="p-3 bg-secondary/20 rounded-lg">
            <span className="font-medium">Personal Account</span>
            <p className="text-xs text-text-muted mt-1">For individual professionals and job seekers</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Member Since</label>
          <div className="p-3 bg-secondary/20 rounded-lg">
            <span className="font-medium">January 2024</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button className="text-red-500 hover:text-red-700 font-medium">
          Deactivate Account
        </button>
        <p className="text-xs text-text-muted mt-1">
          Temporarily disable your account. You can reactivate it anytime.
        </p>
      </div>
    </div>
  )
}

function PrivacySettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Privacy Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Profile Visibility</h3>
            <p className="text-sm text-text-muted">Control who can see your profile and posts</p>
          </div>
          <select className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Public</option>
            <option>Connections Only</option>
            <option>Private</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Connection Requests</h3>
            <p className="text-sm text-text-muted">Who can send you connection requests</p>
          </div>
          <select className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Everyone</option>
            <option>2nd Degree Connections</option>
            <option>Nobody</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-text-muted">Receive email updates about your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Activity Status</h3>
            <p className="text-sm text-text-muted">Show when you're active on NavIN</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Notification Preferences</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-text-muted">Receive notifications in your browser</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Connection Requests</h3>
            <p className="text-sm text-text-muted">Get notified when someone wants to connect</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Messages</h3>
            <p className="text-sm text-text-muted">Get notified about new messages</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Job Alerts</h3>
            <p className="text-sm text-text-muted">Get notified about relevant job opportunities</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Weekly Digest</h3>
            <p className="text-sm text-text-muted">Weekly summary of activity and updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Security Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Confirm new password"
          />
        </div>

        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Update Password
        </button>
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <p className="font-medium">Enable 2FA</p>
            <p className="text-sm text-text-muted">Add an extra layer of security to your account</p>
          </div>
          <button className="bg-secondary text-text px-4 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            Enable 2FA
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="font-medium mb-4 text-red-600">Danger Zone</h3>
        <button className="text-red-500 hover:text-red-700 font-medium border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
          Delete Account
        </button>
        <p className="text-xs text-text-muted mt-2">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
      </div>
    </div>
  )
}

