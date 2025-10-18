'use client'

import React from 'react'
import { TrendingUp, MapPin, Building, User, MessageCircle, ExternalLink, Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface JobRecommendation {
  id: string
  title: string
  companyName: string
  location: string
  type: string
  matchScore: number
  author: {
    name: string
    avatar?: string
  }
}

interface PostRecommendation {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    title: string
  }
  timestamp: string
  relevanceScore: number
}

interface UserRecommendation {
  id: string
  name: string
  title: string
  avatar?: string
  location?: string
  connectionScore: number
}

interface RecommendationsEngineProps {
  title: string
  description: string
  items: JobRecommendation[] | PostRecommendation[] | UserRecommendation[]
  type: 'jobs' | 'posts' | 'users'
  onItemClick: (id: string) => void
}

export const RecommendationsEngine: React.FC<RecommendationsEngineProps> = ({
  title,
  description,
  items,
  type,
  onItemClick
}) => {
  const renderJobItem = (job: JobRecommendation) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-soft transition-all cursor-pointer"
      onClick={() => onItemClick(job.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text">{job.title}</h3>
            <p className="text-sm text-text-muted">{job.companyName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-primary">{job.matchScore}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-text-muted">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
          <span>•</span>
          <span>{job.type}</span>
        </div>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )

  const renderPostItem = (post: PostRecommendation) => (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-soft transition-all cursor-pointer"
      onClick={() => onItemClick(post.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            post.author.name.charAt(0)
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-text text-sm">{post.author.name}</h3>
            <span className="text-xs text-text-muted">{post.author.title}</span>
            <div className="flex items-center space-x-1 ml-auto">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-medium text-primary">{post.relevanceScore}%</span>
            </div>
          </div>

          <p className="text-sm text-text-muted mb-2 line-clamp-2">{post.content}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">Reply</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderUserItem = (user: UserRecommendation) => (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-soft transition-all cursor-pointer"
      onClick={() => onItemClick(user.id)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name.charAt(0)
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-text">{user.name}</h3>
          <p className="text-sm text-text-muted">{user.title}</p>
          {user.location && (
            <p className="text-xs text-text-muted">{user.location}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-primary">{user.connectionScore}%</span>
          </div>
          <button className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
            Connect
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-text mb-2">{title}</h2>
        <p className="text-text-muted">{description}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No recommendations available yet. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              switch (type) {
                case 'jobs':
                  return renderJobItem(item as JobRecommendation)
                case 'posts':
                  return renderPostItem(item as PostRecommendation)
                case 'users':
                  return renderUserItem(item as UserRecommendation)
                default:
                  return null
              }
            })}
          </div>
        )}
      </div>
    </div>
  )
}