'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Building, Clock, DollarSign, Users, ExternalLink, Calendar, Send, User, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface JobDetails {
  id: string
  title: string
  description: string
  company: string
  companyName: string
  location: string
  type: string
  salaryMin?: number
  salaryMax?: number
  requirements: string[]
  benefits?: string
  experience?: string
  isRemote?: boolean
  applicationDeadline?: string
  views: number
  applicationsCount: number
  createdAt: string
  employerEmail?: string
  employerPhone?: string
  employerUsername?: string
  employerName?: string
  author?: {
    name: string
    username: string
    avatar: string
    title: string
    email: string
  }
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params?.id && typeof params.id === 'string') {
      fetchJobDetails()
    }
  }, [params?.id])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/jobs/${params.id as string}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Job not found')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setJob(data.data)
      } else {
        setError(data.error || 'Failed to fetch job details')
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
      setError('Failed to load job details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary not disclosed'
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
    if (min) return `$${min}+`
    if (max) return `Up to $${max}`
    return 'Competitive salary'
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

  const handleApply = async () => {
    try {
      setApplying(true)
      
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      
      if (!token) {
        // Redirect to login if not authenticated
        toast.error('Please sign in to apply for jobs')
        router.push('/sign-in')
        return
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: params.id as string,
          coverLetter: coverLetter || 'I am interested in this position and would like to apply.'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Application submitted successfully!')
        setShowApplicationForm(false)
        setCoverLetter('')
        // Optionally redirect to applications page
        setTimeout(() => {
          router.push('/applications')
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-6 px-4">
          <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-muted">Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-4xl mx-auto pt-6 px-4 pb-8">
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
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                {/* Company Logo */}
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {job.company.charAt(0)}
                </div>

                {/* Job Info */}
                <div>
                  <h1 className="text-3xl font-bold text-text mb-2">{job.title}</h1>
                  <p className="text-xl text-primary font-semibold mb-4">{job.company}</p>
                  
                  <div className="flex items-center space-x-6 text-text-muted">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>{job.type.replace('_', ' ').toLowerCase()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                <button
                  onClick={() => setShowApplicationForm(!showApplicationForm)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Apply Now
                </button>
                <div className="text-sm text-text-muted">
                  {job.applicationsCount} applications • Posted {formatDate(job.createdAt)}
                </div>
              </div>
            </div>

            {/* Job Meta */}
            <div className="flex items-center space-x-6 text-sm text-text-muted border-t border-border pt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{job.views} views</span>
              </div>
              {job.isRemote && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Remote Work Available</span>
                </div>
              )}
              {job.applicationDeadline && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Apply by {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Application Form */}
        {showApplicationForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-card rounded-xl shadow-soft border border-border p-6">
              <h3 className="text-xl font-semibold text-text mb-4">Apply for this position</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell us why you're interested in this position..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {applying ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{applying ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowApplicationForm(false)}
                    className="px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Job Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <h2 className="text-2xl font-semibold text-text mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-card rounded-xl shadow-soft border border-border p-6">
              <h2 className="text-2xl font-semibold text-text mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-text-muted">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Benefits */}
        {job.benefits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-card rounded-xl shadow-soft border border-border p-6">
              <h2 className="text-2xl font-semibold text-text mb-4">Benefits</h2>
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap">
                {job.benefits}
              </p>
            </div>
          </motion.div>
        )}

        {/* Employer Info */}
        {job.author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-card rounded-xl shadow-soft border border-border p-6">
              <h2 className="text-2xl font-semibold text-text mb-4">About the Employer</h2>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {job.author.avatar ? (
                    <img
                      src={job.author.avatar}
                      alt={job.author.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    job.author.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text">{job.author.name}</h3>
                  <p className="text-text-muted mb-1">{job.author.title}</p>
                  <p className="text-sm text-text-muted">@{job.author.username}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
