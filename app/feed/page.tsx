'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { CreatePostCard } from '@/components/CreatePostCard'
import { PostCard } from '@/components/PostCard'
import { Post } from '@/types'
import { useSocket } from '@/components/SocketProvider'

export default function FeedPage() {
  const { socket, onPostUpdate } = useSocket()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    fetchPosts()
    checkIfNewUser()
  }, [])

  useEffect(() => {
    const handleNewPost = (newPost: Post) => {
      setPosts(prevPosts => [newPost, ...prevPosts])
    }

    const handlePostUpdate = (data: any) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === data.postId
            ? {
                ...post,
                likes: data.likesCount ?? post.likes,
                comments: data.commentsCount ?? post.comments,
                shares: data.sharesCount ?? post.shares,
                liked: data.liked ?? post.liked
              }
            : post
        )
      )
    }

    socket?.on('new_post_created', handleNewPost)
    onPostUpdate(handlePostUpdate)

    return () => {
      socket?.off('new_post_created', handleNewPost)
    }
  }, [onPostUpdate])

  const checkIfNewUser = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        setIsNewUser(true)
        return
      }

      const response = await fetch('/api/user/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setIsNewUser(!data.data?.hasPosts && !data.data?.hasConnections)
      } else {
        setIsNewUser(true)
      }
    } catch (error) {
      console.log('Could not check user status, assuming new user')
      setIsNewUser(true)
    }
  }

  const fetchPosts = async (filterType: string = 'all') => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/posts?filter=${filterType}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setPosts(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch posts')
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to fetch posts. Please try again.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts])
  }

  return (
      <div className="min-h-screen bg-background w-full">
      <div className="flex w-full">
        <LeftSidebar />

        <main className="flex-1 max-w-2xl mx-4 lg:mx-8">
          <div className="space-y-4">
            {/* Welcome Section - Only for new users */}
            {isNewUser && (
              <div className="bg-muted rounded-xl p-6 border border-border">
                <h1 className="text-2xl font-bold text-text mb-2">Welcome to NavIN!</h1>
                <p className="text-text-muted">Discover what's happening in your network and share your thoughts with others.</p>
              </div>
            )}

          {/* Enhanced Feed Filter Controls */}
          <div className="bg-card rounded-xl shadow-md border border-border p-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => fetchPosts('all')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                All Activity
              </button>
              <button
                onClick={() => fetchPosts('job_updates')}
                className="px-4 py-2 bg-muted text-text hover:bg-muted/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Job Updates
              </button>
              <button
                onClick={() => fetchPosts('posts')}
                className="px-4 py-2 bg-muted text-text hover:bg-muted/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Posts Only
              </button>
              <button
                onClick={() => fetchPosts('connections')}
                className="px-4 py-2 bg-muted text-text hover:bg-muted/80 rounded-lg transition-colors whitespace-nowrap"
              >
                New Connections
              </button>
              <button
                onClick={() => fetchPosts('endorsements')}
                className="px-4 py-2 bg-muted text-text hover:bg-muted/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Endorsements
              </button>
              <button
                onClick={() => fetchPosts('recommendations')}
                className="px-4 py-2 bg-muted text-text hover:bg-muted/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Recommendations
              </button>
            </div>
          </div>

            <CreatePostCard onPostCreated={handlePostCreated} />

            {/* Loading State */}
            {loading && (
              <div className="bg-card rounded-xl shadow-md border border-border p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-muted">Loading posts...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchPosts()}
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
              </>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <div className="bg-card rounded-xl shadow-md border border-border p-8 text-center">
                <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No posts yet</h3>
                <p className="text-text-muted">Be the first to share something with your network!</p>
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
