import React from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import PublicProfileClient from './PublicProfileClient'

interface ProfilePageProps {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = params

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const response = await fetch(`${baseUrl}/api/profile/public/${username}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return {
        title: 'Profile Not Found - NavIN',
        description: 'The requested profile could not be found on NavIN.'
      }
    }

    const userData = await response.json()
    const user = userData.data

    return {
      title: `${user.name || user.username} - Professional Profile | NavIN`,
      description: user.bio || `View ${user.name || user.username}'s professional profile on NavIN. ${user.title || 'Professional'} at ${user.company || 'Company'}.`,
      keywords: user.skills ? user.skills.join(', ') : 'professional profile, networking, career',
      authors: [{ name: user.name || user.username }],
      openGraph: {
        title: `${user.name || user.username} - NavIN Profile`,
        description: user.bio || `Professional profile of ${user.name || user.username} on NavIN`,
        url: `${baseUrl}/in/${username}`,
        siteName: 'NavIN',
        images: user.avatar ? [
          {
            url: user.avatar,
            width: 400,
            height: 400,
            alt: `${user.name || user.username}'s profile picture`
          }
        ] : [],
        locale: 'en_US',
        type: 'profile'
      },
      twitter: {
        card: 'summary',
        title: `${user.name || user.username} - NavIN Profile`,
        description: user.bio || `Professional profile of ${user.name || user.username}`,
        images: user.avatar ? [user.avatar] : []
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: `${baseUrl}/in/${username}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Profile Not Found - NavIN',
      description: 'The requested profile could not be found on NavIN.'
    }
  }
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = params

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const response = await fetch(`${baseUrl}/api/profile/public/${username}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      notFound()
    }

    const userData = await response.json()
    const user = userData.data

    return <PublicProfileClient initialUser={user} />
  } catch (error) {
    console.error('Error fetching profile:', error)
    notFound()
  }
}
