'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Home, Users, Briefcase, MessageCircle, Bell, ChevronDown, Menu, User, Settings, LogOut, LogIn, UserPlus, ClipboardList, Sparkles, X, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useUser, useAuth } from '@clerk/nextjs'


export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { getToken } = useAuth()

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch()
      } else {
        setSearchResults(null)
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const token = await getToken()
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all&limit=10`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data)
        setShowResults(true)
      } else {
        console.error('Search API error:', data.error)
        setSearchResults(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
      // Could add a toast notification here for user feedback
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = () => {
    setShowResults(false)
    setSearchQuery('')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-lg shadow-xl border-b border-border z-50"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Search */}
        <div className="flex items-center space-x-6 flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold text-text">NavIN</span>
          </Link>

          <div className="hidden md:flex items-center relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-text-muted dark:text-dark-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Search for people, jobs, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 ios-input text-sm placeholder:text-text-muted text-text focus:bg-surface transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setShowResults(false)
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="w-4 h-4 text-text-muted dark:text-dark-text-muted hover:text-text dark:hover:text-dark-text" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showResults && searchResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 ios-card z-50 max-h-96 overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-text-muted dark:text-dark-text-muted">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <SearchResults results={searchResults} onResultClick={handleResultClick} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="hidden lg:flex items-center space-x-2">
          <NavIcon icon={Home} label="Home" href="/feed" />
          <NavIcon icon={Users} label="Network" href="/network" />
          <NavIcon icon={Briefcase} label="Jobs" href="/jobs" />
          <NavIcon icon={Crown} label="Hiring" href="/hiring" />
          <NavIcon icon={ClipboardList} label="Applications" href="/applications" />
          <NavIcon icon={MessageCircle} label="Messages" href="/messages" />
          <NavIcon icon={Bell} label="Notifications" href="/notifications" />


          {/* Profile Menu */}
          <div className="ml-4 pl-4 border-l border-border">
            <ProfileMenu />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2 hover:bg-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-text dark:text-dark-text" />
        </button>
      </div>
    </motion.nav>
  )
}

function NavIcon({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link
      href={href}
      className="nav-link flex flex-col items-center justify-center cursor-pointer px-3 py-2 rounded-lg group glow-on-hover min-w-[60px]"
    >
      <Icon className="w-5 h-5 text-text dark:text-dark-text group-hover:scale-110 group-hover:text-primary transition-all duration-300 mb-1" />
      <span className="text-xs font-medium text-text dark:text-dark-text group-hover:text-primary transition-colors duration-300 leading-tight text-center">{label}</span>
    </Link>
  )
}



function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Show login/signup buttons when not authenticated
  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/sign-in"
          className="flex items-center space-x-2 px-4 py-2 text-text hover:text-primary transition-colors glow-on-hover"
        >
          <LogIn className="w-4 h-4" />
          <span className="text-sm font-medium">Sign In</span>
        </Link>
        <Link
          href="/sign-up"
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors animate-shimmer"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Up</span>
        </Link>
      </div>
    )
  }

  // Show profile dropdown when authenticated
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors"
      >
        <div className="w-8 h-8 ios-avatar flex items-center justify-center text-white font-semibold">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.fullName?.charAt(0).toUpperCase() || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-text dark:text-dark-text" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-56 ios-card z-50 shadow-xl"
            style={{
              minWidth: '220px',
              maxWidth: '280px',
              wordWrap: 'break-word'
            }}
          >
            <div className="p-3 border-b border-border dark:border-dark-border">
              <p className="font-medium text-text dark:text-dark-text">{user?.fullName || 'User'}</p>
              <p className="text-sm text-text-muted dark:text-dark-text-muted">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>

            <div className="py-2">
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-2 text-text dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">View Profile</span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center space-x-3 px-4 py-2 text-text dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-2 text-text dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-secondary transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SearchResults({ results, onResultClick }: { results: any, onResultClick: () => void }) {
  const renderUserResult = (user: any) => (
    <Link
      key={`user-${user.id}`}
      href={`/in/${user.username || user.id}`}
      onClick={onResultClick}
      className="flex items-center space-x-3 p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 rounded-2xl mx-2"
    >
      <div className="w-8 h-8 ios-avatar flex items-center justify-center text-white font-semibold text-sm">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          user.name?.charAt(0).toUpperCase() || 'U'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate">{user.name || 'Unknown User'}</p>
        <p className="text-sm text-text-muted truncate">{user.title || 'NavIN User'}</p>
        {user.company && (
          <p className="text-xs text-text-muted truncate">{user.company}</p>
        )}
      </div>
      <div className="ios-badge">
        User
      </div>
    </Link>
  )

  const renderJobResult = (job: any) => (
    <Link
      key={`job-${job.id}`}
      href={`/jobs/${job.id}`}
      onClick={onResultClick}
      className="flex items-center space-x-3 p-3 hover:bg-secondary dark:hover:bg-dark-secondary transition-colors"
    >
      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
        J
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text dark:text-dark-text truncate">{job.title}</p>
        <p className="text-sm text-text-muted dark:text-dark-text-muted truncate">{job.companyName}</p>
        <p className="text-xs text-text-muted dark:text-dark-text-muted truncate">{job.location}</p>
      </div>
      <div className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
        Job
      </div>
    </Link>
  )

  const renderPostResult = (post: any) => (
    <Link
      key={`post-${post.id}`}
      href={`/posts/${post.id}`}
      onClick={onResultClick}
      className="flex items-center space-x-3 p-3 hover:bg-secondary dark:hover:bg-dark-secondary transition-colors"
    >
      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
        P
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text dark:text-dark-text line-clamp-2">{post.content}</p>
        <p className="text-xs text-text-muted dark:text-dark-text-muted">
          by {post.author?.name || 'Unknown'}
        </p>
      </div>
      <div className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
        Post
      </div>
    </Link>
  )

  const renderCompanyResult = (company: any) => (
    <Link
      key={`company-${company.id}`}
      href={`/companies/${company.id}`}
      onClick={onResultClick}
      className="flex items-center space-x-3 p-3 hover:bg-secondary dark:hover:bg-dark-secondary transition-colors"
    >
      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
        C
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text dark:text-dark-text truncate">{company.name}</p>
        <p className="text-sm text-text-muted dark:text-dark-text-muted truncate">{company.industry || 'Company'}</p>
        <p className="text-xs text-text-muted dark:text-dark-text-muted truncate">{company.location}</p>
      </div>
      <div className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded">
        Company
      </div>
    </Link>
  )

  if (results.total === 0) {
    return (
      <div className="p-4 text-center text-text-muted dark:text-dark-text-muted">
        No results found for "{results.query}"
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Users Section */}
      {results.users && results.users.length > 0 && (
        <div className="border-b border-border dark:border-dark-border">
          <div className="px-3 py-2 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
            Users ({results.users.length})
          </div>
          {results.users.slice(0, 3).map(renderUserResult)}
        </div>
      )}

      {/* Jobs Section */}
      {results.jobs && results.jobs.length > 0 && (
        <div className="border-b border-border dark:border-dark-border">
          <div className="px-3 py-2 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
            Jobs ({results.jobs.length})
          </div>
          {results.jobs.slice(0, 3).map(renderJobResult)}
        </div>
      )}

      {/* Posts Section */}
      {results.posts && results.posts.length > 0 && (
        <div className="border-b border-border dark:border-dark-border">
          <div className="px-3 py-2 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
            Posts ({results.posts.length})
          </div>
          {results.posts.slice(0, 3).map(renderPostResult)}
        </div>
      )}

      {/* Companies Section */}
      {results.companies && results.companies.length > 0 && (
        <div className="border-b border-border dark:border-dark-border">
          <div className="px-3 py-2 text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wide">
            Companies ({results.companies.length})
          </div>
          {results.companies.slice(0, 3).map(renderCompanyResult)}
        </div>
      )}

      {/* Show More Link */}
      {results.total > 9 && (
        <div className="p-3 text-center">
          <Link
            href={`/search?q=${encodeURIComponent(results.query)}`}
            onClick={onResultClick}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View all {results.total} results
          </Link>
        </div>
      )}
    </div>
  )
}
