import { prisma } from '@/lib/prisma'

export interface FeedItem {
  id: string
  type: 'post' | 'job' | 'connection' | 'achievement'
  content: any
  score: number
  createdAt: Date
  userId: string
  metadata?: any
}

export interface FeedConfig {
  userId: string
  limit?: number
  offset?: number
  includeTypes?: Array<'post' | 'job' | 'connection' | 'achievement'>
  timeDecay?: boolean
  personalization?: boolean
}

export class FeedService {
  // Generate personalized feed using time-decay algorithm
  static async getPersonalizedFeed(config: FeedConfig): Promise<{
    items: FeedItem[]
    hasMore: boolean
    totalCount: number
  }> {
    try {
      const {
        userId,
        limit = 20,
        offset = 0,
        includeTypes = ['post', 'job', 'connection', 'achievement'],
        timeDecay = true,
        personalization = true
      } = config

      // Get user's connections for personalized content
      const userConnections = await prisma.connection.findMany({
        where: {
          OR: [
            { senderId: userId, status: 'ACCEPTED' },
            { receiverId: userId, status: 'ACCEPTED' }
          ]
        },
        select: {
          senderId: true,
          receiverId: true
        }
      })

      const connectedUserIds = userConnections.flatMap(conn =>
        conn.senderId === userId ? [conn.receiverId] : [conn.senderId]
      )

      // Build query conditions
      const whereConditions: any[] = []

      if (includeTypes.includes('post')) {
        const postConditions: any = {
          OR: [
            // Posts from connected users
            { authorId: { in: connectedUserIds } },
            // Public posts (you might want to add a 'isPublic' field)
            // For now, we'll include all posts and filter by score
          ]
        }
        whereConditions.push({ type: 'post', ...postConditions })
      }

      if (includeTypes.includes('job')) {
        const jobConditions: any = {
          isActive: true,
          // Jobs from connected users or recent jobs
          OR: [
            { authorId: { in: connectedUserIds } },
            { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Last 7 days
          ],
          // Not expired
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          ]
        }
        whereConditions.push({ type: 'job', ...jobConditions })
      }

      if (includeTypes.includes('connection')) {
        const connectionConditions: any = {
          OR: [
            { senderId: { in: connectedUserIds } },
            { receiverId: { in: connectedUserIds } }
          ],
          status: 'ACCEPTED'
        }
        whereConditions.push({ type: 'connection', ...connectionConditions })
      }

      // Get base items
      let items: FeedItem[] = []

      // Get posts
      if (includeTypes.includes('post')) {
        const posts = await prisma.post.findMany({
          where: {
            authorId: { in: connectedUserIds }
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                title: true,
                company: true
              }
            },
            likes: {
              select: { userId: true }
            },
            comments: {
              select: { id: true }
            },
            shares: {
              select: { id: true }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                shares: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.ceil(limit / 2)
        })

        items.push(...posts.map(post => ({
          id: post.id,
          type: 'post' as const,
          content: {
            ...post,
            engagement: {
              likes: post._count.likes,
              comments: post._count.comments,
              shares: post._count.shares
            }
          },
          score: this.calculatePostScore(post, userId, timeDecay),
          createdAt: post.createdAt,
          userId: post.authorId,
          metadata: {
            author: post.author,
            engagement: post._count
          }
        })))
      }

      // Get jobs
      if (includeTypes.includes('job')) {
        const jobs = await prisma.job.findMany({
          where: {
            isActive: true,
            authorId: { in: connectedUserIds },
            // Not expired
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                company: true
              }
            },
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.ceil(limit / 4)
        })

        items.push(...jobs.map(job => ({
          id: job.id,
          type: 'job' as const,
          content: job,
          score: this.calculateJobScore(job, userId, timeDecay),
          createdAt: job.createdAt,
          userId: job.authorId,
          metadata: {
            author: job.author,
            applicationCount: job._count.applications
          }
        })))
      }

      // Get connections
      if (includeTypes.includes('connection')) {
        const connections = await prisma.connection.findMany({
          where: {
            OR: [
              { senderId: { in: connectedUserIds } },
              { receiverId: { in: connectedUserIds } }
            ],
            status: 'ACCEPTED'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                title: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.ceil(limit / 6)
        })

        items.push(...connections.map(connection => ({
          id: connection.id,
          type: 'connection' as const,
          content: connection,
          score: this.calculateConnectionScore(connection, userId, timeDecay),
          createdAt: connection.createdAt,
          userId: connection.senderId,
          metadata: {
            sender: connection.sender,
            receiver: connection.receiver
          }
        })))
      }

      // Sort by score (descending)
      items.sort((a, b) => b.score - a.score)

      // Apply pagination
      const totalCount = items.length
      const paginatedItems = items.slice(offset, offset + limit)

      return {
        items: paginatedItems,
        hasMore: offset + limit < totalCount,
        totalCount
      }
    } catch (error) {
      console.error('Feed generation error:', error)
      throw error
    }
  }

  // Calculate post score using engagement and time decay
  private static calculatePostScore(post: any, userId: string, timeDecay: boolean): number {
    let score = 0

    // Base engagement score
    const likes = post._count?.likes || 0
    const comments = post._count?.comments || 0
    const shares = post._count?.shares || 0

    score += likes * 1
    score += comments * 2
    score += shares * 3

    // Boost for user's own posts
    if (post.authorId === userId) {
      score += 10
    }

    // Time decay factor
    if (timeDecay) {
      const hoursSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)
      const decayFactor = Math.exp(-hoursSincePost / 24) // Decay over 24 hours
      score *= decayFactor
    }

    return score
  }

  // Calculate job score
  private static calculateJobScore(job: any, userId: string, timeDecay: boolean): number {
    let score = 5 // Base score for jobs

    // Boost for jobs from connections
    if (job.authorId !== userId) {
      score += 3
    }

    // Boost for recent jobs
    const hoursSinceJob = (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceJob < 24) {
      score += 5
    }

    // Time decay
    if (timeDecay) {
      const decayFactor = Math.exp(-hoursSinceJob / (24 * 7)) // Decay over a week
      score *= decayFactor
    }

    return score
  }

  // Calculate connection score
  private static calculateConnectionScore(connection: any, userId: string, timeDecay: boolean): number {
    let score = 8 // Base score for connections

    // Boost if it's the user's connection
    if (connection.senderId === userId || connection.receiverId === userId) {
      score += 5
    }

    // Time decay
    if (timeDecay) {
      const hoursSinceConnection = (Date.now() - connection.createdAt.getTime()) / (1000 * 60 * 60)
      const decayFactor = Math.exp(-hoursSinceConnection / (24 * 3)) // Decay over 3 days
      score *= decayFactor
    }

    return score
  }

  // Get trending topics/hashtags
  static async getTrendingTopics(limit: number = 10): Promise<Array<{
    topic: string
    count: number
    growth: number
  }>> {
    try {
      // This would typically analyze posts, comments, and searches
      // For now, we'll return mock trending data
      const trendingTopics = [
        { topic: 'React', count: 150, growth: 12 },
        { topic: 'TypeScript', count: 120, growth: 8 },
        { topic: 'Next.js', count: 95, growth: 15 },
        { topic: 'Node.js', count: 87, growth: 5 },
        { topic: 'AWS', count: 76, growth: 3 },
        { topic: 'Docker', count: 65, growth: 7 },
        { topic: 'Kubernetes', count: 58, growth: 9 },
        { topic: 'GraphQL', count: 52, growth: 4 },
        { topic: 'MongoDB', count: 48, growth: 6 },
        { topic: 'PostgreSQL', count: 45, growth: 2 }
      ]

      return trendingTopics.slice(0, limit)
    } catch (error) {
      console.error('Trending topics error:', error)
      return []
    }
  }

  // Get suggested connections
  static async getSuggestedConnections(userId: string, limit: number = 10): Promise<Array<{
    user: any
    mutualConnections: number
    commonInterests: string[]
    score: number
  }>> {
    try {
      // Get user's connections
      const userConnections = await prisma.connection.findMany({
        where: {
          OR: [
            { senderId: userId, status: 'ACCEPTED' },
            { receiverId: userId, status: 'ACCEPTED' }
          ]
        },
        select: {
          senderId: true,
          receiverId: true
        }
      })

      const connectedUserIds = userConnections.flatMap(conn =>
        conn.senderId === userId ? [conn.receiverId] : [conn.senderId]
      )

      // Get second-degree connections
      const secondDegreeConnections = await prisma.connection.findMany({
        where: {
          OR: [
            { senderId: { in: connectedUserIds }, status: 'ACCEPTED' },
            { receiverId: { in: connectedUserIds }, status: 'ACCEPTED' }
          ],
          NOT: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        select: {
          senderId: true,
          receiverId: true
        }
      })

      // Count suggestions
      const suggestions = new Map<string, {
        mutualConnections: number
        commonInterests: string[]
      }>()

      for (const conn of secondDegreeConnections) {
        const suggestedUserId = conn.senderId === userId ? conn.receiverId :
                               conn.receiverId === userId ? conn.senderId : null

        if (suggestedUserId && !connectedUserIds.includes(suggestedUserId)) {
          if (!suggestions.has(suggestedUserId)) {
            suggestions.set(suggestedUserId, {
              mutualConnections: 0,
              commonInterests: []
            })
          }

          suggestions.get(suggestedUserId)!.mutualConnections++
        }
      }

      // Get user details for suggestions
      const suggestedUserIds = Array.from(suggestions.keys())
      const suggestedUsers = await prisma.user.findMany({
        where: {
          id: { in: suggestedUserIds },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          title: true,
          company: true,
          location: true,
          skills: true
        }
      })

      // Calculate scores and format response
      const formattedSuggestions = suggestedUsers.map(user => {
        const suggestion = suggestions.get(user.id)!
        const mutualConnections = suggestion.mutualConnections

        // Calculate score based on mutual connections and profile completeness
        const profileCompleteness = [
          user.title,
          user.company,
          user.location,
          user.skills?.length > 0
        ].filter(Boolean).length

        const score = (mutualConnections * 10) + (profileCompleteness * 2)

        return {
          user,
          mutualConnections,
          commonInterests: [], // Would calculate based on skills/industry
          score
        }
      })

      // Sort by score and return top suggestions
      return formattedSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('Suggested connections error:', error)
      return []
    }
  }

  // Record user interaction for feed personalization
  static async recordInteraction(
    userId: string,
    itemId: string,
    itemType: 'post' | 'job' | 'connection',
    interactionType: 'view' | 'like' | 'comment' | 'share' | 'apply'
  ): Promise<void> {
    try {
      // This would typically store interaction data for ML personalization
      // For now, we'll just log it
      console.log(`User ${userId} ${interactionType}d ${itemType} ${itemId}`)

      // In a real implementation, you'd store this in a user_interactions table
      // and use it to train a recommendation model
    } catch (error) {
      console.error('Error recording interaction:', error)
    }
  }
}
