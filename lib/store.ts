import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  username: string | null
  bio: string | null
  title: string | null
  company: string | null
  location: string | null
  skills: string[]
}

interface Post {
  id: string
  content: string
  image?: string | null
  video?: string | null
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: User
  likes: Like[]
  comments: Comment[]
  shares: Share[]
  _count: {
    likes: number
    comments: number
    shares: number
  }
}

interface Like {
  id: string
  userId: string
  postId: string
}

interface Comment {
  id: string
  content: string
  userId: string
  postId: string
  createdAt: Date
  user: User
}

interface Share {
  id: string
  userId: string
  postId: string
}

interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: string
  salaryMin?: number | null
  salaryMax?: number | null
  requirements: string[]
  authorId: string
  isActive: boolean
  createdAt: Date
  author: User
}

interface Connection {
  id: string
  senderId: string
  receiverId: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
  sender: User
  receiver: User
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  user: User
}

interface AppState {
  // User state
  currentUser: User | null
  users: User[]
  connections: Connection[]

  // Posts state
  posts: Post[]
  feedLoading: boolean
  hasMorePosts: boolean

  // Jobs state
  jobs: Job[]
  jobsLoading: boolean

  // UI state
  sidebarOpen: boolean
  activeModal: string | null

  // Notifications
  notifications: Notification[]
  unreadCount: number

  // Actions
  setCurrentUser: (user: User | null) => void
  setUsers: (users: User[]) => void
  setConnections: (connections: Connection[]) => void
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  deletePost: (postId: string) => void
  setFeedLoading: (loading: boolean) => void
  setHasMorePosts: (hasMore: boolean) => void
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  setJobsLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationAsRead: (notificationId: string) => void
  markAllNotificationsAsRead: () => void
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [],
      connections: [],
      posts: [],
      feedLoading: false,
      hasMorePosts: true,
      jobs: [],
      jobsLoading: false,
      sidebarOpen: false,
      activeModal: null,
      notifications: [],
      unreadCount: 0,

      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      setUsers: (users) => set({ users }),
      setConnections: (connections) => set({ connections }),

      // Posts actions
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      updatePost: (postId, updates) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, ...updates } : post
          ),
        })),
      deletePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== postId),
        })),
      setFeedLoading: (loading) => set({ feedLoading: loading }),
      setHasMorePosts: (hasMore) => set({ hasMorePosts: hasMore }),

      // Jobs actions
      setJobs: (jobs) => set({ jobs }),
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      setJobsLoading: (loading) => set({ jobsLoading: loading }),

      // UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveModal: (modal) => set({ activeModal: modal }),

      // Notifications actions
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length
        set({ notifications, unreadCount })
      },
      addNotification: (notification) => {
        set((state) => {
          const newNotifications = [notification, ...state.notifications]
          const unreadCount = newNotifications.filter(n => !n.isRead).length
          return { notifications: newNotifications, unreadCount }
        })
      },
      markNotificationAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
          const unreadCount = notifications.filter(n => !n.isRead).length
          return { notifications, unreadCount }
        })
      },
      markAllNotificationsAsRead: () => {
        set((state) => {
          const notifications = state.notifications.map(n => ({ ...n, isRead: true }))
          return { notifications, unreadCount: 0 }
        })
      },
    }),
    { name: 'navin-store' }
  )
)
