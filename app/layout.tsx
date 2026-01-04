import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutContent from './LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'NavIN - The Modern Professional Network',
    template: '%s | NavIN'
  },
  description: 'Connect with professionals, discover opportunities, and grow your career with NavIN. The modern professional network built for ambitious professionals.',
  keywords: ['professional networking', 'career growth', 'job search', 'professional connections', 'career opportunities'],
  authors: [{ name: 'NavIN Team' }],
  creator: 'NavIN',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://navin.com',
    siteName: 'NavIN',
    title: 'NavIN - The Modern Professional Network',
    description: 'Connect with professionals, discover opportunities, and grow your career with NavIN.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NavIN - Professional Networking Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@navin',
    creator: '@navin',
    title: 'NavIN - The Modern Professional Network',
    description: 'Connect with professionals, discover opportunities, and grow your career with NavIN.',
    images: ['/twitter-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text transition-colors`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  )
}
