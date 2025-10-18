'use client'

import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Post } from '@/types'
import { useSocket } from '@/components/SocketProvider'

interface PostCardProps {
  post: Post
}

export const PostCard = ({ post }: PostCardProps) => {
  const { socket, isConnected, onPostUpdate } = useSocket()
  const [isLiked, setIsLiked] = useState(post.liked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentContent, setCommentContent] = useState('')

  // Socket event listeners for real-time updates
  useEffect(() => {
    const handlePostUpdate = (data: any) => {
      if (data.postId === post.id) {
        switch (data.type) {
          case 'like':
            setLikesCount(data.likesCount)
            setIsLiked(data.liked)
            break
          case 'comment':
            setComments(prev => [data.comment, ...prev])
            break
          case 'share':
            // Handle share updates if needed
            break
        }
      }
    }

    onPostUpdate(handlePostUpdate)
  }, [onPostUpdate, post.id])

  const handleLike = async () => {
    if (!isConnected) {
      alert('Real-time connection not available')
      return
    }

    try {
      // Send like/unlike via socket
      socket?.emit('post_interaction', {
        postId: post.id,
        type: 'like',
        action: isLiked ? 'unlike' : 'like'
      })

      // Optimistically update UI
      setIsLiked(!isLiked)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    } catch (error) {
      console.error('Error updating like:', error)
      alert('Failed to update like')
    }
  }

  const handleShare = () => {
    if (isConnected) {
      // Send share via socket for analytics
      socket?.emit('post_interaction', {
        postId: post.id,
        type: 'share'
      })
    }

    if (navigator.share) {
      navigator.share({
        title: 'NavIN Post',
        text: post.content,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const loadComments = async () => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/posts/${post.id}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!commentContent.trim() || !isConnected) return

    try {
      // Send comment via socket
      socket?.emit('post_interaction', {
        postId: post.id,
        type: 'comment',
        content: commentContent.trim()
      })

      // Optimistically add comment to UI
      const optimisticComment = {
        id: `temp_${Date.now()}`,
        content: commentContent.trim(),
        author: { name: 'You', avatar: null },
        timestamp: new Date().toISOString()
      }
      setComments(prev => [optimisticComment, ...prev])
      setCommentContent('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments && comments.length === 0) {
      loadComments()
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-soft border border-border overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {post.author.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-text">{post.author.name}</h3>
                <span className="text-text-muted">•</span>
                <span className="text-text-muted text-sm">{post.timestamp}</span>
              </div>
              <p className="text-sm text-text-muted">{post.author.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <p className="text-text leading-relaxed mb-4">{post.content}</p>

        {post.image && (
          <div className="rounded-lg overflow-hidden mb-4">
            <img
              src={post.image}
              alt="Post content"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      {(likesCount > 0 || post.comments > 0 || post.shares > 0) && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <div className="flex items-center space-x-4">
              {likesCount > 0 && (
                <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
              )}
              {post.comments > 0 && (
                <span>{post.comments} {post.comments === 1 ? 'comment' : 'comments'}</span>
              )}
            </div>
            {post.shares > 0 && (
              <span>{post.shares} {post.shares === 1 ? 'share' : 'shares'}</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-red-500 bg-red-50'
                : 'text-text-muted hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like</span>
          </button>

          <button
            onClick={toggleComments}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-muted hover:text-primary hover:bg-secondary/50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-muted hover:text-primary hover:bg-secondary/50 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border"
        >
          <div className="p-6">
            <div className="space-y-4">
              {/* Comment Input */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 bg-secondary/30 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    rows={2}
                  />
                  <div className="flex items-center justify-end mt-2 space-x-2">
                    <button
                      onClick={() => setShowComments(false)}
                      className="px-4 py-1 text-sm text-text-muted hover:text-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!commentContent.trim()}
                      className="px-4 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 pt-4 border-t border-border">
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {comment.author.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          comment.author.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary/30 rounded-lg p-3">
                          <p className="text-sm text-text">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-text-muted">
                          <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                          <button className="hover:text-primary transition-colors">Like</button>
                          <button className="hover:text-primary transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-text-muted">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.article>
  )
}
