'use client'

import { useState } from 'react'
import { ProfileHeader } from '@/components/ProfileHeader'
import { ProfileTabs } from '@/components/ProfileTabs'
import { currentUser } from '@/data/mockData'
import { Settings, Edit3, Plus, Award, MapPin, Link as LinkIcon, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [isOwnProfile, setIsOwnProfile] = useState(true) // In real app, check if current user owns this profile

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header with Edit Options */}
      <div className="relative">
        <ProfileHeader user={currentUser} isOwnProfile={isOwnProfile} />
        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <Link
              href="/settings"
              className="bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors flex items-center space-x-2 shadow-soft"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2 shadow-soft">
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      {isOwnProfile && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3">
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Experience</span>
            </button>
            <button className="bg-secondary text-text px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center space-x-2 border border-border">
              <Award className="w-4 h-4" />
              <span>Add Education</span>
            </button>
            <button className="bg-secondary text-text px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center space-x-2 border border-border">
              <Plus className="w-4 h-4" />
              <span>Add Skills</span>
            </button>
            <button className="bg-secondary text-text px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center space-x-2 border border-border">
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Profile Tabs */}
      <ProfileTabs user={currentUser} isOwnProfile={isOwnProfile} />
    </div>
  )
}
