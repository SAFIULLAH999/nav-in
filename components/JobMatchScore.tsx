'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  Users, 
  Award, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

interface JobMatchScore {
  id: string
  jobId: string
  userId: string
  overallScore: number
  skillMatch: number
  experienceMatch: number
  educationMatch: number
  locationMatch: number
  cultureFit: number
  keywordsMatch: number
  requiredSkillsMatched: string[]
  requiredSkillsMissing: string[]
  niceToHaveSkillsMatched: string[]
  niceToHaveSkillsMissing: string[]
  experienceLevel: string
  locationCompatibility: string
  createdAt: string
  updatedAt: string
}

interface JobMatchScoreProps {
  jobId: string
  userId?: string
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const JobMatchScore: React.FC<JobMatchScoreProps> = ({
  jobId,
  userId,
  showDetails = false,
  size = 'md'
}) => {
  const [matchScore, setMatchScore] = useState<JobMatchScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatchScore()
  }, [jobId, userId])

  const fetchMatchScore = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const response = await fetch(`/api/job-match-score?jobId=${jobId}&userId=${userId || ''}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setMatchScore(data.data)
      } else {
        setError(data.error || 'Failed to fetch match score')
      }
    } catch (error) {
      console.error('Error fetching match score:', error)
      setError('Failed to fetch match score. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreCategory = (score: number) => {
    if (score >= 90) return { label: 'Excellent', icon: Sparkles, color: 'text-green-600' }
    if (score >= 70) return { label: 'Great', icon: CheckCircle, color: 'text-blue-600' }
    if (score >= 50) return { label: 'Good', icon: Award, color: 'text-yellow-600' }
    if (score >= 30) return { label: 'Fair', icon: AlertCircle, color: 'text-orange-600' }
    return { label: 'Needs Work', icon: XCircle, color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-secondary rounded w-3/4"></div>
        <div className="h-2 bg-secondary rounded w-1/2 mt-2"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">{error}</div>
    )
  }

  if (!matchScore) {
    return (
      <div className="text-text-muted text-sm">No match score available</div>
    )
  }

  const category = getScoreCategory(matchScore.overallScore)

  if (size === 'sm') {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-secondary rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBgColor(matchScore.overallScore)}`}
              style={{ width: `${matchScore.overallScore}%` }}
            ></div>
          </div>
          <span className={`font-semibold ${getScoreColor(matchScore.overallScore)}`}>
            {matchScore.overallScore}%
          </span>
        </div>
        <Badge className="text-xs">
          <category.icon className="w-3 h-3 mr-1" />
          {category.label}
        </Badge>
      </div>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Job Match Score</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${getScoreColor(matchScore.overallScore)}`}>
              {matchScore.overallScore}%
            </span>
            <Badge className={`${category.color} bg-transparent border-0`}>
              <category.icon className="w-4 h-4 mr-1" />
              {category.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Overall Score Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-text-muted mb-2">
            <span>Overall Match</span>
            <span>{matchScore.overallScore}%</span>
          </div>
          <Progress value={matchScore.overallScore} className="h-3" />
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1 text-blue-500" />
                    Skills
                  </span>
                  <span className="font-medium">{matchScore.skillMatch}%</span>
                </div>
                <Progress value={matchScore.skillMatch} className="h-2 bg-blue-100" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Award className="w-3 h-3 mr-1 text-green-500" />
                    Experience
                  </span>
                  <span className="font-medium">{matchScore.experienceMatch}%</span>
                </div>
                <Progress value={matchScore.experienceMatch} className="h-2 bg-green-100" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1 text-purple-500" />
                    Education
                  </span>
                  <span className="font-medium">{matchScore.educationMatch}%</span>
                </div>
                <Progress value={matchScore.educationMatch} className="h-2 bg-purple-100" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1 text-orange-500" />
                    Location
                  </span>
                  <span className="font-medium">{matchScore.locationMatch}%</span>
                </div>
                <Progress value={matchScore.locationMatch} className="h-2 bg-orange-100" />
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-2">Skills Match</h4>
              
              {matchScore.requiredSkillsMatched.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-text-muted mb-1">Required Skills Matched</p>
                  <div className="flex flex-wrap gap-1">
                    {matchScore.requiredSkillsMatched.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {matchScore.requiredSkillsMissing.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-text-muted mb-1">Required Skills Missing</p>
                  <div className="flex flex-wrap gap-1">
                    {matchScore.requiredSkillsMissing.map((skill, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {matchScore.niceToHaveSkillsMatched.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-text-muted mb-1">Nice-to-Have Skills Matched</p>
                  <div className="flex flex-wrap gap-1">
                    {matchScore.niceToHaveSkillsMatched.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm text-text-muted">
              <div>
                <span className="font-medium">Experience Level:</span>
                <span className="ml-2">{matchScore.experienceLevel}</span>
              </div>
              <div>
                <span className="font-medium">Location Compatibility:</span>
                <span className="ml-2">{matchScore.locationCompatibility}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" size="sm">
                Improve Match
              </Button>
              <Button size="sm">
                Apply Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for displaying match score in job cards
export const JobCardMatchScore: React.FC<{ jobId: string; userId?: string }> = ({
  jobId,
  userId
}) => {
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
        const response = await fetch(`/api/job-match-score?jobId=${jobId}&userId=${userId || ''}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setMatchScore(data.data.overallScore)
          }
        }
      } catch (error) {
        console.error('Error fetching match score:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScore()
  }, [jobId, userId])

  if (loading || matchScore === null) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getScoreColor(matchScore)}`}>
      <Target className="w-3 h-3" />
      <span className="font-medium">{matchScore}%</span>
      <span className="text-text-muted">match</span>
    </div>
  )
}