'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Link, Search, UserCheck, UserX, UserMinus } from 'lucide-react'
import { motion } from 'framer-motion'

interface Connection {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar: string
    title: string
    company: string
  }
  status: string
  connectionType: string
  strength: number
  mutualConnections: number
  degree: number
}

interface ConnectionTiersProps {
  userId: string
  currentUserId: string
  isCurrentUser?: boolean
}

export const ConnectionTiers: React.FC<ConnectionTiersProps> = ({
  userId,
  currentUserId,
  isCurrentUser = false
}) => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'1st' | '2nd' | '3rd' | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConnections()
  }, [userId])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const response = await fetch(`/api/connections?userId=${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Transform data to include degree information
        const transformedConnections = data.data.map((conn: any) => ({
          ...conn,
          degree: conn.mutualConnections > 0 ? 2 : 1
        }))
        setConnections(transformedConnections)
      } else {
        setError(data.error || 'Failed to fetch connections')
        setConnections([])
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
      setError('Failed to fetch connections. Please try again.')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }

  const filteredConnections = connections.filter(connection => {
    // Filter by search query
    const matchesSearch = connection.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         connection.user.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         connection.user.company.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by active tab
    let matchesTab = true
    if (activeTab === '1st') {
      matchesTab = connection.degree === 1
    } else if (activeTab === '2nd') {
      matchesTab = connection.degree === 2
    } else if (activeTab === '3rd') {
      matchesTab = connection.degree === 3
    }

    return matchesSearch && matchesTab
  })

  const getConnectionStats = () => {
    const firstDegree = connections.filter(c => c.degree === 1).length
    const secondDegree = connections.filter(c => c.degree === 2).length
    const thirdDegree = connections.filter(c => c.degree === 3).length

    return {
      firstDegree,
      secondDegree,
      thirdDegree,
      total: connections.length
    }
  }

  const stats = getConnectionStats()

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-secondary rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-secondary rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/3"></div>
                <div className="h-2 bg-secondary rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchConnections}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Professional Network
          </h3>
          <div className="text-sm text-text-muted flex items-center">
            <Link className="w-4 h-4 mr-1" />
            {stats.total} {stats.total === 1 ? 'connection' : 'connections'}
          </div>
        </div>

        {/* Connection Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">{stats.firstDegree}</div>
            <div className="text-xs text-text-muted uppercase tracking-wide">1st Degree</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.secondDegree}</div>
            <div className="text-xs text-text-muted uppercase tracking-wide">2nd Degree</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.thirdDegree}</div>
            <div className="text-xs text-text-muted uppercase tracking-wide">3rd Degree</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-secondary'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('1st')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              activeTab === '1st'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-secondary'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            1st Degree ({stats.firstDegree})
          </button>
          <button
            onClick={() => setActiveTab('2nd')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              activeTab === '2nd'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-secondary'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            2nd Degree ({stats.secondDegree})
          </button>
          <button
            onClick={() => setActiveTab('3rd')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              activeTab === '3rd'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-secondary'
            }`}
          >
            <UserMinus className="w-4 h-4 mr-2" />
            3rd Degree ({stats.thirdDegree})
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {filteredConnections.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-text-muted" />
            </div>
            <h4 className="font-semibold text-text mb-2">No connections found</h4>
            <p className="text-text-muted text-sm">
              {isCurrentUser
                ? 'You haven\'t connected with anyone yet. Start building your network!'
                : 'This user hasn\'t connected with anyone yet.'}
            </p>
            {isCurrentUser && (
              <button
                onClick={() => window.location.href = '/network'}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Find Connections
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConnections.map((connection) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {connection.user.avatar ? (
                      <img
                        src={connection.user.avatar}
                        alt={connection.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserCheck className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{connection.user.name}</p>
                    <p className="text-xs text-text-muted truncate">{connection.user.title}</p>
                    <p className="text-xs text-text-muted truncate">{connection.user.company}</p>

                    <div className="flex items-center space-x-2 mt-1">
                      {connection.degree === 1 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">1st</span>
                      )}
                      {connection.degree === 2 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">2nd</span>
                      )}
                      {connection.degree === 3 && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">3rd</span>
                      )}

                      {connection.mutualConnections > 0 && (
                        <span className="text-xs text-text-muted flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {connection.mutualConnections} mutual
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {connection.status === 'PENDING' && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  {connection.status === 'ACCEPTED' && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Connected
                    </span>
                  )}

                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <UserCheck className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}