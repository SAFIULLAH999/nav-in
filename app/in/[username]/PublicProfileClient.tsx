'use client'

import React, { useState, useEffect } from 'react'

import { Camera, MapPin, Link as LinkIcon, Calendar, Edit, Plus, MessageCircle, UserPlus, MoreHorizontal, Share2, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirebase } from '@/components/FirebaseProvider'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  bio: string | null
  title: string | null
  company: string | null
  location: string | null
  website: string | null
  avatar: string | null
  createdAt: string
}

interface PublicProfileClientProps {
  initialUser: UserProfile
}

export default function PublicProfileClient({ initialUser }: PublicProfileClientProps) {
  const { user: currentUser } = useFirebase()
  const [profileUser, setProfileUser] = useState<UserProfile>(initialUser)
  const [copied, setCopied] = useState(false)

  const isOwnProfile = currentUser && currentUser.uid === profileUser.id

  // Record profile view when not own profile
  useEffect(() => {
    if (!isOwnProfile && currentUser) {
      const recordView = async () => {
        try {
          await fetch('/api/profile/view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileId: profileUser.id
            })
          })
        } catch (error) {
          console.error('Error recording profile view:', error)
        }
      }
      recordView()
    }
  }, [isOwnProfile, currentUser, profileUser.id])

  const handleConnect = async () => {
    try {
      // For testing purposes, use a demo user ID
      const demoUserId = 'demo-user-1' // Assuming this is the current user for testing
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: profileUser.id,
          connectionType: 'PROFESSIONAL',
          message: `I'd like to connect with you on NavIN`
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Connection request sent!')
      } else {
        toast.error(data.error || 'Failed to send connection request')
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('Failed to send connection request')
    }
  }

  const handleMessage = () => {
    // Navigate to messages page with the user
    window.location.href = `/messages?user=${profileUser.username}`
  }

  const handleShare = async () => {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://nav-in.com'}/in/${profileUser.username}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileUser.name || profileUser.username} - NavIN Profile`,
          text: `Check out ${profileUser.name || profileUser.username}'s professional profile on NavIN`,
          url: profileUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(profileUrl)
        setCopied(true)
        toast.success('Profile link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        toast.error('Failed to copy link')
      }
    }
  }

  // Add structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": profileUser.name || profileUser.username,
      "alternateName": profileUser.username,
      "description": profileUser.bio || `Professional profile of ${profileUser.name || profileUser.username}`,
      "image": profileUser.avatar,
      "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://nav-in.com'}/in/${profileUser.username}`,
      "sameAs": profileUser.website ? [profileUser.website] : [],
      "jobTitle": profileUser.title,
      "worksFor": profileUser.company ? {
        "@type": "Organization",
        "name": profileUser.company
      } : undefined,
      "address": profileUser.location ? {
        "@type": "PostalAddress",
        "addressLocality": profileUser.location
      } : undefined,
      "knowsAbout": undefined // Skills not available in current UserProfile interface
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "NavIN",
      "url": "https://nav-in.com"
    }
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
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
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-card">
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt={profileUser.name || 'Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profileUser.name
                    ? profileUser.name.charAt(0).toUpperCase()
                    : profileUser.username
                    ? profileUser.username.charAt(0).toUpperCase()
                    : 'U'
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="pt-20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text mb-2">
                    {profileUser.name || profileUser.username || 'User'}
                  </h1>
                  {profileUser.title && (
                    <p className="text-text-muted mb-2">{profileUser.title}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-text-muted mb-4">
                    {profileUser.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser.username && (
                      <div className="flex items-center space-x-1">
                        <LinkIcon className="w-4 h-4" />
                        <a
                          href={`${typeof window !== 'undefined' ? window.location.origin : 'nav-in.com'}/in/${profileUser.username}`}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {typeof window !== 'undefined' ? window.location.origin : 'nav-in.com'}/in/{profileUser.username}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="font-semibold text-text">147</span>
                      <span className="text-text-muted ml-1">Connections</span>
                    </div>
                    <div>
                      <span className="font-semibold text-text">23</span>
                      <span className="text-text-muted ml-1">Posts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Share button for all users */}
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </>
                    )}
                  </button>

                  {!isOwnProfile ? (
                    <>
                      <button
                        onClick={handleMessage}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                      <button
                        onClick={handleConnect}
                        className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Connect</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        <Edit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                      <button className="p-2 bg-secondary rounded-lg">
                        <MoreHorizontal className="w-5 h-5 text-text-muted" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* All sections visible like LinkedIn */}
        <div className="space-y-8">
          <PostsTab />
          <AboutTab user={profileUser} />
          <ExperienceTab />
          <EducationTab />
          <ConnectionsTab />
        </div>
        </div>
      </div>
    </>
  )
}

function PostsTab() {
  return (
    <div className="space-y-6">
      {/* Sample posts for demonstration */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-text">Alice Johnson</h4>
              <span className="text-text-muted text-sm">•</span>
              <span className="text-text-muted text-sm">2h ago</span>
            </div>
            <p className="text-text-muted mb-3">
              Excited to share that I've completed my latest React project! The new concurrent features are absolutely game-changing for user experience. 🚀
            </p>
            <div className="flex items-center space-x-4 text-sm text-text-muted">
              <span>12 likes</span>
              <span>3 comments</span>
              <span>2 shares</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            B
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-text">Bob Smith</h4>
              <span className="text-text-muted text-sm">•</span>
              <span className="text-text-muted text-sm">1d ago</span>
            </div>
            <p className="text-text-muted mb-3">
              Just finished reading an amazing article about product management best practices. Always learning something new in this field! 📚
            </p>
            <div className="flex items-center space-x-4 text-sm text-text-muted">
              <span>8 likes</span>
              <span>1 comment</span>
              <span>1 share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutTab({ user }: { user: UserProfile }) {
  return (
    <div className="space-y-6">
      {user.bio && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-text mb-4">About</h3>
          <p className="text-text-muted">{user.bio}</p>
        </div>
      )}

      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-text mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            React
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            TypeScript
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Node.js
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Python
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            AWS
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Docker
          </span>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold text-text mb-4">Contact Info</h3>
        <div className="space-y-3">
          {user.username && (
            <div className="flex items-center space-x-3">
              <LinkIcon className="w-4 h-4 text-text-muted" />
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : 'nav-in.com'}/in/${user.username}`}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {typeof window !== 'undefined' ? window.location.origin : 'nav-in.com'}/in/{user.username}
              </a>
            </div>
          )}
          {user.website && (
            <div className="flex items-center space-x-3">
              <LinkIcon className="w-4 h-4 text-text-muted" />
              <a href={user.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {user.website}
              </a>
            </div>
          )}
          {user.location && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-text-muted" />
              <span className="text-text-muted">{user.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExperienceTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Experience</h3>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
            T
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text">Software Engineer</h4>
            <p className="text-primary mb-1">TechCorp</p>
            <p className="text-text-muted text-sm mb-2">Jan 2022 - Present • 2 years</p>
            <p className="text-text-muted text-sm mb-3">
              Developing and maintaining web applications using React, Node.js, and AWS.
              Led a team of 3 developers on a major product redesign.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">React</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">Node.js</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">AWS</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">Team Leadership</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
            G
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text">Frontend Developer</h4>
            <p className="text-primary mb-1">GlobalTech Solutions</p>
            <p className="text-text-muted text-sm mb-2">Jun 2020 - Dec 2021 • 1 year 7 months</p>
            <p className="text-text-muted text-sm mb-3">
              Built responsive user interfaces for enterprise applications using modern JavaScript frameworks.
              Collaborated with design team to implement pixel-perfect designs.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">JavaScript</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">CSS</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">UI/UX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EducationTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Education</h3>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text">Bachelor of Science in Computer Science</h4>
            <p className="text-primary mb-1">University of Technology</p>
            <p className="text-text-muted text-sm mb-2">2018 - 2022</p>
            <p className="text-text-muted text-sm mb-3">
              Graduated Magna Cum Laude. Relevant coursework: Data Structures, Algorithms,
              Software Engineering, Database Systems, Computer Networks.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">Magna Cum Laude</span>
              <span className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">Dean's List</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
            C
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text">AWS Certified Solutions Architect</h4>
            <p className="text-primary mb-1">Amazon Web Services</p>
            <p className="text-text-muted text-sm mb-2">2023 - Present</p>
            <p className="text-text-muted text-sm">
              Professional certification demonstrating expertise in designing distributed systems on AWS platform.
            </p>
          </div>
        </div>
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
