'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { ApplicationTracker } from '@/components/ApplicationTracker'
import { ApplicationStats } from '@/components/ApplicationStats'
import { useSocket } from '@/components/SocketProvider'

export default function ApplicationsPage() {
  const { onNotification } = useSocket()
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviewing: 0,
    rejected: 0,
    accepted: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()

    // Listen for real-time application updates
    const handleApplicationUpdate = (data: any) => {
      if (data.type === 'application_status_update') {
        setApplications(prev => prev.map(app =>
          app.id === data.applicationId
            ? { ...app, status: data.newStatus }
            : app
        ))
        loadStats() // Refresh stats
      }
    }

    onNotification(handleApplicationUpdate)
  }, [onNotification])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setApplications(data.data)
        loadStats()
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = () => {
    const newStats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'PENDING').length,
      interviewing: applications.filter(app => app.status === 'INTERVIEWING').length,
      rejected: applications.filter(app => app.status === 'REJECTED').length,
      accepted: applications.filter(app => app.status === 'ACCEPTED').length
    }
    setStats(newStats)
  }

  useEffect(() => {
    loadStats()
  }, [applications])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto flex pt-16">
        <LeftSidebar />

        <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text">Job Applications</h1>
                <p className="text-text-muted">Track and manage your job applications</p>
              </div>
            </div>

            {/* Stats Overview */}
            <ApplicationStats stats={stats} />

            {/* Application Tracker */}
            <ApplicationTracker
              applications={applications}
              loading={loading}
              onStatusUpdate={(applicationId, newStatus) => {
                setApplications(prev => prev.map(app =>
                  app.id === applicationId
                    ? { ...app, status: newStatus }
                    : app
                ))
              }}
            />
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}