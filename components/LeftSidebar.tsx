'use client'

import { useState, useEffect } from 'react'
import { Users, Briefcase, MessageCircle, Settings, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUser, useAuth } from '@clerk/nextjs'
import { UserPresenceIndicator } from '@/components/UserPresenceIndicator'

export function LeftSidebar() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const token = await getToken()

      if (!token || !user) return

      const profileResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile(profileData.data)
      }

      const connectionsResponse = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        setConnectionsCount(connectionsData.data?.length || 0)
      }

      if (token) {
        const messagesResponse = await fetch('/api/messages?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          if (messagesData.success && Array.isArray(messagesData.data)) {
            const unreadTotal = messagesData.data.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0)
            setMessageCount(unreadTotal)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getUserDisplayName = () => {
    return userProfile?.name || user?.fullName || 'User'
  }

  const getUserTitle = () => {
    return userProfile?.title || 'User'
  }

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="hidden lg:block w-64 xl:w-80 bg-surface border-r border-border p-6 space-y-6"
    >
      {/* User Profile Card */}
      <div className="bg-muted rounded-2xl border border-border p-6 shadow-md">
        {loading ? (
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-20 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded-2xl w-full"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-md">
                  {getUserInitials(getUserDisplayName())}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <UserPresenceIndicator userId={user?.id || ''} size="md" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-text truncate">{getUserDisplayName()}</h3>
                <p className="text-sm text-text-muted truncate">{getUserTitle()}</p>
              </div>
            </div>
            <div className="text-sm text-text-muted mb-4">
              {connectionsCount.toLocaleString()} connections
            </div>
            <Link href="/profile">
              <button className="w-full text-sm text-primary hover:bg-primary/10 py-3 px-4 rounded-2xl transition-all duration-300 font-medium border border-border hover:border-primary">
                View Profile
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <div className="space-y-3">
        <SidebarLink icon={Users} label="My Network" count={connectionsCount || undefined} href="/network" />
        <SidebarLink icon={Briefcase} label="Jobs" href="/jobs" />
        <SidebarLink icon={MessageCircle} label="Messages" count={messageCount || undefined} href="/messages" />
        <SidebarLink icon={Settings} label="Settings" href="/settings" />
      </div>

      {/* Recent Activity */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-base font-semibold text-text mb-4">Recent Activity</h4>
        <div className="space-y-3">
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-muted">
            # React Development
          </div>
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-muted">
            # Frontend Engineering
          </div>
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-muted">
            # Career Growth
          </div>
        </div>
        <button className="text-sm text-primary mt-3 hover:underline font-medium">
          Show more
        </button>
      </div>
    </motion.aside>
  )
}

function SidebarLink({ icon: Icon, label, count, href }: { icon: any, label: string, count?: string | number, href?: string }) {
  const content = (
    <div className="flex items-center justify-between p-3 hover:bg-muted rounded-2xl cursor-pointer transition-all duration-300 group w-full">
      <div className="flex items-center space-x-4">
        <Icon className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
        <span className="text-base font-medium text-text group-hover:text-primary transition-colors">{label}</span>
      </div>
      {count && (
        <span className="bg-primary text-white text-sm px-3 py-1 rounded-full font-medium">
          {count}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    )
  }

  return content
}
