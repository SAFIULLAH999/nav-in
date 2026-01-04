'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Clock, Activity } from 'lucide-react'

const services = [
  {
    name: 'Web Application',
    status: 'operational',
    uptime: '99.9%',
    description: 'Main NavIN platform and user interface'
  },
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.8%',
    description: 'REST API endpoints and integrations'
  },
  {
    name: 'Authentication',
    status: 'operational',
    uptime: '99.9%',
    description: 'User login and session management'
  },
  {
    name: 'Database',
    status: 'operational',
    uptime: '99.7%',
    description: 'User data and job listings storage'
  },
  {
    name: 'Real-time Features',
    status: 'operational',
    uptime: '99.6%',
    description: 'Messaging and live notifications'
  },
  {
    name: 'Job Scraping',
    status: 'operational',
    uptime: '99.5%',
    description: 'Automated job posting collection'
  }
]

const incidents = [
  {
    id: 1,
    title: 'Scheduled Maintenance',
    status: 'resolved',
    date: '2024-01-01',
    time: '02:00 UTC',
    description: 'Routine database optimization and security updates.'
  },
  {
    id: 2,
    title: 'API Rate Limiting',
    status: 'resolved',
    date: '2023-12-28',
    time: '15:30 UTC',
    description: 'Temporary rate limiting on job search endpoints due to high traffic.'
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'degraded':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    case 'down':
      return <XCircle className="w-5 h-5 text-red-500" />
    default:
      return <Clock className="w-5 h-5 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'text-green-600 bg-green-100'
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100'
    case 'down':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Activity className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            System <span className="text-primary">Status</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Real-time status of all NavIN services and infrastructure.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-green-800">All Systems Operational</h2>
            </div>
            <p className="text-green-700 text-center">
              All services are running normally. Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-text mb-8">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div
                key={service.name}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-semibold text-text">{service.name}</h3>
                      <p className="text-sm text-text-muted">{service.description}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(service.status)}`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Uptime</span>
                  <span className="text-text font-semibold">{service.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-text mb-8">Recent Incidents</h2>
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(incident.status)}
                      <div>
                        <h3 className="font-semibold text-text">{incident.title}</h3>
                        <p className="text-sm text-text-muted">
                          {incident.date} at {incident.time}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </div>
                  </div>
                  <p className="text-text-muted">{incident.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 border border-border text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">No Recent Incidents</h3>
              <p className="text-text-muted">
                Everything is running smoothly. No incidents reported in the last 90 days.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}