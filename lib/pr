// Mock Prisma client for development when database is not available
export class MockPrismaClient {
  private mockData = {
    job: {
      findMany: async () => [
        {
          id: '1',
          title: 'Software Engineer',
          description: 'We are looking for a talented software engineer',
          companyName: 'Tech Corp',
          location: 'Remote',
          type: 'FULL_TIME',
          salaryMin: 80000,
          salaryMax: 120000,
          requirements: JSON.stringify(['JavaScript', 'React', 'Node.js']),
          createdAt: new Date(),
          applicationsCount: 5,
          _count: {
            applications: 5
          },
          author: {
            name: 'John Doe',
            username: 'johndoe',
            avatar: '',
            title: 'Hiring Manager'
          }
        },
        {
          id: '2',
          title: 'Frontend Developer',
          description: 'Join our frontend team',
          companyName: 'StartupXYZ',
          location: 'New York, NY',
          type: 'FULL_TIME',
          salaryMin: 70000,
          salaryMax: 100000,
          requirements: JSON.stringify(['React', 'TypeScript', 'CSS']),
          createdAt: new Date(),
          applicationsCount: 3,
          _count: {
            applications: 3
          },
          author: {
            name: 'Jane Smith',
            username: 'janesmith',
            avatar: '',
            title: 'Tech Lead'
          }
        }
      ],
      findUnique: async (args: any) => {
        if (args.where.id === '1') {
          return {
            id: '1',
            title: 'Software Engineer',
            description: 'We are looking for a talented software engineer',
            companyName: 'Tech Corp',
            location: 'Remote',
            type: 'FULL_TIME',
            salaryMin: 80000,
            salaryMax: 120000,
            requirements: JSON.stringify(['JavaScript', 'React', 'Node.js']),
            benefits: 'Health insurance, 401k, Flexible hours',
            experience: '3-5 years',
            isRemote: true,
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            views: 150,
            applicationsCount: 5,
            createdAt: new Date(),
            employerEmail: 'john@techcorp.com',
            employerPhone: '+1234567890',
            employerUsername: 'johndoe',
            employerName: 'John Doe',
            authorId: 'author1',
            _count: {
              applications: 5
            },
            author: {
              name: 'John Doe',
              email: 'john@techcorp.com',
              username: 'johndoe',
              avatar: '',
              title: 'Hiring Manager'
            }
          }
        }
        return null
      },
      create: async (args: any) => ({
        id: 'mock-id-' + Date.now(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      update: async (args: any) => ({
        id: args.where.id,
        ...args.data,
        updatedAt: new Date()
      }),
      count: async () => 10
    },
    application: {
      findMany: async () => [],
      findUnique: async (args?: any) => null,
      create: async (args: any) => ({
        id: 'app-' + Date.now(),
        ...args.data,
        appliedAt: new Date()
      })
    },
    user: {
      findUnique: async (args: any) => {
        if (args.where.id === 'demo-user-1') {
          return {
            id: 'demo-user-1',
            name: 'Demo User',
            email: 'demo@example.com',
            username: 'demouser'
          }
        }
        return null
      }
    },
    post: {
      findMany: async () => [
        {
          id: '1',
          content: 'Excited to announce my new role at Tech Corp! Looking forward to working with amazing people.',
          authorId: 'user1',
          createdAt: new Date(),
          image: null,
          video: null,
          _count: {
            likes: 15,
            comments: 3,
            shares: 2
          },
          author: {
            id: 'user1',
            name: 'John Doe',
            username: 'johndoe',
            avatar: '',
            title: 'Software Engineer'
          }
        },
        {
          id: '2',
          content: 'Just completed an amazing project using React and TypeScript. The future of web development is here!',
          authorId: 'user2',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          image: null,
          video: null,
          _count: {
            likes: 8,
            comments: 1,
            shares: 0
          },
          author: {
            id: 'user2',
            name: 'Jane Smith',
            username: 'janesmith',
            avatar: '',
            title: 'Frontend Developer'
          }
        },
        {
          id: '3',
          content: 'Networking tip: Always follow up after interviews within 24 hours. It shows professionalism and genuine interest.',
          authorId: 'user3',
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          image: null,
          video: null,
          _count: {
            likes: 23,
            comments: 7,
            shares: 5
          },
          author: {
            id: 'user3',
            name: 'Mike Johnson',
            username: 'mikej',
            avatar: '',
            title: 'Career Coach'
          }
        }
      ],
      findUnique: async (args?: any) => null,
      create: async (args: any) => ({
        id: 'post-' + Date.now(),
        ...args.data,
        createdAt: new Date(),
        _count: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      })
    },
    connection: {
      findMany: async () => []
    },
    follow: {
      findMany: async () => []
    },
    like: {
      findMany: async () => []
    }
  }

  get job() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding jobs with args:', args)
        return this.mockData.job.findMany()
      },
      findUnique: async (args: any) => {
        console.log('Mock: Finding unique job with args:', args)
        return this.mockData.job.findUnique(args)
      },
      create: async (args: any) => {
        console.log('Mock: Creating job with args:', args)
        return this.mockData.job.create(args)
      },
      update: async (args: any) => {
        console.log('Mock: Updating job with args:', args)
        return this.mockData.job.update(args)
      },
      count: async (args?: any) => {
        console.log('Mock: Counting jobs with args:', args)
        return this.mockData.job.count()
      }
    }
  }

  get application() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding applications with args:', args)
        return this.mockData.application.findMany()
      },
      findUnique: async (args?: any) => {
        console.log('Mock: Finding unique application with args:', args)
        return this.mockData.application.findUnique(args || {})
      },
      create: async (args: any) => {
        console.log('Mock: Creating application with args:', args)
        return this.mockData.application.create(args)
      }
    }
  }

  get user() {
    return {
      findUnique: async (args: any) => {
        console.log('Mock: Finding user with args:', args)
        return this.mockData.user.findUnique(args)
      }
    }
  }

  get post() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding posts with args:', args)
        return this.mockData.post.findMany()
      },
      findUnique: async (args?: any) => {
        console.log('Mock: Finding unique post with args:', args)
        return this.mockData.post.findUnique(args || {})
      },
      create: async (args: any) => {
        console.log('Mock: Creating post with args:', args)
        return this.mockData.post.create(args)
      }
    }
  }

  get connection() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding connections with args:', args)
        return this.mockData.connection.findMany()
      }
    }
  }

  get follow() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding follows with args:', args)
        return this.mockData.follow.findMany()
      }
    }
  }

  get like() {
    return {
      findMany: async (args?: any) => {
        console.log('Mock: Finding likes with args:', args)
        return this.mockData.like.findMany()
      }
    }
  }
}

// Export a mock prisma instance
export const prisma = new MockPrismaClient()