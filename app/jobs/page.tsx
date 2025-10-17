'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Search, MapPin, Building, Clock, DollarSign, Bookmark, Filter, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120k - $160k',
      description: 'We are looking for a senior React developer to join our growing team...',
      requirements: ['5+ years React experience', 'TypeScript proficiency', 'Leadership skills'],
      postedDate: '2 days ago',
      applicants: 23,
      logo: '/companies/techcorp.jpg'
    },
    {
      id: '2',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90k - $130k',
      description: 'Join our product team to help build the next generation of SaaS tools...',
      requirements: ['3+ years PM experience', 'B2B SaaS background', 'Data-driven mindset'],
      postedDate: '1 week ago',
      applicants: 45,
      logo: '/companies/startupxyz.jpg'
    },
    {
      id: '3',
      title: 'UX Designer',
      company: 'DesignCo',
      location: 'New York, NY',
      type: 'Contract',
      salary: '$80k - $100k',
      description: 'We need a talented UX designer to help redesign our mobile application...',
      requirements: ['Portfolio required', 'Figma expertise', 'User research experience'],
      postedDate: '3 days ago',
      applicants: 18,
      logo: '/companies/designco.jpg'
    }
  ]

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !locationFilter || job.location.includes(locationFilter)
    const matchesType = !typeFilter || job.type === typeFilter

    return matchesSearch && matchesLocation && matchesType
  })

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
                placeholder="Search jobs, companies, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none lg:w-48"
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-muted">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>

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

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Load More Jobs
          </button>
        </div>
      </div>
    </div>
  )
}

function JobCard({ job }: { job: Job }) {
  const [isBookmarked, setIsBookmarked] = useState(false)

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
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
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
            <div className="mb-4">
              <h4 className="font-medium text-text mb-2">Requirements:</h4>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req, index) => (
                  <span key={index} className="px-3 py-1 bg-secondary/50 text-text-muted rounded-full text-sm">
                    {req}
                  </span>
                ))}
              </div>
            </div>

            {/* Job Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-text-muted">
                <span>{job.postedDate}</span>
                <span>{job.applicants} applicants</span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-text-muted hover:text-text transition-colors">
                  View Details
                </button>
                <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
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
