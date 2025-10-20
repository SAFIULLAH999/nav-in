'use client'

import { useActivityTracker } from '@/lib/hooks/useActivityTracker'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

interface ActivityTrackerProps {
  children: React.ReactNode
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ children }) => {
  const { data: session } = useSession()
  const { trackActivity } = useActivityTracker()

  // Track login when session becomes available
  useEffect(() => {
    if (session?.user?.id) {
      trackActivity('login', {
        method: 'session_restored',
        userId: session.user.id
      })
    }
  }, [session?.user?.id, trackActivity])

  // Track clicks on interactive elements
  useEffect(() => {
    if (!session?.user?.id) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Track specific button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button')
        const buttonText = button?.textContent?.trim() || 'Unknown Button'
        const buttonClass = button?.className || ''

        trackActivity('click', {
          element: 'button',
          buttonText,
          buttonClass,
          page: window.location.pathname
        })
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a')
        const href = (link as HTMLAnchorElement)?.href || ''

        trackActivity('click', {
          element: 'link',
          href,
          page: window.location.pathname
        })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [session?.user?.id, trackActivity])

  return <>{children}</>
}
