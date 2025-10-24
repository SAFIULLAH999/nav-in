'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Upload, FileText, Send } from 'lucide-react'
import { motion } from 'framer-motion'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  description: string
  requirements: string[]
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Application form state
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState('')

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs/${jobId}`)

      if (!response.ok) {
        throw new Error('Job not found')
      }

      const data = await response.json()

      if (data.success) {
        setJob(data.data)
      } else {
        setError(data.error || 'Failed to fetch job details')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      setError('Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setResumeFile(file)
      // In a real app, you'd upload to a service like Cloudinary or S3
      setResumeUrl(`Uploaded: ${file.name}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!coverLetter.trim() && !resumeFile) {
      setError('Please provide either a cover letter or resume')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // For demo purposes, no auth token required
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('coverLetter', coverLetter)

      if (resumeFile) {
        formData.append('resume', resumeFile)
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const data = await response.json()

      if (data.success) {
        // Success - redirect or show success message
        alert('Application submitted successfully!')
        // Refresh the jobs page to update applied jobs
        window.location.href = '/applications'
      } else {
        throw new Error(data.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 px-4">
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
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-20 px-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-muted hover:text-text mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </button>

          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <h1 className="text-2xl font-bold text-text mb-2">Apply for {job.title}</h1>
            <p className="text-primary font-medium mb-2">{job.company}</p>
            <div className="flex items-center text-sm text-text-muted space-x-4">
              <span>{job.location}</span>
              <span>{job.type}</span>
            </div>
          </div>
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-soft border border-border p-6"
        >
          <h2 className="text-xl font-semibold text-text mb-6">Submit Your Application</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-vertical"
                placeholder="Tell us why you're interested in this position and how your skills match the requirements..."
              />
              <p className="text-xs text-text-muted mt-1">
                Optional but recommended. This helps employers understand your interest and qualifications.
              </p>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Resume/CV
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted">
                    {resumeUrl || 'Click to upload your resume (PDF, DOC, DOCX)'}
                  </p>
                </label>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Maximum file size: 10MB. Supported formats: PDF, DOC, DOCX.
              </p>
            </div>

            {/* Job Requirements Reminder */}
            <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-4">
              <h3 className="font-medium text-text mb-2">Job Requirements:</h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.slice(0, 5).map((req, index) => (
                  <span key={index} className="px-3 py-1 bg-secondary/50 text-text-muted rounded-full text-sm">
                    {req}
                  </span>
                ))}
                {job.requirements.length > 5 && (
                  <span className="text-text-muted text-sm px-3 py-1">
                    +{job.requirements.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
