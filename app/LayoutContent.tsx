'use client'

import Navbar from '@/components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import { SocketProvider } from '@/components/SocketProvider'
import { RealTimeProvider } from '@/components/providers/RealTimeProvider'
import { LiveblocksProvider } from '@/components/providers/LiveblocksProvider'
import { AblyProvider } from '@/components/providers/AblyProvider'
import { ActivityTracker } from '@/components/ActivityTracker'
import { FirebaseProvider } from '@/components/FirebaseProvider'
import { usePathname } from 'next/navigation'

interface LayoutContentProps {
  children: React.ReactNode
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  const isFeedPage = pathname === '/feed'
  const isHomePage = pathname === '/'
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

  return (
    <ClerkProvider>
      <FirebaseProvider>
        <SocketProvider>
            <LiveblocksProvider>
              <AblyProvider>
                <ActivityTracker>
                  <div className="min-h-screen flex flex-col">
                    {!isAuthPage && <Navbar />}
                    <div className={`flex flex-1 w-full ${!isAuthPage ? 'pt-16' : ''}`}>
                      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 min-w-0 max-w-5xl mx-auto">
                        {children}
                      </main>
                    </div>
                  </div>
                </ActivityTracker>
              </AblyProvider>
            </LiveblocksProvider>
          </SocketProvider>
      </FirebaseProvider>
    </ClerkProvider>
  )
}
