'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { FirebaseProvider } from '@/components/FirebaseProvider'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFeedPage = pathname === '/feed'

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text transition-colors`}>
        <FirebaseProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 max-w-7xl mx-auto w-full pt-14">
              {isFeedPage && <LeftSidebar />}
              <main className={`flex-1 px-2 sm:px-4 py-4 sm:py-6 min-w-0 ${isFeedPage ? '' : 'max-w-4xl mx-auto'}`}>
                {children}
              </main>
              {isFeedPage && <RightSidebar />}
            </div>
          </div>
        </FirebaseProvider>
      </body>
    </html>
  )
}
