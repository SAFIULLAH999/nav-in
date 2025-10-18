'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { RecommendationsEngine } from '@/components/RecommendationsEngine'
import { TrendingTopics } from '@/components/TrendingTopics'
import { useSocket } from '@/components/SocketProvider'

export default function RecommendationsPage() {
  const { onNotification } = useSocket()
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRecommendations()

    // Listen for real-time recommendation updates
    const handleRecommendationUpdate = (data: any) => {
      if (data.type === 'new_recommendation') {
        loadRecommendations()
      }
    }

    onNotification(handleRecommendationUpdate)
  }, [onNotification])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto flex pt-16">
        <LeftSidebar />

        <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text">AI Recommendations</h1>
                <p className="text-text-muted">Personalized suggestions powered by AI</p>
              </div>

              <button
                onClick={refreshRecommendations}
                disabled={refreshing}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {refreshing ? 'Refreshing...' : 'Refresh AI'}
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-card rounded-xl shadow-soft border border-border p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-secondary rounded w-1/3"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-secondary rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Content */}
            {recommendations && !loading && (
              <div className="space-y-8">
                {/* Job Recommendations */}
                <RecommendationsEngine
                  title="Recommended Jobs"
                  description="Jobs that match your skills and experience"
                  items={recommendations.jobs}
                  type="jobs"
                  onItemClick={(jobId) => {
                    console.log('Job clicked:', jobId)
                    // Navigate to job details
                  }}
                />

                {/* Post Recommendations */}
                <RecommendationsEngine
                  title="Recommended Posts"
                  description="Posts from your network that might interest you"
                  items={recommendations.posts}
                  type="posts"
                  onItemClick={(postId) => {
                    console.log('Post clicked:', postId)
                    // Navigate to post
                  }}
                />

                {/* User Recommendations */}
                <RecommendationsEngine
                  title="People to Connect With"
                  description="Professionals you might want to connect with"
                  items={recommendations.users}
                  type="users"
                  onItemClick={(userId) => {
                    console.log('User clicked:', userId)
                    // Navigate to user profile
                  }}
                />

                {/* Trending Topics */}
                <TrendingTopics />
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}