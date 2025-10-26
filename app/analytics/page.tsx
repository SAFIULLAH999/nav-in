'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Eye, TrendingUp, Users, BarChart3, Calendar, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface AnalyticsData {
  profileViews: number
  postImpressions: number
  totalEngagement: number
  demographics: {
    jobTitles: Record<string, number>
    companies: Record<string, number>
    locations: Record<string, number>
    industries: Record<string, number>
  }
  recentViews: Array<{
    viewedAt: string
    viewer: {
      title: string | null
      company: string | null
      location: string | null
      industry: string | null
    }
  }>
  posts: Array<{
    id: string
    impressions: number
    views: number
    likes: number
    comments: number
    shares: number
    engagementRate: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/analytics')

      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        toast.error(data.error || 'Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="text-center py-12">
            <p className="text-text-muted">No analytics data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Profile Analytics</h1>
          <p className="text-text-muted">Track your profile performance and audience insights</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{analytics.profileViews}</p>
                <p className="text-text-muted">Profile Views</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{analytics.postImpressions}</p>
                <p className="text-text-muted">Post Impressions</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{analytics.totalEngagement}</p>
                <p className="text-text-muted">Total Engagement</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Demographic Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Job Titles</h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.jobTitles).slice(0, 5).map(([title, count]) => (
                <div key={title} className="flex items-center justify-between">
                  <span className="text-text-muted">{title}</span>
                  <span className="font-semibold text-text">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Companies</h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.companies).slice(0, 5).map(([company, count]) => (
                <div key={company} className="flex items-center justify-between">
                  <span className="text-text-muted">{company}</span>
                  <span className="font-semibold text-text">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Locations</h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.locations).slice(0, 5).map(([location, count]) => (
                <div key={location} className="flex items-center justify-between">
                  <span className="text-text-muted">{location}</span>
                  <span className="font-semibold text-text">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Industries</h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.industries).slice(0, 5).map(([industry, count]) => (
                <div key={industry} className="flex items-center justify-between">
                  <span className="text-text-muted">{industry}</span>
                  <span className="font-semibold text-text">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-xl p-6 border border-border mb-8"
        >
          <h3 className="text-lg font-semibold text-text mb-4">Recent Profile Views</h3>
          <div className="space-y-3">
            {analytics.recentViews.slice(0, 10).map((view, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div>
                  <p className="font-medium text-text">{view.viewer.title || 'Unknown Title'}</p>
                  <p className="text-sm text-text-muted">{view.viewer.company || 'Unknown Company'}</p>
                </div>
                <div className="text-sm text-text-muted">
                  {new Date(view.viewedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Post Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <h3 className="text-lg font-semibold text-text mb-4">Post Performance</h3>
          <div className="space-y-3">
            {analytics.posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-text-muted">Impressions: {post.impressions}</span>
                    <span className="text-text-muted">Likes: {post.likes}</span>
                    <span className="text-text-muted">Comments: {post.comments}</span>
                    <span className="text-text-muted">Shares: {post.shares}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-primary">Engagement Rate: {post.engagementRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}