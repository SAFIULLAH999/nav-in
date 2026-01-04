'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, FileText, Send, User, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirebase } from '@/components/FirebaseProvider'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  description: string
  requirements: string[]
  employerEmail?: string
  employerPhone?: string
  employerUsername?: string
  employerName?: string
  author: {
    name: string
    username?: string
    email: string
  }
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string
  const { user } = useFirebase()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Application form state
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Suggested skills for job applications
  const suggestedSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'GraphQL', 'REST APIs', 'Git', 'CI/CD', 'Agile', 'Scrum', 'Leadership',
    'Project Management', 'Team Management', 'Mentoring', 'Problem Solving',
    'Communication', 'Teamwork', 'Time Management', 'Critical Thinking'
  ]

  useEffect(() => {
    fetchJobDetails()
    fetchUserProfile()
  }, [jobId])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (token) {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setUserProfile(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

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

  const handleSkillClick = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
      // Add skill to cover letter if it's not already there
      if (coverLetter && !coverLetter.toLowerCase().includes(skill.toLowerCase())) {
        const newCoverLetter = `${coverLetter}\n\nSkills: ${skill}`
        setCoverLetter(newCoverLetter)
      } else if (!coverLetter) {
        setCoverLetter(`I have experience with ${skill}.`)
      }
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in all required fields (Full Name and Email)')
      return
    }

    if (!coverLetter.trim() && !resumeFile) {
      setError('Please provide either a cover letter or resume')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Try to get auth token for authenticated users
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('coverLetter', coverLetter)

      if (resumeFile) {
        formData.append('resume', resumeFile)
      }

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers,
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
            {/* Employer Information */}
            {job && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Application Details</p>
                    <p className="text-sm text-blue-700">
                      Application will be sent to: <span className="font-medium">{job.employerEmail || job.author.email}</span>
                    </p>
                    {job.employerPhone && (
                      <p className="text-sm text-blue-700 mt-1">
                        Contact Phone: <span className="font-medium">{job.employerPhone}</span>
                      </p>
                    )}
                    <p className="text-sm text-blue-700 mt-1">
                      Hiring Manager: <span className="font-medium">{job.employerName || job.author.name}</span>
                    </p>
                    {job.employerUsername && (
                      <p className="text-sm text-blue-700 mt-1">
                        Profile URL: <span className="font-medium">nav-in.com/in/{job.employerUsername}</span>
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      Consider including this information in your cover letter for quick reference.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Full Name *"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Email Address *"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Phone Number"
                />
              </div>
            </div>

            {/* Suggested Skills */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillClick(skill)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-primary text-white'
                        : 'bg-secondary/50 text-text-muted hover:bg-secondary hover:text-text'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {selectedSkills.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-2">Selected skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-1 bg-primary/20 text-primary rounded-md text-xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-text-muted mt-2">
                Click on skills to automatically add them to your cover letter
              </p>
            </div>

            {/* Cover Letter */}
            <div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-vertical"
                placeholder="Cover Letter (Optional but recommended)..."
              />
              <p className="text-xs text-text-muted mt-1">
                Optional but recommended. This helps employers understand your interest and qualifications.
              </p>
            </div>

            {/* Resume Upload */}
            <div>
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
