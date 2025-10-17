export interface Post {
  id: string
  author: {
    name: string
    title: string
    avatar: string
  }
  content: string
  image?: string
  timestamp: string
  likes: number
  comments: number
  shares: number
}

export interface User {
  id: string
  name: string
  title: string
  company: string
  location: string
  connections: number
  avatar: string
  banner?: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary?: string
  description: string
  requirements: string[]
  postedDate: string
}

export const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      title: 'Senior Frontend Developer at Google',
      avatar: 'SJ'
    },
    content: 'Excited to share that I\'ve been working on some amazing React performance optimizations! The new concurrent features in React 18 are game-changing for user experience. What are your favorite React 18 features?',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    timestamp: '2h ago',
    likes: 127,
    comments: 23,
    shares: 8
  },
  {
    id: '2',
    author: {
      name: 'Mike Chen',
      title: 'Tech Lead at Meta',
      avatar: 'MC'
    },
    content: 'Just finished reading "The Pragmatic Programmer" for the third time. The principles in this book are timeless and apply to every aspect of software development. Highly recommend it to all developers!',
    timestamp: '4h ago',
    likes: 89,
    comments: 15,
    shares: 12
  },
  {
    id: '3',
    author: {
      name: 'Emily Rodriguez',
      title: 'UX Designer at Netflix',
      avatar: 'ER'
    },
    content: 'Design systems are crucial for maintaining consistency across large-scale applications. We\'ve seen incredible improvements in our development velocity since implementing our design system. The investment pays off tremendously!',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    timestamp: '6h ago',
    likes: 156,
    comments: 31,
    shares: 18
  },
  {
    id: '4',
    author: {
      name: 'David Kim',
      title: 'DevOps Engineer at Amazon',
      avatar: 'DK'
    },
    content: 'Kubernetes has revolutionized how we deploy and manage applications at scale. The learning curve is steep, but the benefits are enormous. What\'s your go-to orchestration tool?',
    timestamp: '8h ago',
    likes: 94,
    comments: 27,
    shares: 5
  },
  {
    id: '5',
    author: {
      name: 'Lisa Wang',
      title: 'Product Manager at Stripe',
      avatar: 'LW'
    },
    content: 'Great discussion today about balancing technical debt with feature development. Finding the right equilibrium is key to long-term success. What strategies do you use to manage technical debt in your teams?',
    timestamp: '12h ago',
    likes: 73,
    comments: 19,
    shares: 7
  }
]

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Senior Frontend Developer',
    company: 'Google',
    location: 'San Francisco, CA',
    connections: 1234,
    avatar: 'SJ'
  },
  {
    id: '2',
    name: 'Mike Chen',
    title: 'Tech Lead',
    company: 'Meta',
    location: 'Seattle, WA',
    connections: 987,
    avatar: 'MC'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'UX Designer',
    company: 'Netflix',
    location: 'Los Angeles, CA',
    connections: 756,
    avatar: 'ER'
  }
]

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $160k',
    description: 'We are looking for a Senior React Developer to join our growing team. You will be responsible for building scalable web applications using React, TypeScript, and modern frontend technologies.',
    requirements: [
      '5+ years of React experience',
      'Strong TypeScript skills',
      'Experience with state management (Redux, Zustand)',
      'Knowledge of modern CSS frameworks',
      'Experience with testing frameworks (Jest, React Testing Library)'
    ],
    postedDate: '2 days ago'
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $130k',
    description: 'Join our fast-growing startup as a Full Stack Engineer. You\'ll work on both frontend and backend systems, helping to scale our platform to millions of users.',
    requirements: [
      '3+ years of full stack development experience',
      'Proficiency in React and Node.js',
      'Experience with databases (PostgreSQL, MongoDB)',
      'Knowledge of cloud platforms (AWS, GCP)',
      'Strong problem-solving skills'
    ],
    postedDate: '1 week ago'
  },
  {
    id: '3',
    title: 'Frontend Team Lead',
    company: 'InnovateLab',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$140k - $180k',
    description: 'Lead a team of frontend developers in building next-generation web applications. You\'ll be responsible for architecture decisions, code reviews, and mentoring junior developers.',
    requirements: [
      '7+ years of frontend development experience',
      '2+ years of team leadership experience',
      'Expert knowledge of React and related technologies',
      'Experience with design systems and component libraries',
      'Strong communication and mentoring skills'
    ],
    postedDate: '3 days ago'
  }
]

export const currentUser: User = {
  id: 'current',
  name: 'John Doe',
  title: 'Senior Software Engineer',
  company: 'NavIN Corp',
  location: 'San Francisco, CA',
  connections: 1234,
  avatar: 'JD'
}
