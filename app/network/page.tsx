'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Search, UserPlus, Check, X, Clock, Users, UserCheck, UserX } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent'>('connections')

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
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text'
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
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {loading ? (
            <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-text-muted">Loading network...</p>
            </div>
          ) : activeTab === 'connections' ? (
            <ConnectionsTab connections={connections} />
          ) : activeTab === 'requests' ? (
            <RequestsTab requests={pendingRequests} onAction={handleConnectionAction} />
          ) : (
            <SentRequestsTab requests={sentRequests} />
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
    <div className="space-y-4">
      {connections.map((connection) => (
        <motion.div
          key={connection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-soft border border-border p-6"
        >
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
              <button
                onClick={() => onAction(request.id, 'accept')}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => onAction(request.id, 'reject')}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
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
