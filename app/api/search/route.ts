import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// Helper function to get connected user IDs and pending requests
async function getConnectedUserIds(userId: string): Promise<Set<string>> {
  const connections = await prisma.connection.findMany({
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

  const connectedUserIds = new Set<string>()
  connections.forEach(conn => {
    if (conn.senderId === userId) {
      connectedUserIds.add(conn.receiverId)
    } else {
      connectedUserIds.add(conn.senderId)
    }
  })

  return connectedUserIds
}

// Helper function to get all users with pending connection requests (sent or received)
async function getPendingConnectionUserIds(userId: string): Promise<{ sent: Set<string>, received: Set<string> }> {
  const [sentRequests, receivedRequests] = await Promise.all([
    prisma.connection.findMany({
      where: {
        senderId: userId,
        status: 'PENDING'
      },
      select: { receiverId: true }
    }),
    prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      select: { senderId: true }
    })
  ])

  return {
    sent: new Set(sentRequests.map(req => req.receiverId)),
    received: new Set(receivedRequests.map(req => req.senderId))
  }
}

// GET - Global search across all content
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional for search)
    const authResult = await authenticateRequest(request)
    const currentUserId = authResult && 'user' in authResult ? authResult.user.userId : null

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const type = searchParams.get('type') // 'all', 'users', 'jobs', 'posts', 'companies'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const excludeConnected = searchParams.get('excludeConnected') === 'true'
    const locationFilter = searchParams.get('location')?.trim()
    const companyFilter = searchParams.get('company')?.trim()
    const skillsFilter = searchParams.get('skills')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          jobs: [],
          posts: [],
          companies: [],
          total: 0
        }
      })
    }

    const searchQuery = `%${query}%`

    // Build where conditions for each entity
     let userWhereConditions: any[] = []

     if (query) {
       userWhereConditions.push(
         { name: { contains: query, mode: 'insensitive' } },
         { username: { contains: query, mode: 'insensitive' } },
         { title: { contains: query, mode: 'insensitive' } },
         { company: { contains: query, mode: 'insensitive' } },
         { location: { contains: query, mode: 'insensitive' } },
         { bio: { contains: query, mode: 'insensitive' } },
         { skills: { contains: query, mode: 'insensitive' } }
       )
     } else {
       userWhereConditions.push({}) // Empty condition for when only filters are used
     }

     if (locationFilter) {
       userWhereConditions.push({ location: { contains: locationFilter, mode: 'insensitive' } })
     }

     if (companyFilter) {
       userWhereConditions.push({ company: { contains: companyFilter, mode: 'insensitive' } })
     }

     if (skillsFilter) {
       userWhereConditions.push({ skills: { contains: skillsFilter, mode: 'insensitive' } })
     }

     const userWhere = {
       OR: userWhereConditions.length > 0 ? userWhereConditions : [{ id: { not: null } }], // Fallback condition
       isActive: true
     }

    const jobWhere = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { requirements: { contains: query, mode: 'insensitive' } },
        { benefits: { contains: query, mode: 'insensitive' } }
      ],
      isActive: true
    }

    const postWhere = {
      OR: [
        { content: { contains: query, mode: 'insensitive' } }
      ]
    }

    const companyWhere = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Execute searches in parallel
    const searchPromises = []

    if (type === 'users' || type === 'all') {
       searchPromises.push(
         (async () => {
           let baseWhere = userWhere

           // If excludeConnected is true and we have a current user, filter out connected users
           if (excludeConnected && currentUserId) {
             const [connectedUserIds, pendingConnections] = await Promise.all([
               getConnectedUserIds(currentUserId),
               getPendingConnectionUserIds(currentUserId)
             ])
             
             // Filter results after fetching
             const allUsers = await prisma.user.findMany({
               where: baseWhere,
               select: {
                 id: true,
                 name: true,
                 username: true,
                 avatar: true,
                 title: true,
                 company: true,
                 location: true,
                 bio: true,
               },
               take: limit * 2,
               orderBy: { name: 'asc' }
             })

             const filteredUsers = allUsers
               .filter(user => 
                 !connectedUserIds.has(user.id) && 
                 !pendingConnections.received.has(user.id)
               )
               .slice(0, limit)
               .map(user => ({
                 ...user,
                 connectionStatus: pendingConnections.sent.has(user.id) ? 'pending' : 'none',
                 mutualConnections: 0
               }))

             return { users: filteredUsers, type: 'users' }
           } else {
             const users = await prisma.user.findMany({
               where: baseWhere,
               select: {
                 id: true,
                 name: true,
                 username: true,
                 avatar: true,
                 title: true,
                 company: true,
                 location: true,
                 bio: true,
               },
               take: limit,
               orderBy: { name: 'asc' }
             })

             // Calculate mutual connections for each user
             const usersWithMutualConnections = await Promise.all(
               users.map(async (user) => {
                 if (!currentUserId) {
                   return { ...user, mutualConnections: 0 }
                 }

                 const userConnections = await prisma.connection.findMany({
                   where: {
                     OR: [
                       { senderId: user.id, status: 'ACCEPTED' },
                       { receiverId: user.id, status: 'ACCEPTED' }
                     ]
                   },
                   select: {
                     senderId: true,
                     receiverId: true
                   }
                 })

                 const currentUserConnections = await prisma.connection.findMany({
                   where: {
                     OR: [
                       { senderId: currentUserId, status: 'ACCEPTED' },
                       { receiverId: currentUserId, status: 'ACCEPTED' }
                     ]
                   },
                   select: {
                     senderId: true,
                     receiverId: true
                   }
                 })

                 const userConnectedIds = new Set([
                   ...userConnections.map(c => c.senderId === user.id ? c.receiverId : c.senderId)
                 ])

                 const currentUserConnectedIds = new Set([
                   ...currentUserConnections.map(c => c.senderId === currentUserId ? c.receiverId : c.senderId)
                 ])

                 const mutualConnections = Array.from(userConnectedIds).filter(id => currentUserConnectedIds.has(id)).length

                 return { ...user, mutualConnections }
               })
             )

             return { users: usersWithMutualConnections, type: 'users' }
           }

           const users = await prisma.user.findMany({
             where: baseWhere,
             select: {
               id: true,
               name: true,
               username: true,
               avatar: true,
               title: true,
               company: true,
               location: true,
               bio: true,
             },
             take: limit,
             orderBy: { name: 'asc' }
           })

           return { users, type: 'users' }
         })()
       )
     }

    if (type === 'jobs' || type === 'all') {
      searchPromises.push(
        prisma.job.findMany({
          where: jobWhere,
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
            type: true,
            salaryMin: true,
            salaryMax: true,
            isRemote: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          take: limit,
          orderBy: { createdAt: 'desc' }
        }).then(jobs => ({ jobs, type: 'jobs' }))
      )
    }

    if (type === 'posts' || type === 'all') {
      searchPromises.push(
        prisma.post.findMany({
          where: postWhere,
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          },
          take: limit,
          orderBy: { createdAt: 'desc' }
        }).then(posts => ({ posts, type: 'posts' }))
      )
    }

    if (type === 'companies' || type === 'all') {
      searchPromises.push(
        prisma.company.findMany({
          where: companyWhere,
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            industry: true,
            location: true,
            website: true,
            isVerified: true,
            _count: {
              select: {
                employees: true,
                jobs: true
              }
            }
          },
          take: limit,
          orderBy: { name: 'asc' }
        }).then(companies => ({ companies, type: 'companies' }))
      )
    }

    // If no specific type, search all
    if (searchPromises.length === 0) {
      searchPromises.push(
        Promise.all([
          prisma.user.findMany({
            where: userWhere,
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              title: true,
              company: true,
              location: true,
            },
            take: Math.floor(limit / 4),
            orderBy: { name: 'asc' }
          }),
          prisma.job.findMany({
            where: jobWhere,
            select: {
              id: true,
              title: true,
              companyName: true,
              location: true,
              type: true,
              createdAt: true,
            },
            take: Math.floor(limit / 4),
            orderBy: { createdAt: 'desc' }
          }),
          prisma.post.findMany({
            where: postWhere,
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true
                }
              }
            },
            take: Math.floor(limit / 4),
            orderBy: { createdAt: 'desc' }
          }),
          prisma.company.findMany({
            where: companyWhere,
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              industry: true,
              location: true,
            },
            take: Math.floor(limit / 4),
            orderBy: { name: 'asc' }
          })
        ]).then(([users, jobs, posts, companies]) => ({
          users,
          jobs,
          posts,
          companies,
          type: 'all'
        }))
      )
    }

    const results = await Promise.all(searchPromises)
    const searchResults = results[0] as any

    // Format results for frontend - handle different result types
    let users: any[] = []
    let jobs: any[] = []
    let posts: any[] = []
    let companies: any[] = []

    if (searchResults.type === 'all') {
      users = searchResults.users || []
      jobs = searchResults.jobs || []
      posts = searchResults.posts || []
      companies = searchResults.companies || []
    } else if (searchResults.type === 'users') {
      users = searchResults.users || []
    } else if (searchResults.type === 'jobs') {
      jobs = searchResults.jobs || []
    } else if (searchResults.type === 'posts') {
      posts = searchResults.posts || []
    } else if (searchResults.type === 'companies') {
      companies = searchResults.companies || []
    }

    const formattedResults = {
      users,
      jobs,
      posts,
      companies,
      total: users.length + jobs.length + posts.length + companies.length,
      query,
      type: type || 'all'
    }

    return NextResponse.json({
      success: true,
      data: formattedResults
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
