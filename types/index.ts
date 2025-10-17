export interface Post {
  id: string
  author: {
    name: string
    username: string
    avatar: string
    title: string
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  liked: boolean
  image?: string | null
}

export interface User {
  id: string
  name?: string | null
  email: string
  emailVerified?: Date | null
  image?: string | null
  username?: string | null
  bio?: string | null
  title?: string | null
  company?: string | null
  location?: string | null
  website?: string | null
  skills?: string | null
  avatar?: string | null
  summary?: string | null
  socialLinks?: string | null
  isActive: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string
  author: {
    name: string
    username: string
    avatar: string
  }
  timestamp: string
  likes: number
  liked: boolean
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  description: string
  salaryMin?: number
  salaryMax?: number
  requirements?: string
  benefits?: string
  authorId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
