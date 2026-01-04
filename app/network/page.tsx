'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { Search, UserPlus, Check, X, Clock, Users, UserCheck, UserX, Filter, MapPin, Building, Award, User, ChevronLeft, ChevronRight, Loader, GraduationCap, Briefcase, Building2, Languages } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useSocket } from '@/components/SocketProvider'

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
      <div className="max-w-6xl mx-auto pt-6 px-4">
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
          className="rounded-3xl bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden"
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
              className="bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-12 text-center"
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
  const { respondConnectionRequest, isServerless } = useSocket()
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
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [filters, setFilters] = useState({
    location: '',
    company: '',
    skills: '',
    institution: '',
    title: '',
    industry: '',
    language: ''
  })

  const { activeUsers, sendConnectionRequest, onConnectionRequestSent, onConnectionRequestReceived, onConnectionStatusChanged, isServerless } = useSocket()

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter(f => f.trim()).length
    setActiveFilterCount(count)
  }, [filters])

  useEffect(() => {
    loadUsers()
    loadSuggestedUsers()

    // Set up real-time listeners for connection events
    const unsubscribeSent = onConnectionRequestSent((data: any) => {
      setUsers(prev => prev.map((user: any) => (user.id === data.receiverId ? { ...user, connectionStatus: 'pending' } : user)))
      setSearchResults(prev => prev.map((user: any) => (user.id === data.receiverId ? { ...user, connectionStatus: 'pending' } : user)))
    })

    const unsubscribeReceived = onConnectionRequestReceived((data: any) => {
      toast.success(`New connection request from ${data.user.name}`)
    })

    const unsubscribeStatusChanged = onConnectionStatusChanged((data: any) => {
      setUsers(prev => prev.map((user: any) => (user.id === data.targetUserId ? { ...user, connectionStatus: data.status } : user)))
      setSearchResults(prev => prev.map((user: any) => (user.id === data.targetUserId ? { ...user, connectionStatus: data.status } : user)))
    })

    return () => {
      if (unsubscribeSent) unsubscribeSent()
      if (unsubscribeReceived) unsubscribeReceived()
      if (unsubscribeStatusChanged) unsubscribeStatusChanged()
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => performSearch(), 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/network/browse')
      const data = await response.json()
      if (data.success) setUsers(data.data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return
      const response = await fetch('/api/network/browse?limit=5', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      if (data.success) setSuggestedUsers(data.data)
    } catch (error) {
      console.error('Error loading suggested users:', error)
    }
  }

  const performSearch = async (page = 1) => {
    const query = searchQuery.trim()
    const hasFilters = filters.location.trim() || filters.company.trim() || filters.skills.trim() || filters.institution.trim() || filters.title.trim() || filters.industry.trim() || filters.language.trim()

    if (!query && !hasFilters) {
      setSearchResults([])
      setTotalResults(0)
      setHasMoreResults(false)
      return
    }

    try {
      setIsSearching(true)
      const limit = 10
      const offset = (page - 1) * limit

      let searchUrl = `/api/search?type=users&excludeConnected=true&limit=${limit}&offset=${offset}`
      if (query) searchUrl += `&q=${encodeURIComponent(query)}`
      Object.entries(filters).forEach(([k, v]) => { if ((v as string).trim()) searchUrl += `&${k}=${encodeURIComponent((v as string).trim())}` })

      const response = await fetch(searchUrl)
      const data = await response.json()
      if (data.success) {
        setSearchResults(page === 1 ? (data.data.users || []) : prev => [...(prev as any[]), ...(data.data.users || [])])
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
      if (!isServerless) {
        sendConnectionRequest(targetUserId, connectionType, `I'd like to connect with you on NavIN`)
        toast.success('Connection request sent!')
        setConnectingUsers(prev => { const newSet = new Set(prev); newSet.delete(targetUserId); return newSet })
        return
      }

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) { alert('Authentication required'); return }

      const response = await fetch('/api/connections/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: targetUserId, connectionType, message: `I'd like to connect with you on NavIN` })
      })

      const data = await response.json()
      if (data.success) {
        setUsers(prev => prev.map((u: any) => u.id === targetUserId ? { ...u, connectionStatus: 'pending' } : u))
        setSearchResults(prev => prev.map((u: any) => u.id === targetUserId ? { ...u, connectionStatus: 'pending' } : u))
        toast.success('Connection request sent!')
      } else {
        toast.error(data.error || 'Failed to send connection request')
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('Failed to send connection request')
    } finally {
      setConnectingUsers(prev => { const newSet = new Set(prev); newSet.delete(targetUserId); return newSet })
    }
  }

  const displayUsers = searchQuery.trim() ? searchResults : users

  if (loading) {
    return (
      <div className="bg-card/90 rounded-2xl p-10 text-center shadow-lg border border-border/40">
        <div className="animate-spin w-10 h-10 border-2 border-white/30 border-t-primary rounded-full mx-auto mb-4"></div>
        <p className="text-text-muted">Loading users...</p>
      </div>
    )
  }

  const UserCard = ({ user, index }: { user: any, index: number }) => (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#1a1b1e] to-[#111214] border border-[#2a2b2e]/30 shadow-md group"
    >
      <div className="flex items-start md:items-center gap-4 flex-1">
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
          {activeUsers.includes(user.id) && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-[#1a1b1e] rounded-full"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/in/${user.username}`} className="block">
              <h4 className="font-semibold text-text text-base truncate hover:text-emerald-400 transition-colors group-hover:text-emerald-400">
                {user.name}
              </h4>
            </Link>
            {user.verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {user.title && (
              <div className="flex items-center gap-1 text-text-muted">
                <Briefcase className="w-3 h-3" />
                <span>{user.title}</span>
              </div>
            )}
            {user.company && (
              <div className="flex items-center gap-1 text-text-muted">
                <Building2 className="w-3 h-3" />
                <span>{user.company}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-1 text-text-muted">
                <MapPin className="w-3 h-3" />
                <span>{user.location}</span>
              </div>
            )}
          </div>
          {user.bio && (
            <p className="text-xs text-text-muted mt-2 line-clamp-2 max-w-[50ch]">
              {user.bio}
            </p>
          )}
          {user.skills && Array.isArray(user.skills) && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {user.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                <span key={skillIndex} className="px-2 py-1 rounded-full bg-[#2a2b2e] text-text-muted text-xs">
                  {skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="px-2 py-1 rounded-full bg-[#2a2b2e] text-text-muted text-xs">
                  +{user.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
        {user.connectionStatus === 'pending' ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2b2e] text-emerald-400 text-sm font-medium shadow-sm">
            <Clock className="w-4 h-4" />
            <span>Request Sent</span>
          </div>
        ) : (
          <motion.button
            onClick={() => handleConnect(user.id)}
            disabled={connectingUsers.has(user.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-[#2a2b2e] text-text-muted flex items-center justify-center hover:bg-[#3a3b3e] hover:text-white transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Modern Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-br from-[#1a1b1e] to-[#0f1012] p-6 md:p-8 border border-[#2a2b2e] shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-primary" />
              <input
                aria-label="Search users"
                type="text"
                placeholder="Search professionals by name, title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#111214]/80 border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-text placeholder-text-muted transition-all duration-300"
              />
              {searchQuery.trim() && (
                <motion.button
                  onClick={() => setSearchQuery('')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
            {searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-text-muted mt-3 flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border border-text-muted border-t-transparent rounded-full"
                    />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-emerald-400">{displayUsers.length}</span>
                    <span>result{displayUsers.length !== 1 ? 's' : ''} found for "{searchQuery}"</span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                showFilters ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1a1b1e] text-emerald-400 border border-emerald-600 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-1 text-xs rounded-full bg-emerald-500 text-white ml-2">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: showFilters ? 1 : 0, height: showFilters ? 'auto' : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="overflow-hidden mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-medium">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                placeholder="City, State, or Country"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 rounded-lg bg-[#111214] border border-[#2a2b2e] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-medium">Company</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                placeholder="Company Name"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 rounded-lg bg-[#111214] border border-[#2a2b2e] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-medium">Skills</label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                placeholder="JavaScript, React, etc."
                value={filters.skills}
                onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 rounded-lg bg-[#111214] border border-[#2a2b2e] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-medium">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                placeholder="Software Engineer, Designer"
                value={filters.title}
                onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 rounded-lg bg-[#111214] border border-[#2a2b2e] text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Results Section */}
      {displayUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#1a1b1e] to-[#0f1012] rounded-2xl p-12 text-center border border-[#2a2b2e]/50 shadow-xl"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <UserX className="w-16 h-16 text-text-muted mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold text-text mb-2">
            {searchQuery.trim() ? 'No professionals found' : 'Explore the Network'}
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            {searchQuery.trim() ? 'Try adjusting your search terms or filters to find more professionals' : 'Start connecting with professionals in your industry'}
          </p>
          {!searchQuery.trim() && (
            <motion.button
              onClick={() => loadUsers()}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Users className="w-5 h-5" />
              <span>Browse All Users</span>
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {displayUsers.map((u, i) => <UserCard key={u.id} user={u} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {displayUsers.length > 0 && searchQuery.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
        >
          <div className="text-sm text-text-muted">
            Showing <span className="font-semibold text-white">{displayUsers.length}</span> of <span className="font-semibold text-white">{totalResults}</span> results
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              disabled={currentPage === 1 || isSearching}
              onClick={() => performSearch(currentPage - 1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentPage === 1 || isSearching
                  ? 'bg-[#1a1b1e] text-text-muted cursor-not-allowed'
                  : 'bg-[#1a1b1e] text-white hover:bg-emerald-600 border border-emerald-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4 inline-block mr-1" />
              Previous
            </motion.button>
            <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium">
              Page {currentPage}
            </div>
            <motion.button
              disabled={!hasMoreResults || isSearching}
              onClick={() => performSearch(currentPage + 1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                !hasMoreResults || isSearching
                  ? 'bg-[#1a1b1e] text-text-muted cursor-not-allowed'
                  : 'bg-[#1a1b1e] text-white hover:bg-emerald-600 border border-emerald-600'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 inline-block ml-1" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Suggested Connections */}
      {!searchQuery.trim() && suggestedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span>Suggested Connections</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedUsers.slice(0, 6).map((user, userIndex) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * userIndex }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-[#1a1b1e] to-[#111214] border border-[#2a2b2e]/30 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold overflow-hidden shadow-md">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                    {activeUsers.includes(user.id) && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-[#1a1b1e] rounded-full"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/in/${user.username}`} className="block">
                      <h4 className="font-semibold text-text text-sm truncate hover:text-emerald-400 transition-colors">
                        {user.name}
                      </h4>
                    </Link>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {user.title || 'Professional'}{user.location ? ` • ${user.location}` : ''}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-text-muted truncate mt-1 max-w-[30ch]">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {user.connectionStatus === 'pending' ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#2a2b2e] text-emerald-400 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Request Sent</span>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => handleConnect(user.id)}
                      disabled={connectingUsers.has(user.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
