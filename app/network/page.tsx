'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { Search, UserPlus, Check, X, Clock, Users, UserCheck, UserX, Filter, MapPin, Building, Award, User, ChevronLeft, ChevronRight, Loader, GraduationCap, Briefcase, Building2, Languages } from 'lucide-react'
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

function buildDemoConnections(): Connection[] {
  const names = ['Alex Johnson', 'Sam Lee', 'Jordan Smith', 'Taylor Doe', 'Riley Brown']
  return names.map((name, i) => ({
    id: `conn-demo-${i}`,
    user: {
      id: `user-demo-${i}`,
      name,
      username: name.toLowerCase().replace(/\s+/g, '-'),
      avatar: '',
      title: 'Product Designer',
      location: 'Remote',
    },
    connectedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  }))
}

function buildDemoRequests(): ConnectionRequest[] {
  const names = ['Morgan Wu', 'Casey Kim']
  return names.map((name, i) => ({
    id: `req-demo-${i}`,
    user: {
      id: `user-req-demo-${i}`,
      name,
      username: name.toLowerCase().replace(/\s+/g, '-'),
      avatar: '',
      title: 'Engineering Manager',
      location: 'San Francisco, CA',
    },
    requestedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    type: 'received',
  }))
}

export default function NetworkPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent' | 'browse'>('connections')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNetworkData()
  }, [])

  const loadNetworkData = async () => {
    setError(null)
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

    try {
      if (!token) {
        setConnections(buildDemoConnections())
        setPendingRequests([])
        setSentRequests([])
        setLoading(false)
        return
      }

      const response = await fetch('/api/connections', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error(`Network error ${response.status}`)

      const data = await response.json()

      if (data.success && data.data) {
        setConnections(data.data.connections || [])
        setPendingRequests(data.data.pendingRequests || [])
        setSentRequests(data.data.sentRequests || [])
      } else {
        throw new Error(data.error || 'Failed to load network data')
      }
    } catch (err: any) {
      console.error('Error loading network data:', err)
      setConnections(buildDemoConnections())
      setPendingRequests(buildDemoRequests())
      setSentRequests([])
      toast.error(err?.message || 'Using demo network data')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) { alert('Authentication required'); return }

      const response = await fetch(`/api/connections/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      if (data.success) {
        loadNetworkData()
        toast.success(`Request ${action}ed`)
      } else {
        toast.error(data.error || 'Failed to update connection')
      }
    } catch (error) {
      console.error('Error updating connection:', error)
      toast.error('Failed to update connection')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">My Network</h1>
          <p className="text-text-muted">Manage your professional connections and discover new opportunities</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex items-center border-b border-border">
            {[
              { id: 'connections', label: 'Connections', count: connections.length, icon: Users },
              { id: 'requests', label: 'Pending Requests', count: pendingRequests.length, icon: Clock },
              { id: 'sent', label: 'Sent Requests', count: sentRequests.length, icon: UserCheck },
              { id: 'browse', label: 'Browse Users', count: 0, icon: UserX },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 relative rounded-xl ${
                    activeTab === tab.id ? 'text-primary bg-primary/5 shadow-sm' : 'text-text-muted hover:text-text hover:bg-secondary/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-secondary text-text-muted'}`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-card border border-border shadow-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-10 h-10 border-2 border-white/30 border-t-primary rounded-full mx-auto mb-6"></div>
              <p className="text-text-muted text-lg">Loading network...</p>
            </div>
          ) : error && !connections.length ? (
            <div className="p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={loadNetworkData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Retry</button>
            </div>
          ) : activeTab === 'connections' ? (
            <ConnectionsTab connections={connections} />
          ) : activeTab === 'requests' ? (
            <RequestsTab requests={pendingRequests} onAction={handleConnectionAction} />
          ) : activeTab === 'sent' ? (
            <SentRequestsTab requests={sentRequests} />
          ) : (
            <BrowsePlaceholder />
          )}
        </motion.div>
      </div>
    </div>
  )
}

function ConnectionsTab({ connections }: { connections: Connection[] }) {
  if (connections.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No connections yet</h3>
        <p className="text-text-muted">Start building your professional network by connecting with others</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {connections.map((connection, index) => (
        <motion.div
          key={connection.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
          whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.3 } }}
          whileTap={{ scale: 0.98 }}
          className="group bg-card rounded-3xl shadow-lg border border-border p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {connection.user.avatar ? (
                  <img src={connection.user.avatar} alt={connection.user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  connection.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{connection.user.name}</h3>
                <p className="text-sm text-text-muted">{connection.user.title}</p>
                {connection.user.location && <p className="text-xs text-text-muted">{connection.user.location}</p>}
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
      <div className="p-12 text-center">
        <Clock className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No pending requests</h3>
        <p className="text-text-muted">You have no connection requests waiting for response</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {requests.map((request) => (
        <motion.div key={request.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-soft border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {request.user.avatar ? (
                  <img src={request.user.avatar} alt={request.user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  request.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{request.user.name}</h3>
                <p className="text-sm text-text-muted">{request.user.title}</p>
                {request.user.location && <p className="text-xs text-text-muted">{request.user.location}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onAction(request.id, 'accept')} className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all duration-200 shadow-md">
                <Check className="w-4 h-4" /><span>Accept</span>
              </button>
              <button onClick={() => onAction(request.id, 'reject')} className="flex items-center space-x-2 px-4 py-2 border border-border rounded-2xl hover:bg-secondary transition-all duration-200">
                <X className="w-4 h-4" /><span>Decline</span>
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
      <div className="p-12 text-center">
        <UserCheck className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No sent requests</h3>
        <p className="text-text-muted">You haven't sent any connection requests yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {requests.map((request) => (
        <motion.div key={request.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-soft border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {request.user.avatar ? (
                  <img src={request.user.avatar} alt={request.user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  request.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text">{request.user.name}</h3>
                <p className="text-sm text-text-muted">{request.user.title}</p>
                {request.user.location && <p className="text-xs text-text-muted">{request.user.location}</p>}
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

function BrowsePlaceholder() {
  return (
    <div className="p-12 text-center">
      <UserX className="w-16 h-16 text-text-muted mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text mb-2">Browse Users</h3>
      <p className="text-text-muted">User search and browse will appear here once connected.</p>
    </div>
  )
}