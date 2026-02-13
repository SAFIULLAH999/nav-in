'use client'

import React, { useState, useEffect } from 'react'
import { ThumbsUp, User, Star, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Endorsement {
  id: string
  giver: {
    name: string
    username: string
    avatar: string
    title: string
  }
  skill: {
    id: string
    name: string
  }
  message: string | null
  createdAt: string
}

interface EndorsementsSectionProps {
  userId: string
  isCurrentUser?: boolean
}

export const EndorsementsSection: React.FC<EndorsementsSectionProps> = ({
  userId,
  isCurrentUser = false
}) => {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchEndorsements()
  }, [userId])

  const fetchEndorsements = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const response = await fetch(`/api/endorsements?userId=${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setEndorsements(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch endorsements')
        setEndorsements([])
      }
    } catch (error) {
      console.error('Error fetching endorsements:', error)
      setError('Failed to fetch endorsements. Please try again.')
      setEndorsements([])
    } finally {
      setLoading(false)
    }
  }

  const visibleEndorsements = showAll ? endorsements : endorsements.slice(0, 3)

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-secondary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/4"></div>
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
          onClick={fetchEndorsements}
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
            <ThumbsUp className="w-5 h-5 mr-2 text-primary" />
            Endorsements
          </h3>
          {endorsements.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {endorsements.length} {endorsements.length === 1 ? 'endorsement' : 'endorsements'}
            </span>
          )}
        </div>

        {endorsements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-8 h-8 text-text-muted" />
            </div>
            <h4 className="font-semibold text-text mb-2">No endorsements yet</h4>
            <p className="text-text-muted text-sm">
              {isCurrentUser
                ? 'Your skills haven\'t been endorsed yet. Connect with colleagues to get endorsements!'
                : 'This user hasn\'t received any endorsements yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleEndorsements.map((endorsement) => (
              <motion.div
                key={endorsement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {endorsement.giver.avatar ? (
                    <img
                      src={endorsement.giver.avatar}
                      alt={endorsement.giver.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-medium text-text">{endorsement.giver.name}</p>
                      <p className="text-xs text-text-muted">{endorsement.giver.title}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-medium text-text">{endorsement.skill.name}</span>
                    </div>
                  </div>

                  {endorsement.message && (
                    <p className="text-text-muted text-sm mt-2">
                      "{endorsement.message}"
                    </p>
                  )}

                  <p className="text-xs text-text-muted mt-2">
                    Endorsed {new Date(endorsement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}

            {endorsements.length > 3 && !showAll && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-4 py-2 bg-secondary text-text hover:bg-secondary/80 rounded-lg transition-colors font-medium"
                >
                  Show All Endorsements ({endorsements.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}