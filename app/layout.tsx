import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutContent from './LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'NavIN',
    template: '%s | NavIN'
  },
  description: 'Connect with professionals, discover opportunities, and grow your career with NavIN.',
  keywords: ['professional networking', 'career growth', 'job search'],
  authors: [{ name: 'NavIN Team' }],
  creator: 'NavIN',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://navin.com',
    siteName: 'NavIN',
    title: 'NavIN',
    description: 'Connect with professionals, discover opportunities, and grow your career with NavIN.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text antialiased`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  )
}
