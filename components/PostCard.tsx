'use client'

import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, ThumbsUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface Post {
  id: string
  author: {
    name: string
    title: string
    avatar: string
  }
  content: string
  image?: string
  timestamp: string
  likes: number
  comments: number
  shares: number
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface rounded-3xl border border-border p-6 shadow-soft hover:shadow-medium transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-soft">
            {post.author.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-base text-text">{post.author.name}</h3>
            <p className="text-sm text-text-muted">{post.author.title}</p>
            <p className="text-xs text-text-muted">{post.timestamp}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-6">
        <p className="text-sm text-text leading-relaxed">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="mb-6">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            src={post.image}
            alt="Post content"
            className="w-full rounded-2xl object-cover max-h-96 shadow-soft"
          />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center justify-between text-sm text-text-muted mb-4 pb-4 border-b border-border">
        <div className="flex items-center space-x-6">
          <span className="hover:text-primary cursor-pointer transition-colors">
            {post.likes} likes
          </span>
          <span className="hover:text-primary cursor-pointer transition-colors">
            {post.comments} comments
          </span>
          <span className="hover:text-primary cursor-pointer transition-colors">
            {post.shares} shares
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <ActionButton icon={ThumbsUp} label="Like" color="hover:text-primary" />
        <ActionButton icon={MessageCircle} label="Comment" color="hover:text-accent" />
        <ActionButton icon={Repeat2} label="Repost" color="hover:text-primary" />
        <ActionButton icon={Send} label="Send" color="hover:text-accent" />
      </div>
    </motion.div>
  )
}

function ActionButton({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <button className={`flex items-center space-x-3 text-text-muted ${color} transition-all duration-300 p-3 rounded-xl hover:bg-secondary flex-1 justify-center group`}>
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
