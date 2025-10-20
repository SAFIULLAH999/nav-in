'use client'

import { useState } from 'react'
import { useDarkMode } from '@/components/DarkModeProvider'
import { ArrowLeft, Save, User, Settings as SettingsIcon, Bell, Shield, Lock, Eye, EyeOff, Palette, Sun, Moon } from 'lucide-react'
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
    { id: 'appearance', label: 'Appearance', icon: Palette },
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
          <div className="bg-gradient-to-br from-surface via-surface/80 to-surface/60 rounded-xl border border-border/50 p-6 shadow-lg">
            <nav className="space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg'
                        : 'text-text-muted hover:bg-secondary/50 hover:text-text'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-gradient-to-br from-surface via-surface/80 to-surface/60 rounded-xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {activeTab === 'account' && <AccountSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'privacy' && <PrivacySettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'notifications' && <NotificationSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'security' && <SecuritySettings formData={formData} setFormData={setFormData} />}

            <div className="flex justify-end mt-6 pt-6 border-t border-border/50">
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary to-primary/90 text-white px-8 py-3 rounded-xl font-medium hover:from-primary/90 hover:to-primary transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </motion.button>
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

function AppearanceSettings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Appearance Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-yellow-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-text-muted">Toggle between light and dark themes</p>
            </div>
          </div>
          <motion.button
            onClick={toggleDarkMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gradient-to-r from-gray-300 to-gray-400'
            } shadow-lg`}
          >
            <motion.span
              animate={{ x: isDarkMode ? 20 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="inline-block h-5 w-5 rounded-full bg-white shadow-md border border-gray-200"
            />
          </motion.button>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Theme Preference</h3>
            <p className="text-sm text-text-muted">Choose your preferred color scheme</p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              onClick={() => {/* Set light mode */}}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                !isDarkMode
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg'
                  : 'bg-gradient-to-r from-secondary to-secondary/80 text-text-muted hover:text-text hover:shadow-md'
              }`}
            >
              Light
            </motion.button>
            <motion.button
              onClick={() => {/* Set dark mode */}}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg'
                  : 'bg-gradient-to-r from-secondary to-secondary/80 text-text-muted hover:text-text hover:shadow-md'
              }`}
            >
              Dark
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-6 border border-border/50 rounded-xl bg-gradient-to-br from-card/50 to-card/30 shadow-lg"
        >
          <h3 className="font-medium mb-4">Preview</h3>
          <div className="space-y-4">
            <motion.div
              animate={{ opacity: isDarkMode ? 0.8 : 1 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 border-gray-700/50 shadow-inner'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100/80 border-gray-200/60 shadow-sm'
              }`}
            >
              <div className={`h-3 w-3/4 rounded-full mb-3 ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-200'}`}></div>
              <div className={`h-2 w-1/2 rounded-full ${isDarkMode ? 'bg-gray-600/60' : 'bg-gray-300'}`}></div>
            </motion.div>
            <motion.div
              animate={{ opacity: isDarkMode ? 0.9 : 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/40 border-gray-700/40'
                  : 'bg-gradient-to-br from-white to-gray-50/80 border-gray-200/50'
              }`}
            >
              <div className={`h-2 w-full rounded-full mb-2 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}></div>
              <div className={`h-2 w-2/3 rounded-full ${isDarkMode ? 'bg-gray-600/50' : 'bg-gray-200'}`}></div>
            </motion.div>
          </div>
        </motion.div>
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

