'use client'

import React, { useState } from 'react'
import { Clock, Calendar, Building, MapPin, ExternalLink, MoreVertical, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Application {
  id: string
  jobId: string
  job: {
    title: string
    companyName: string
    location: string
    type: string
  }
  status: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED'
  appliedAt: string
  lastUpdated: string
  notes?: string
}

interface ApplicationTrackerProps {
  applications: Application[]
  loading: boolean
  onStatusUpdate: (applicationId: string, newStatus: string) => void
}

const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: Clock
  },
  REVIEWED: {
    label: 'Under Review',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: AlertCircle
  },
  INTERVIEWING: {
    label: 'Interviewing',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: Calendar
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: CheckCircle
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: XCircle
  }
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  loading,
  onStatusUpdate
}) => {
  const [filter, setFilter] = useState<string>('all')

  const filteredApplications = applications.filter(app =>
    filter === 'all' || app.status === filter
  )

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-soft border border-border p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4"></div>
                <div className="h-3 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      {/* Filter Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-1 p-4">
          {['all', 'PENDING', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text hover:bg-secondary'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
              {status !== 'all' && (
                <span className="ml-2 text-xs">
                  ({applications.filter(app => app.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="divide-y divide-border">
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No applications found</h3>
            <p className="text-text-muted">
              {filter === 'all'
                ? 'You haven\'t applied to any jobs yet.'
                : `No applications with ${statusConfig[filter as keyof typeof statusConfig]?.label.toLowerCase()} status.`
              }
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => {
            const statusInfo = statusConfig[application.status as keyof typeof statusConfig]
            const StatusIcon = statusInfo.icon

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Company Logo */}
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary" />
                      </div>

                      {/* Application Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text mb-1">
                          {application.job.title}
                        </h3>
                        <p className="text-text-muted mb-2">
                          {application.job.companyName}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-text-muted mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{application.job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${statusInfo.bgColor}`}>
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                          <span className={statusInfo.color}>{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </button>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {application.notes && (
                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-text-muted">{application.notes}</p>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}