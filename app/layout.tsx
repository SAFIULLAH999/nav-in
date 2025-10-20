'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { FirebaseProvider } from '@/components/FirebaseProvider'
import { DarkModeProvider } from '@/components/DarkModeProvider'
import { SocketProvider } from '@/components/SocketProvider'
import { RealTimeProvider } from '@/components/providers/RealTimeProvider'
import { LiveblocksProvider } from '@/components/providers/LiveblocksProvider'
import { ActivityTracker } from '@/components/ActivityTracker'
import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFeedPage = pathname === '/feed'
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/forgot-password')

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text transition-colors`}>
        <SessionProvider>
          <DarkModeProvider>
            <FirebaseProvider>
              <SocketProvider>
                <LiveblocksProvider>
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
                </LiveblocksProvider>
              </SocketProvider>
            </FirebaseProvider>
          </DarkModeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
