'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Users, Briefcase, Star } from 'lucide-react'
import Link from 'next/link'

interface PremiumSubscription {
  id: string
  tier: string
  status: string
  expiresAt: string
}

export default function HiringPage() {
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto flex pt-16">
          <LeftSidebar />
          <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    )
  }

  if (!subscription || subscription.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto flex pt-16">
          <LeftSidebar />
          <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
            <div className="space-y-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <Crown className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Hiring features are available with Premium Subscription. Upgrade to access advanced hiring tools and post job openings.
                </AlertDescription>
              </Alert>

              <div className="bg-card rounded-xl shadow-soft border border-border p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-text mb-2">Premium Hiring Section</h1>
                <p className="text-text-muted mb-6">
                  Unlock powerful hiring tools to find and connect with top talent.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-text mb-1">Advanced Search</h3>
                    <p className="text-sm text-text-muted">Find candidates with specific skills and experience</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-text mb-1">Premium Filters</h3>
                    <p className="text-sm text-text-muted">Access to detailed candidate profiles and insights</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <Briefcase className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-text mb-1">Job Posting</h3>
                    <p className="text-sm text-text-muted">Post unlimited job openings and reach more candidates</p>
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto flex pt-16">
        <LeftSidebar />
        <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text">Hiring Dashboard</h1>
                <p className="text-text-muted">Manage your hiring process and find top talent</p>
              </div>
              <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-2 rounded-lg">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Premium Active</span>
              </div>
            </div>

            {/* Hiring Tools */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Candidate Search</h3>
                    <p className="text-sm text-text-muted">Find and connect with qualified candidates</p>
                  </div>
                </div>
                <Link
                  href="/network"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Search Candidates
                </Link>
              </div>

              <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Post Job Opening</h3>
                    <p className="text-sm text-text-muted">Create and publish job listings</p>
                  </div>
                </div>
                <Link
                  href="/jobs"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  Post a Job
                </Link>
              </div>
            </div>

            {/* Premium Features */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
              <h2 className="text-xl font-semibold text-text mb-4">Premium Hiring Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-text">Advanced candidate matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-text">Priority job listings</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-text">Direct messaging with candidates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-text">Analytics and insights</span>
                </div>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  )
}