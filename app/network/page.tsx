'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Search, UserPlus, Check, X, Clock, Users, UserCheck, UserX, Filter, MapPin, Building, Award, User, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Connection {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar: string
    title: string
    location: string
  }
  connectedAt: string
}

interface ConnectionRequest {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar: string
    title: string
    location: string
  }
  requestedAt: string
  type: 'received' | 'sent'
}

export default function NetworkPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent' | 'browse'>('connections')

  useEffect(() => {
    loadNetworkData()
  }, [])

  const loadNetworkData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setConnections(data.data.connections)
        setPendingRequests(data.data.pendingRequests)
        setSentRequests(data.data.sentRequests)
      }
    } catch (error) {
      console.error('Error loading network data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch(`/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (data.success) {
        loadNetworkData() // Reload data
      } else {
        alert(data.error || 'Failed to update connection')
      }
    } catch (error) {
      console.error('Error updating connection:', error)
      alert('Failed to update connection')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-20 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">My Network</h1>
          <p className="text-text-muted">Manage your professional connections and discover new opportunities</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center border-b border-border">
            {[
              { id: 'connections', label: 'Connections', count: connections.length, icon: Users },
              { id: 'requests', label: 'Pending Requests', count: pendingRequests.length, icon: Clock },
              { id: 'sent', label: 'Sent Requests', count: sentRequests.length, icon: UserCheck },
              { id: 'browse', label: 'Browse Users', count: 0, icon: UserX },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 relative rounded-xl ${
                    activeTab === tab.id
                      ? 'text-primary bg-primary/5 shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-secondary/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-text-muted'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-[3rem] bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.05)'
          }}
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/10 p-12 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-2 border-white/30 border-t-primary rounded-full mx-auto mb-6"
              ></motion.div>
              <p className="text-text-muted text-lg">Loading network...</p>
            </motion.div>
          ) : activeTab === 'connections' ? (
            <ConnectionsTab connections={connections} />
          ) : activeTab === 'requests' ? (
            <RequestsTab requests={pendingRequests} onAction={handleConnectionAction} />
          ) : activeTab === 'sent' ? (
            <SentRequestsTab requests={sentRequests} />
          ) : (
            <BrowseUsersTab />
          )}
        </motion.div>
      </div>
    </div>
  )
}

function ConnectionsTab({ connections }: { connections: Connection[] }) {
  if (connections.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
        <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No connections yet</h3>
        <p className="text-text-muted">Start building your professional network by connecting with others</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {connections.map((connection, index) => (
        <motion.div
          key={connection.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.08,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          whileHover={{
            scale: 1.03,
            y: -4,
            transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
          }}
          whileTap={{ scale: 0.98 }}
          className="group bg-gradient-to-br from-card via-card/80 to-card/60 rounded-3xl shadow-lg border border-border/50 p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Floating particles effect */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-accent/30 rounded-full animate-pulse delay-1000" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {connection.user.avatar ? (
                  <img
                    src={connection.user.avatar}
                    alt={connection.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  connection.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{connection.user.name}</h3>
                <p className="text-sm text-text-muted">{connection.user.title}</p>
                {connection.user.location && (
                  <p className="text-xs text-text-muted">{connection.user.location}</p>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-text-muted">
              <p>Connected</p>
              <p>{new Date(connection.connectedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function RequestsTab({ requests, onAction }: { requests: ConnectionRequest[], onAction: (id: string, action: 'accept' | 'reject') => void }) {
  if (requests.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
        <Clock className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No pending requests</h3>
        <p className="text-text-muted">You have no connection requests waiting for response</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft border border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {request.user.avatar ? (
                  <img
                    src={request.user.avatar}
                    alt={request.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  request.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{request.user.name}</h3>
                <p className="text-sm text-text-muted">{request.user.title}</p>
                {request.user.location && (
                  <p className="text-xs text-text-muted">{request.user.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => onAction(request.id, 'accept')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </motion.button>
              <motion.button
                onClick={() => onAction(request.id, 'reject')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-2xl hover:bg-secondary transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function SentRequestsTab({ requests }: { requests: ConnectionRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
        <UserCheck className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No sent requests</h3>
        <p className="text-text-muted">You haven't sent any connection requests yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft border border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {request.user.avatar ? (
                  <img
                    src={request.user.avatar}
                    alt={request.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  request.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{request.user.name}</h3>
                <p className="text-sm text-text-muted">{request.user.title}</p>
                {request.user.location && (
                  <p className="text-xs text-text-muted">{request.user.location}</p>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-text-muted">
              <p>Sent</p>
              <p>{new Date(request.requestedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function BrowseUsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [filters, setFilters] = useState({
    location: '',
    company: '',
    skills: ''
  })

  useEffect(() => {
    loadUsers()
    loadSuggestedUsers()
  }, [])

  useEffect(() => {
    // Debounced search effect
    const timeoutId = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/network/browse', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        return
      }

      const response = await fetch('/api/network/browse?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setSuggestedUsers(data.data)
      }
    } catch (error) {
      console.error('Error loading suggested users:', error)
    }
  }

  const performSearch = async (page = 1) => {
    const query = searchQuery.trim()
    const hasFilters = filters.location.trim() || filters.company.trim() || filters.skills.trim()

    if (!query && !hasFilters) {
      setSearchResults([])
      setTotalResults(0)
      setHasMoreResults(false)
      return
    }

    try {
      setIsSearching(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setIsSearching(false)
        return
      }

      const limit = 10
      const offset = (page - 1) * limit

      // Build search query with filters
      let searchUrl = `/api/search?type=users&excludeConnected=true&limit=${limit}&offset=${offset}`
      if (query) {
        searchUrl += `&q=${encodeURIComponent(query)}`
      }
      if (filters.location.trim()) {
        searchUrl += `&location=${encodeURIComponent(filters.location)}`
      }
      if (filters.company.trim()) {
        searchUrl += `&company=${encodeURIComponent(filters.company)}`
      }
      if (filters.skills.trim()) {
        searchUrl += `&skills=${encodeURIComponent(filters.skills)}`
      }

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setSearchResults(data.data.users || [])
        } else {
          setSearchResults(prev => [...prev, ...(data.data.users || [])])
        }
        setTotalResults(data.data.total || 0)
        setHasMoreResults((data.data.users || []).length === limit)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleConnect = async (targetUserId: string, connectionType = 'PROFESSIONAL') => {
    try {
      setConnectingUsers(prev => new Set(prev).add(targetUserId))

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: targetUserId,
          connectionType,
          message: `I'd like to connect with you on NavIN`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update the user status in both lists
        setUsers(prev => prev.map((user: any) =>
          user.id === targetUserId
            ? { ...user, connectionStatus: 'pending' }
            : user
        ))
        setSearchResults(prev => prev.map((user: any) =>
          user.id === targetUserId
            ? { ...user, connectionStatus: 'pending' }
            : user
        ))
        toast.success('Connection request sent!')
      } else {
        toast.error(data.error || 'Failed to send connection request')
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('Failed to send connection request')
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(targetUserId)
        return newSet
      })
    }
  }

  // Show search results if searching, otherwise show all users
  const displayUsers = searchQuery.trim() ? searchResults : users

  if (loading) {
    return (
      <div className="bg-card/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/10 p-12 text-center">
        <div className="animate-spin w-10 h-10 border-2 border-white/30 border-t-primary rounded-full mx-auto mb-6"></div>
        <p className="text-text-muted text-lg">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-sm rounded-[2rem] shadow-lg border border-border/60 p-6 hover:shadow-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        }}
      >
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.1, x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          </motion.div>
          <motion.input
            type="text"
            placeholder="Search for people by name, title, company, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {searchQuery.trim() && (
          <p className="text-sm text-text-muted mt-2">
            {isSearching ? 'Searching...' : `Found ${displayUsers.length} result${displayUsers.length !== 1 ? 's' : ''} for "${searchQuery}"`}
          </p>
        )}

        {/* Filter Toggle */}
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 mt-3 px-4 py-2 text-sm text-primary bg-primary/5 hover:bg-primary/15 rounded-[1.5rem] transition-all duration-300 shadow-sm hover:shadow-lg border border-primary/20 hover:border-primary/30"
        >
          <Filter className="w-4 h-4" />
          <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
        </motion.button>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-4 p-4 bg-gradient-to-br from-secondary/90 to-secondary/70 backdrop-blur-sm rounded-[1.5rem] space-y-3 border border-border/60 shadow-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter by company..."
                  value={filters.company}
                  onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter by skills..."
                  value={filters.skills}
                  onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            </div>
            {(filters.location || filters.company || filters.skills) && (
              <p className="text-xs text-text-muted">
                Filtering by: {[
                  filters.location && `location: "${filters.location}"`,
                  filters.company && `company: "${filters.company}"`,
                  filters.skills && `skills: "${filters.skills}"`
                ].filter(Boolean).join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      {displayUsers.length === 0 ? (
        <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
          <UserX className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {searchQuery.trim() ? 'No users found' : 'No users available'}
          </h3>
          <p className="text-text-muted">
            {searchQuery.trim()
              ? `Try adjusting your search terms or browse all users`
              : 'Be the first to join the network!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{
                scale: 1.03,
                y: -6,
                transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
              }}
              whileTap={{ scale: 0.98 }}
              className="group bg-gradient-to-br from-card/70 via-card/50 to-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border/60 p-6 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.05)'
              }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/3 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-300" />
              <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-accent/25 rounded-full animate-pulse delay-700" />
              <div className="absolute top-1/2 right-2 w-1 h-1 bg-primary/15 rounded-full animate-pulse delay-1000" />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{user.name}</h3>
                    <p className="text-sm text-text-muted">{user.title}</p>
                    {user.location && (
                      <p className="text-xs text-text-muted">{user.location}</p>
                    )}
                    {user.bio && (
                      <p className="text-xs text-text-muted mt-1 max-w-md truncate">{user.bio}</p>
                    )}
                    {user.mutualConnections > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="w-3 h-3 text-text-muted" />
                        <p className="text-xs text-text-muted">
                          {user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.connectionStatus === 'pending' ? (
                    <div className="flex items-center space-x-2 px-4 py-2 text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>Request Sent</span>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => handleConnect(user.id)}
                      disabled={connectingUsers.has(user.id)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 border border-primary/20 hover:border-primary/30"
                    >
                      {connectingUsers.has(user.id) ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>{connectingUsers.has(user.id) ? 'Connecting...' : 'Connect'}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {displayUsers.length > 0 && searchQuery.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8 flex items-center justify-between"
        >
          <div className="text-sm text-text-muted">
            Showing {displayUsers.length} of {totalResults} results
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => performSearch(currentPage - 1)}
              disabled={currentPage === 1 || isSearching}
              whileHover={{ scale: currentPage === 1 || isSearching ? 1 : 1.05, y: currentPage === 1 || isSearching ? 0 : -1 }}
              whileTap={{ scale: currentPage === 1 || isSearching ? 1 : 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-border bg-card/50 hover:bg-card rounded-[1.5rem] hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 text-sm bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-[1.5rem] shadow-lg border border-primary/20"
            >
              Page {currentPage}
            </motion.div>

            <motion.button
              onClick={() => performSearch(currentPage + 1)}
              disabled={!hasMoreResults || isSearching}
              whileHover={{ scale: !hasMoreResults || isSearching ? 1 : 1.05, y: !hasMoreResults || isSearching ? 0 : -1 }}
              whileTap={{ scale: !hasMoreResults || isSearching ? 1 : 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 text-sm border border-border bg-card/50 hover:bg-card rounded-[1.5rem] hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Suggested Connections */}
      {!searchQuery.trim() && suggestedUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text mb-4">Suggested Connections</h3>
          <div className="space-y-4">
            {suggestedUsers.slice(0, 5).map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl shadow-soft border border-border p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{user.name}</h3>
                      <p className="text-sm text-text-muted">{user.title}</p>
                      {user.location && (
                        <p className="text-xs text-text-muted">{user.location}</p>
                      )}
                      {user.mutualConnections > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <User className="w-3 h-3 text-text-muted" />
                          <p className="text-xs text-text-muted">
                            {user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.connectionStatus === 'pending' ? (
                      <div className="flex items-center space-x-2 px-4 py-2 text-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>Request Sent</span>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => handleConnect(user.id)}
                        disabled={connectingUsers.has(user.id)}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {connectingUsers.has(user.id) ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        <span>{connectingUsers.has(user.id) ? 'Connecting...' : 'Connect'}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
