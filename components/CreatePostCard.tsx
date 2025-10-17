'use client'

import React, { useState } from 'react'
import { Image, Video, Calendar, MapPin, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirebase } from './FirebaseProvider'

export const CreatePostCard = () => {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useFirebase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          image: null // TODO: Add image upload support
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('Post created successfully:', data.data)
        setContent('')
        setIsExpanded(false)
        // Optionally trigger a callback to refresh the feed
        window.location.reload() // Simple refresh for now
      } else {
        console.error('Failed to create post:', data.error)
        alert('Failed to create post: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    }
  }

  if (!user) {
    return null // Don't show post creation for non-authenticated users
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-soft border border-border p-6"
    >
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {user.displayName
              ? user.displayName.charAt(0).toUpperCase()
              : user.email?.split('@')[0].charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 text-text-muted">
            What's on your mind?
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-3 bg-surface border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                rows={3}
              />
            </div>
          </div>

          {/* Post Options */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="flex items-center space-x-2 text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
              >
                <Image className="w-5 h-5" />
                <span className="text-sm">Photo</span>
              </button>
              <button
                type="button"
                className="flex items-center space-x-2 text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
              >
                <Video className="w-5 h-5" />
                <span className="text-sm">Video</span>
              </button>
              <button
                type="button"
                className="flex items-center space-x-2 text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Event</span>
              </button>
              <button
                type="button"
                className="flex items-center space-x-2 text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
              >
                <MapPin className="w-5 h-5" />
                <span className="text-sm">Location</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      )}
    </motion.div>
  )
}
