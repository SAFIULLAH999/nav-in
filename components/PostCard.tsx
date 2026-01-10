'use client'

import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Post } from '@/types'
import { useSocket } from '@/components/SocketProvider'
import Avatar from '@/components/Avatar'

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
    const handlePostLiked = (data: any) => {
      if (data.postId === post.id) {
        setLikesCount(data.likesCount)
        setIsLiked(data.liked)
      }
    }

    const handlePostCommented = (data: any) => {
      if (data.postId === post.id) {
        setComments(prev => [data.comment, ...prev])
      }
    }

    const handlePostShared = (data: any) => {
      if (data.postId === post.id) {
        // Handle share updates if needed (e.g., increment share count)
      }
    }

    // Listen for specific post events
    socket?.on('post_liked', handlePostLiked)
    socket?.on('post_commented', handlePostCommented)
    socket?.on('post_shared', handlePostShared)

    return () => {
      socket?.off('post_liked', handlePostLiked)
      socket?.off('post_commented', handlePostCommented)
      socket?.off('post_shared', handlePostShared)
    }
  }, [socket, post.id])

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        alert('Authentication required. Please sign in to like posts.')
        return
      }

      // Always call the API directly for reliability
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: isLiked ? 'unlike' : 'like'
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update UI based on API response
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)

        // Emit socket event if connected for real-time updates
        if (isConnected && socket) {
          socket.emit('post_liked', {
            postId: post.id,
            likesCount: isLiked ? likesCount - 1 : likesCount + 1,
            liked: !isLiked
          })
        }
      } else {
        alert(data.error || 'Failed to update like')
      }
    } catch (error) {
      console.error('Error updating like:', error)
      alert('Failed to update like')
    }
  }

  const handleShare = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        alert('Authentication required. Please sign in to share posts.')
        return
      }

      // Always call the API to record the share
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        // Emit socket event if connected for real-time updates
        if (isConnected && socket) {
          socket.emit('post_shared', {
            postId: post.id,
            share: { userId: 'current_user', timestamp: new Date().toISOString() }
          })
        }

        // Share the content
        if (navigator.share) {
          navigator.share({
            title: 'NavIN Post',
            text: post.content,
            url: window.location.href,
          })
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(window.location.href)
          alert('Post link copied to clipboard!')
        }
      } else {
        alert('Failed to share post')
      }
    } catch (error) {
      console.error('Error sharing post:', error)
      alert('Failed to share post')
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
    if (!commentContent.trim()) return

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) {
      alert('Authentication required. Please sign in to comment.')
      return
    }

    try {
      // Always call the API directly for reliability
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add comment to UI
        setComments(prev => [data.data, ...prev])
        setCommentContent('')

        // Emit socket event if connected for real-time updates
        if (isConnected && socket) {
          socket.emit('post_commented', {
            postId: post.id,
            comment: data.data
          })
        }
      } else {
        alert(data.error || 'Failed to add comment')
      }
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
            <div>
              <Avatar src={post.author.avatar || null} name={post.author.name || 'User'} size="lg" className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-text">{post.author.name}</h3>
                <span className="text-text-muted">•</span>
                <span className="text-text-muted text-sm">{new Date(post.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
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
                      <div>
                        <Avatar src={comment.author.avatar || null} name={comment.author.name || 'User'} size="sm" />
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
