'use client'

import React, { useState, useEffect } from 'react'
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
            <CreatePostCard />

            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
