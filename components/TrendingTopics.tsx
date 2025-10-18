'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, ExternalLink, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

interface TrendingTopic {
  id: string
  name: string
  postCount: number
  category: string
  trendScore: number
}

export const TrendingTopics: React.FC = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingTopics()
  }, [])

  const loadTrendingTopics = async () => {
    try {
      // Simulate API call for trending topics
      const mockTopics: TrendingTopic[] = [
        {
          id: '1',
          name: 'React 18',
          postCount: 12543,
          category: 'Technology',
          trendScore: 95
        },
        {
          id: '2',
          name: 'Next.js 14',
          postCount: 8921,
          category: 'Technology',
          trendScore: 87
        },
        {
          id: '3',
          name: 'TypeScript',
          postCount: 15234,
          category: 'Technology',
          trendScore: 92
        },
        {
          id: '4',
          name: 'Web Development',
          postCount: 25678,
          category: 'Technology',
          trendScore: 88
        },
        {
          id: '5',
          name: 'Career Growth',
          postCount: 18392,
          category: 'Career',
          trendScore: 83
        }
      ]

      setTrendingTopics(mockTopics)
    } catch (error) {
      console.error('Error loading trending topics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-text">Trending Topics</h2>
        </div>
        <p className="text-text-muted mt-1">What's popular in your network</p>
      </div>

      {/* Topics List */}
      <div className="p-6">
        <div className="space-y-4">
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 hover:bg-secondary/30 rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <Hash className="w-4 h-4 text-primary" />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-text group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    {topic.trendScore > 90 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Trending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-text-muted">
                    <span>{topic.category}</span>
                    <span>•</span>
                    <span>{topic.postCount.toLocaleString()} posts</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">
                    {topic.trendScore}%
                  </div>
                  <div className="text-xs text-text-muted">trend</div>
                </div>

                <button className="p-2 hover:bg-secondary rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <button className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-text-muted">
            Load More Topics
          </button>
        </div>
      </div>
    </div>
  )
}