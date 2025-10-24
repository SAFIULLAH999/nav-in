'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Search, MapPin, Building, Clock, DollarSign, Bookmark, Filter, Plus, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  postedDate: string
  applicants: number
  logo: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [autoFetch, setAutoFetch] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    fetchJobs()
    fetchAppliedJobs()
  }, [])

  // Auto-fetch jobs every 5 seconds
  useEffect(() => {
    if (!autoFetch) return

    const interval = setInterval(() => {
      loadMoreJobsInBackground()
    }, 5000) // Fetch every 5 seconds

    return () => clearInterval(interval)
  }, [autoFetch, searchTerm, locationFilter, fetchCount])

  const fetchJobs = async (append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setCurrentPage(1)
      }
      setError(null)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (locationFilter) params.append('location', locationFilter)
      if (typeFilter) params.append('type', typeFilter)
      params.append('page', append ? String(currentPage + 1) : '1')
      params.append('limit', '10')

      const response = await fetch(`/api/jobs?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        if (append) {
          setJobs(prev => [...prev, ...(data.data || [])])
          setCurrentPage(prev => prev + 1)
        } else {
          setJobs(data.data || [])
        }
        setHasMore(data.pagination?.hasMore || false)
      } else {
        setError(data.error || 'Failed to fetch jobs')
        if (!append) setJobs([])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to fetch jobs. Please try again.')
      if (!append) setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const loadMoreJobsInBackground = async () => {
    try {
      // Don't fetch if already loading
      if (loadingMore || loading) return

      const response = await fetch('/api/jobs/load-more', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchQuery: searchTerm || 'software engineer',
          location: locationFilter || 'remote',
          limit: 10,
          page: Math.floor(Math.random() * 10) + 1 // Random page to get variety
        })
      })

      const data = await response.json()

      if (data.success) {
        const newJobs = data.data || []
        if (newJobs.length > 0) {
          // Add new unique jobs to the list
          setJobs(prev => {
            const existingIds = new Set(prev.map(j => j.id))
            const uniqueNewJobs = newJobs.filter((job: any) => !existingIds.has(job.id))
            if (uniqueNewJobs.length > 0) {
              console.log(`Auto-fetched ${uniqueNewJobs.length} new jobs`)
              setLastFetchTime(new Date())
              setFetchCount(c => c + 1)
              return [...prev, ...uniqueNewJobs]
            }
            return prev
          })
          setHasMore(true)
        }
      }
    } catch (error) {
      console.error('Background fetch error:', error)
    }
  }

  const loadMoreJobs = async () => {
    try {
      setLoadingMore(true)
      setError(null)

      const response = await fetch('/api/jobs/load-more', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchQuery: searchTerm || 'software engineer',
          location: locationFilter || 'remote',
          limit: 20,
          page: currentPage + 1
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add new jobs to the list
        const newJobs = data.data || []
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id))
          const uniqueNewJobs = newJobs.filter((job: any) => !existingIds.has(job.id))
          return [...prev, ...uniqueNewJobs]
        })
        setCurrentPage(prev => prev + 1)
        setHasMore(data.meta?.hasMore !== false)
        setLastFetchTime(new Date())
        
        // Show success message
        if (newJobs.length > 0) {
          console.log(`Loaded ${newJobs.length} new jobs from career sites`)
        }
      } else {
        setError(data.error || 'Failed to load more jobs')
      }
    } catch (error) {
      console.error('Error loading more jobs:', error)
      setError('Failed to load more jobs. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchAppliedJobs = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const appliedIds = new Set<string>(data.data.map((app: any) => app.jobId))
          setAppliedJobIds(appliedIds)
        }
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1)
      fetchJobs(false)
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, locationFilter, typeFilter])

  // Filter out applied jobs
  const filteredJobs = jobs.filter(job => !appliedJobIds.has(job.id))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-20 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Find Your Dream Job</h1>
          <p className="text-text-muted">Discover opportunities that match your skills and career goals</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-soft border border-border p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords (e.g., 'software engineer', 'marketing manager')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Location (e.g., 'New York', 'Remote')"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none lg:w-56 transition-all"
              />
            </div>

            {/* Job Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none lg:w-40"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Salary Range</label>
                  <select className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                    <option>Any</option>
                    <option>$50k - $80k</option>
                    <option>$80k - $120k</option>
                    <option>$120k - $160k</option>
                    <option>$160k+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Experience Level</label>
                  <select className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                    <option>Any</option>
                    <option>Entry Level</option>
                    <option>Mid Level</option>
                    <option>Senior Level</option>
                    <option>Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Company Size</label>
                  <select className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                    <option>Any</option>
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>200+ employees</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Header */}
        {!loading && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <p className="text-text-muted">
                Showing {filteredJobs.length} jobs {appliedJobIds.size > 0 && `(${appliedJobIds.size} applied)`}
              </p>

              {/* Auto-fetch toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoFetch(!autoFetch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoFetch ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoFetch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-text-muted">
                  Auto-fetch {autoFetch ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Live indicator */}
              {autoFetch && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}

              {lastFetchTime && (
                <span className="text-xs text-text-muted">
                  Last updated: {lastFetchTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-muted">Sort by:</span>
              <select className="px-3 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm">
                <option>Most Recent</option>
                <option>Most Relevant</option>
                <option>Highest Salary</option>
                <option>Most Applicants</option>
              </select>
            </div>
          </div>
        )}

        {/* Job Listings */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-text-muted">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchJobs(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))
          ) : jobs.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">No jobs found</h3>
              <p className="text-text-muted">Try adjusting your search criteria or filters</p>
            </div>
          ) : appliedJobIds.size > 0 ? (
            <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
              <div className="w-16 h-16 bg-primary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">All jobs applied to!</h3>
              <p className="text-text-muted mb-6">
                You've applied to all available jobs. Check back later for new opportunities or view your applications.
              </p>
              <Link
                href="/applications"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                View My Applications
              </Link>
            </div>
          ) : null}
        </div>

        {/* Load More */}
        {!loading && filteredJobs.length > 0 && (
          <div className="text-center mt-12">
            <motion.button
              onClick={loadMoreJobs}
              disabled={loadingMore}
              whileHover={{ scale: loadingMore ? 1 : 1.05 }}
              whileTap={{ scale: loadingMore ? 1 : 0.95 }}
              className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                loadingMore
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg'
              }`}
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Loading Jobs from Career Sites...</span>
                </div>
              ) : (
                'Load More Jobs Now'
              )}
            </motion.button>
            
            {autoFetch && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium">
                    Auto-fetching jobs every 5 seconds from Indeed, LinkedIn, and other career sites worldwide
                  </p>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {fetchCount > 0 ? `${fetchCount} automatic fetches completed` : 'Waiting for next fetch...'}
                </p>
              </div>
            )}
            
            {loadingMore && (
              <p className="text-sm text-text-muted mt-3">
                Fetching jobs from Indeed, LinkedIn, and other career sites worldwide...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job }: { job: any }) {
  const [isBookmarked, setIsBookmarked] = useState(false)

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

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Company Logo */}
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
            {job.company.charAt(0)}
          </div>

          {/* Job Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-semibold text-text mb-1">{job.title}</h3>
                <p className="text-primary font-medium mb-2">{job.company}</p>

                <div className="flex items-center space-x-4 text-sm text-text-muted mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{job.type.replace('_', '-').toLowerCase()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:bg-secondary'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="text-text-muted mb-4 line-clamp-2">{job.description}</p>

            {/* Requirements */}
            {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-text mb-2">Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-secondary/50 text-text-muted rounded-full text-sm">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-text-muted">
                <span>{formatDate(job.createdAt)}</span>
                <span>{job.applicationsCount || 0} applicants</span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-text-muted hover:text-text transition-colors">
                  View Details
                </button>
                <button
                  onClick={() => window.location.href = `/apply/${job.id}`}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
