'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface NotificationPreferences {
  email: {
    jobRecommendations: boolean
    networkUpdates: boolean
    messages: boolean
    applicationStatus: boolean
    newsletters: boolean
  }
  push: {
    messages: boolean
    connectionRequests: boolean
    jobMatches: boolean
    applicationUpdates: boolean
  }
  frequency: {
    dailyDigest: boolean
    weeklyDigest: boolean
    instant: boolean
  }
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      jobRecommendations: true,
      networkUpdates: true,
      messages: true,
      applicationStatus: true,
      newsletters: false
    },
    push: {
      messages: true,
      connectionRequests: true,
      jobMatches: true,
      applicationUpdates: true
    },
    frequency: {
      dailyDigest: true,
      weeklyDigest: false,
      instant: true
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Fetch user's notification preferences
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      // const response = await fetch('/api/notifications/preferences')
      // const data = await response.json()
      // setPreferences(data.preferences)
      
      // Mock data for demo
      const mockPreferences = {
        email: {
          jobRecommendations: true,
          networkUpdates: true,
          messages: true,
          applicationStatus: true,
          newsletters: false
        },
        push: {
          messages: true,
          connectionRequests: true,
          jobMatches: true,
          applicationUpdates: true
        },
        frequency: {
          dailyDigest: true,
          weeklyDigest: false,
          instant: true
        }
      }
      setPreferences(mockPreferences)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Failed to load notification preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (category: keyof NotificationPreferences, 
                       preference: keyof NotificationPreferences[keyof NotificationPreferences]) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [preference]: !prev[category][preference]
      }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      // In a real app, this would save to your API
      // const response = await fetch('/api/notifications/preferences', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ preferences })
      // })
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Notification preferences saved successfully!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-secondary rounded w-1/3"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-secondary rounded w-full"></div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-soft border border-border overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-semibold text-text">Notification Preferences</h3>
        <p className="text-text-muted text-sm mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Email Preferences */}
        <div>
          <h4 className="text-lg font-medium text-text mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Job Recommendations</p>
                <p className="text-sm text-text-muted">
                  Get personalized job recommendations based on your profile
                </p>
              </div>
              <Switch
                checked={preferences.email.jobRecommendations}
                onCheckedChange={() => handleToggle('email', 'jobRecommendations')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Network Updates</p>
                <p className="text-sm text-text-muted">
                  Notifications about your connections' activity
                </p>
              </div>
              <Switch
                checked={preferences.email.networkUpdates}
                onCheckedChange={() => handleToggle('email', 'networkUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Messages</p>
                <p className="text-sm text-text-muted">
                  Email notifications for new messages
                </p>
              </div>
              <Switch
                checked={preferences.email.messages}
                onCheckedChange={() => handleToggle('email', 'messages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Application Status Updates</p>
                <p className="text-sm text-text-muted">
                  Updates on your job applications
                </p>
              </div>
              <Switch
                checked={preferences.email.applicationStatus}
                onCheckedChange={() => handleToggle('email', 'applicationStatus')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Newsletters & Tips</p>
                <p className="text-sm text-text-muted">
                  Career advice and platform updates
                </p>
              </div>
              <Switch
                checked={preferences.email.newsletters}
                onCheckedChange={() => handleToggle('email', 'newsletters')}
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <h4 className="text-lg font-medium text-text mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Messages</p>
                <p className="text-sm text-text-muted">
                  Instant push notifications for new messages
                </p>
              </div>
              <Switch
                checked={preferences.push.messages}
                onCheckedChange={() => handleToggle('push', 'messages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Connection Requests</p>
                <p className="text-sm text-text-muted">
                  Notifications for new connection requests
                </p>
              </div>
              <Switch
                checked={preferences.push.connectionRequests}
                onCheckedChange={() => handleToggle('push', 'connectionRequests')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Job Matches</p>
                <p className="text-sm text-text-muted">
                  Instant alerts for high-match job opportunities
                </p>
              </div>
              <Switch
                checked={preferences.push.jobMatches}
                onCheckedChange={() => handleToggle('push', 'jobMatches')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Application Updates</p>
                <p className="text-sm text-text-muted">
                  Real-time updates on your job applications
                </p>
              </div>
              <Switch
                checked={preferences.push.applicationUpdates}
                onCheckedChange={() => handleToggle('push', 'applicationUpdates')}
              />
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div>
          <h4 className="text-lg font-medium text-text mb-4">Notification Frequency</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Daily Digest</p>
                <p className="text-sm text-text-muted">
                  Receive a daily summary of notifications
                </p>
              </div>
              <Switch
                checked={preferences.frequency.dailyDigest}
                onCheckedChange={() => handleToggle('frequency', 'dailyDigest')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Weekly Digest</p>
                <p className="text-sm text-text-muted">
                  Receive a weekly summary of notifications
                </p>
              </div>
              <Switch
                checked={preferences.frequency.weeklyDigest}
                onCheckedChange={() => handleToggle('frequency', 'weeklyDigest')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Instant Notifications</p>
                <p className="text-sm text-text-muted">
                  Get notifications as they happen
                </p>
              </div>
              <Switch
                checked={preferences.frequency.instant}
                onCheckedChange={() => handleToggle('frequency', 'instant')}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}