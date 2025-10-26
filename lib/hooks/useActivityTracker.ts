'use client'

import { useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export const useActivityTracker = () => {
  const { user } = useUser()
  const pathname = usePathname()

  const trackActivity = useCallback(async (action: string, metadata?: Record<string, any>) => {
    if (!user?.id) return

    try {
      await fetch('/api/user/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action,
          metadata: {
            ...metadata,
            path: pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      // Silently fail in development to avoid console noise
      if (process.env.NODE_ENV === 'development') {
        return
      }
      console.error('Failed to track activity:', error)
    }
  }, [user?.id, pathname])

  // Track page views
  useEffect(() => {
    if (pathname && user?.id) {
      trackActivity('page_view', {
        page: pathname,
        referrer: document.referrer
      })
    }
  }, [pathname, user?.id, trackActivity])

  // Track user interactions
  const trackClick = useCallback((element: string, metadata?: Record<string, any>) => {
    trackActivity('click', { element, ...metadata })
  }, [trackActivity])

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, any>) => {
    trackActivity('form_submit', { formName, ...metadata })
  }, [trackActivity])

  const trackSearch = useCallback((query: string, results?: number) => {
    trackActivity('search', { query, results })
  }, [trackActivity])

  const trackConnection = useCallback((targetUserId: string, action: 'sent' | 'accepted' | 'declined') => {
    trackActivity('connection_made', { targetUserId, connectionAction: action })
  }, [trackActivity])

  const trackPost = useCallback((action: 'created' | 'liked' | 'commented' | 'shared', postId?: string) => {
    trackActivity('post_created', { postAction: action, postId })
  }, [trackActivity])

  return {
    trackActivity,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackConnection,
    trackPost
  }
}
