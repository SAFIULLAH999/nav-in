'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Camera, MapPin, Link as LinkIcon, Calendar, Edit, Plus, MessageCircle, UserPlus, MoreHorizontal, Briefcase, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirebase } from '@/components/FirebaseProvider'
import { OpenToBadge } from '@/components/OpenToBadge'

export default function ProfilePage() {
  const { user } = useFirebase()
  const router = useRouter()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (result.success) {
          setProfileData(result.data)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Please sign in to view your profile</h2>
          <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-6 px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft border border-border overflow-hidden mb-8"
        >
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-primary to-secondary relative">
            <button className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors">
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-card overflow-hidden">
                {profileData?.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt={profileData.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profileData?.name || user.displayName)
                    ? (profileData?.name || user.displayName)!.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase()
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Details */}
            <div className="pt-20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text mb-2">
                    {profileData?.name || user.displayName || user.email?.split('@')[0] || 'User'}
                  </h1>
                  <p className="text-text-muted mb-2">{profileData?.title || 'Professional'}</p>

                  <div className="flex items-center space-x-4 text-sm text-text-muted mb-4">
                    {profileData?.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profileData.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-4 h-4" />
                      <span>nav-in.com/in/{profileData?.username || user.displayName?.toLowerCase().replace(/\s+/g, '') || user.email?.split('@')[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="font-semibold text-text">{profileData?.connections || 0}</span>
                      <span className="text-text-muted ml-1">Connections</span>
                    </div>
                    <div>
                      <span className="font-semibold text-text">23</span>
                      <span className="text-text-muted ml-1">Posts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button className="p-2 bg-secondary rounded-lg">
                    <MoreHorizontal className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Open To Status */}
              {profileData?.id && (
                <div className="mt-4">
                  <OpenToBadge userId={profileData.id} showMessage={true} />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* All sections visible like LinkedIn */}
        <div className="space-y-8">
          <PostsTab />
          <AboutTab />
          <ExperienceTab />
          <EducationTab />
          <ConnectionsTab />
        </div>
      </div>
    </div>
  )
}

function PostsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-text-muted">
        <p>No posts yet. Create your first post to get started!</p>
      </div>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-text mb-4">About</h3>
        <p className="text-text-muted">
          Add your professional summary and what makes you unique.
        </p>
        <button className="mt-4 text-primary hover:text-primary/80 text-sm font-medium">
          Add Summary
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-text mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-secondary text-text-muted rounded-full text-sm">
            Add your skills
          </span>
        </div>
        <button className="mt-4 text-primary hover:text-primary/80 text-sm font-medium">
          Add Skills
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-text mb-4">Contact Info</h3>
        <div className="space-y-3">
          <div className="text-text-muted">
            Add your website, LinkedIn, or other professional links
          </div>
        </div>
        <button className="mt-4 text-primary hover:text-primary/80 text-sm font-medium">
          Add Contact Info
        </button>
      </div>
    </div>
  )
}

function ExperienceTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Experience</h3>
        <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-secondary">
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border text-center">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">No experience added yet</h3>
        <p className="text-text-muted mb-4">
          Showcase your professional experience to help others understand your background.
        </p>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mx-auto">
          <Plus className="w-4 h-4" />
          <span>Add Your First Experience</span>
        </button>
      </div>
    </div>
  )
}

function EducationTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Education</h3>
        <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-secondary">
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border text-center">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">No education added yet</h3>
        <p className="text-text-muted mb-4">
          Add your educational background, degrees, and certifications.
        </p>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mx-auto">
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>
    </div>
  )
}

function ConnectionsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Connections (147)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Alice Johnson', title: 'UX Designer at DesignCo', mutual: 12 },
          { name: 'Bob Smith', title: 'Frontend Developer at WebCorp', mutual: 8 },
          { name: 'Carol Davis', title: 'Product Manager at StartupXYZ', mutual: 15 },
        ].map((connection, index) => (
          <div key={index} className="bg-card rounded-lg p-4 border border-border flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {connection.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-text">{connection.name}</h4>
              <p className="text-text-muted text-sm">{connection.title}</p>
              <p className="text-text-muted text-xs">{connection.mutual} mutual connections</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 bg-secondary rounded-lg">
                <MessageCircle className="w-4 h-4 text-text-muted" />
              </button>
              <button className="p-2 bg-secondary rounded-lg">
                <MoreHorizontal className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
