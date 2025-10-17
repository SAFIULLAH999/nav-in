'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Heart, MessageCircle, UserPlus, Briefcase, Award, Settings, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'connection' | 'job' | 'mention' | 'achievement'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  avatar?: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      title: 'John Doe liked your post',
      message: 'Great insights on React performance optimization!',
      timestamp: '2 minutes ago',
      isRead: false,
      avatar: '/avatars/john.jpg'
    },
    {
      id: '2',
      type: 'connection',
      title: 'New connection request',
      message: 'Alice Johnson wants to connect with you',
      timestamp: '1 hour ago',
      isRead: false,
      avatar: '/avatars/alice.jpg'
    },
    {
      id: '3',
      type: 'comment',
      title: 'New comment on your post',
      message: 'Thanks for sharing this! Very helpful information.',
      timestamp: '3 hours ago',
      isRead: true,
      avatar: '/avatars/bob.jpg'
    },
    {
      id: '4',
      type: 'job',
      title: 'New job recommendation',
      message: 'Senior Frontend Developer at TechCorp matches your profile',
      timestamp: '5 hours ago',
      isRead: true,
      avatar: '/companies/techcorp.jpg'
    },
    {
      id: '5',
      type: 'achievement',
      title: 'Achievement unlocked!',
      message: 'You\'ve reached 100 connections! 🎉',
      timestamp: '1 day ago',
      isRead: true
    }
  ])

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' || (filter === 'unread' && !notif.isRead)
  )

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'connection':
        return <UserPlus className="w-5 h-5 text-green-500" />
      case 'job':
        return <Briefcase className="w-5 h-5 text-purple-500" />
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500" />
      default:
        return <Settings className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-20 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">Notifications</h1>
              <p className="text-text-muted">
                Stay updated with your professional network activity
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text-muted hover:bg-secondary/80'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors relative ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text-muted hover:bg-secondary/80'
              }`}
            >
              Unread ({unreadCount})
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-text-muted">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Notifications will appear here when there\'s activity on your network.'
                }
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card rounded-xl shadow-soft border transition-all ${
                  !notification.isRead
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0">
                      {notification.avatar ? (
                        <img
                          src={notification.avatar}
                          alt=""
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-text-muted mb-2">
                            {notification.message}
                          </p>
                          <p className="text-sm text-text-muted">
                            {notification.timestamp}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-secondary rounded transition-colors"
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          <button className="p-1 hover:bg-secondary rounded transition-colors">
                            <X className="w-4 h-4 text-text-muted" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-8 py-3 border border-border rounded-lg hover:bg-secondary transition-colors">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
