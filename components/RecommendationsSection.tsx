'use client'

import React, { useState, useEffect } from 'react'
import { Star, User, Briefcase, MessageCircle, ThumbsUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface Recommendation {
  id: string
  recommender: {
    id: string
    name: string
    title: string
    avatar: string
    company: string
  }
  relationship: string
  position: string | null
  content: string
  status: string
  createdAt: string
}

interface RecommendationsSectionProps {
  userId: string
  isCurrentUser?: boolean
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  userId,
  isCurrentUser = false
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [userId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const response = await fetch(`/api/recommendations/request?status=ACCEPTED&userId=${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch recommendations')
        setRecommendations([])
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setError('Failed to fetch recommendations. Please try again.')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const visibleRecommendations = showAll ? recommendations : recommendations.slice(0, 2)

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <div className="animate-pulse space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/3"></div>
                  <div className="h-2 bg-secondary rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded w-full"></div>
                <div className="h-2 bg-secondary rounded w-3/4"></div>
                <div className="h-2 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-text flex items-center">
            <Star className="w-5 h-5 mr-2 text-primary" />
            Recommendations
          </h3>
          {recommendations.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'}
            </span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-text-muted" />
            </div>
            <h4 className="font-semibold text-text mb-2">No recommendations yet</h4>
            <p className="text-text-muted text-sm">
              {isCurrentUser
                ? 'You haven\'t received any recommendations yet. Request recommendations from colleagues!'
                : 'This user hasn\'t received any recommendations yet.'}
            </p>
            {isCurrentUser && (
              <button
                onClick={() => window.location.href = '/network'}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Request Recommendations
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {visibleRecommendations.map((recommendation) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/30 rounded-lg p-6 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Recommender Info */}
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {recommendation.recommender.avatar ? (
                      <img
                        src={recommendation.recommender.avatar}
                        alt={recommendation.recommender.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <p className="font-semibold text-text">{recommendation.recommender.name}</p>
                      <p className="text-sm text-text-muted">{recommendation.recommender.title}</p>
                      {recommendation.recommender.company && (
                        <p className="text-xs text-text-muted flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {recommendation.recommender.company}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {recommendation.relationship} {recommendation.position && `for ${recommendation.position}`}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-border">
                      <p className="text-text italic mb-3">"{recommendation.content}"</p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-muted">
                          Recommended {new Date(recommendation.createdAt).toLocaleDateString()}
                        </p>
                        <button className="flex items-center space-x-1 text-xs text-text-muted hover:text-primary transition-colors">
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {recommendations.length > 2 && !showAll && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-4 py-2 bg-secondary text-text hover:bg-secondary/80 rounded-lg transition-colors font-medium"
                >
                  Show All Recommendations ({recommendations.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}