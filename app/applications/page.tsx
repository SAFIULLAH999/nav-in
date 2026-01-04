'use client'

import React, { useState, useEffect } from 'react'

import { ArrowLeft, Clock, Building, MapPin, ExternalLink, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Application {
  id: string
  jobId: string
  job: {
    title: string
    companyName: string
    location: string
    type: string
  }
  status: string
  appliedAt: string
  lastUpdated: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        // Guest user - redirect to login
        window.location.href = '/sign-up'
        return
      }

      setLoading(true)
      const response = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Invalid token - redirect to login
          window.location.href = '/sign-up'
          return
        }
        throw new Error('Failed to fetch applications')
      }

      const data = await response.json()

      if (data.success) {
        setApplications(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      setError('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-muted">Loading your applications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-6 px-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/jobs"
            className="flex items-center text-text-muted hover:text-text mb-4 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>

          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text mb-2">My Applications</h1>
                <p className="text-text-muted">
                  Track your job applications and their status
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {applications.length}
                </div>
                <div className="text-sm text-text-muted">
                  Total Applications
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl shadow-soft border border-border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        {/* Company Logo */}
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
                          {application.job.companyName.charAt(0)}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-text mb-1">
                                {application.job.title}
                              </h3>
                              <p className="text-primary font-medium mb-2">
                                {application.job.companyName}
                              </p>

                              <div className="flex items-center space-x-4 text-sm text-text-muted mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{application.job.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Building className="w-4 h-4" />
                                  <span>{application.job.type.replace('_', ' ').toLowerCase()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Applied {formatDate(application.appliedAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                                View Details
                              </button>
                            </div>
                          </div>

                          {/* Application Meta */}
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center space-x-4 text-sm text-text-muted">
                              <span>Application ID: {application.id.slice(-8)}</span>
                              <span>Last updated: {formatDate(application.lastUpdated)}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                <ExternalLink className="w-4 h-4 text-text-muted" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">No applications yet</h3>
              <p className="text-text-muted mb-6">
                You haven't applied to any jobs yet. Start exploring opportunities!
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          )}
        </motion.div>

        {/* Stats Summary */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {applications.filter(app => app.status.toLowerCase() === 'pending').length}
              </div>
              <div className="text-sm text-text-muted">Pending Review</div>
            </div>

            <div className="bg-card rounded-xl shadow-soft border border-border p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {applications.filter(app => app.status.toLowerCase() === 'accepted').length}
              </div>
              <div className="text-sm text-text-muted">Accepted</div>
            </div>

            <div className="bg-card rounded-xl shadow-soft border border-border p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {applications.filter(app => app.status.toLowerCase() === 'rejected').length}
              </div>
              <div className="text-sm text-text-muted">Rejected</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
