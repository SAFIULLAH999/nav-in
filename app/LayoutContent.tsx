'use client'

import Navbar from '@/components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import { DarkModeProvider } from '@/components/DarkModeProvider'
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
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

  return (
    <ClerkProvider>
      <FirebaseProvider>
        <DarkModeProvider>
          <SocketProvider>
            <LiveblocksProvider>
              <AblyProvider>
                <ActivityTracker>
                  <div className="min-h-screen flex flex-col">
                    {!isAuthPage && <Navbar />}
                    <div className={`flex flex-1 max-w-7xl mx-auto w-full ${!isAuthPage ? 'pt-14' : ''}`}>
                      {isFeedPage ? (
                        <>
                          {children}
                        </>
                      ) : (
                        <main className="flex-1 px-2 sm:px-4 py-4 sm:py-6 min-w-0 max-w-4xl mx-auto">
                          {children}
                        </main>
                      )}
                    </div>
                  </div>
                </ActivityTracker>
              </AblyProvider>
            </LiveblocksProvider>
          </SocketProvider>
        </DarkModeProvider>
      </FirebaseProvider>
    </ClerkProvider>
  )
}
