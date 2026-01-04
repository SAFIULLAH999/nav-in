'use client'

import React, { useState, useEffect } from 'react'
import { Target, TrendingUp, BookOpen, Award, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface SkillsGapData {
  currentSkills: string[]
  skillScore: number
  skillGaps: number
  recommendations: Array<{
    skill: string
    reason: string
    priority: string
    learningResources: string[]
  }>
  trendingSkills: string[]
  industry: string
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<SkillsGapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/insights/skills-gap')

      const data = await response.json()

      if (data.success) {
        setInsights(data.data)
      } else {
        toast.error(data.error || 'Failed to load insights')
      }
    } catch (error) {
      console.error('Error loading insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="text-center py-12">
            <p className="text-text-muted">No insights data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-background">

      <div className="max-w-6xl mx-auto pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Skills Gap Insights</h1>
          <p className="text-text-muted">AI-driven analysis of your skills and market trends</p>
        </motion.div>

        {/* Skill Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border border-border mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text mb-2">Your Skill Score</h2>
              <p className="text-text-muted">Based on current skills vs market demands</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{insights.skillScore}%</div>
              <div className="text-sm text-text-muted">{insights.skillGaps} skill gaps identified</div>
            </div>
          </div>
        </motion.div>

        {/* Current Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border border-border mb-8"
        >
          <h3 className="text-lg font-semibold text-text mb-4">Your Current Skills</h3>
          <div className="flex flex-wrap gap-2">
            {insights.currentSkills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border border-border mb-8"
        >
          <h3 className="text-lg font-semibold text-text mb-4">Recommended Skills to Learn</h3>
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-text">{rec.skill}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-text-muted text-sm mb-3">{rec.reason}</p>
                <div>
                  <p className="text-sm font-medium text-text mb-1">Learning Resources:</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.learningResources.map((resource, rIndex) => (
                      <span key={rIndex} className="px-2 py-1 bg-secondary text-text-muted rounded text-xs">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trending Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <h3 className="text-lg font-semibold text-text mb-4">Trending Skills in {insights.industry}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.trendingSkills.map((skill, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-text-muted">{skill}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
