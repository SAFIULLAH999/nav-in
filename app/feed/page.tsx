'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { CreatePostCard } from '@/components/CreatePostCard'
import { PostCard } from '@/components/PostCard'
import { Post } from '@/types'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts')
      const data = await response.json()

      if (data.success) {
        setPosts(data.data)
      } else {
        setError(data.error || 'Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto flex pt-16">
        <LeftSidebar />

        <main className="flex-1 max-w-2xl mx-4 lg:mx-8">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
              <h1 className="text-2xl font-bold text-text mb-2">Welcome back!</h1>
              <p className="text-text-muted">Discover what's happening in your network and share your thoughts with others.</p>
            </div>

            <CreatePostCard />

            {/* Loading State */}
            {loading && (
              <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-muted">Loading posts...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchPosts}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Posts */}
            {!loading && !error && posts.length > 0 && (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Load More Button */}
                <div className="text-center pt-6">
                  <button className="px-8 py-3 bg-secondary text-text hover:bg-secondary/80 rounded-xl transition-colors font-medium">
                    Load More Posts
                  </button>
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">No posts yet</h3>
                <p className="text-text-muted mb-6">Be the first to share something with your network!</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
