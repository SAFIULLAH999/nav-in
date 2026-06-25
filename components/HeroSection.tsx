'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { DemoModal } from '@/components/DemoModal'

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="relative w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-muted border border-border text-text text-sm font-medium"
          >
            <span className="w-2 h-2 bg-accent rounded-full mr-2" />
            Now in Beta - Join 10,000+ professionals
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text leading-tight"
          >
            Connect, Grow, and{' '}
            <span className="text-primary relative inline-block">
              Build Your Professional Future
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-accent rounded-full origin-left"
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed"
          >
            NavIN is the modern professional network that connects you with opportunities,
            insights, and people who matter to your career growth.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/register"
              className="group bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => setShowDemo(true)}
              className="group border-2 border-border text-text px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-muted transition-all duration-300 flex items-center space-x-2"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Watch Demo</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-text-muted">Active Professionals</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-text-muted">Companies</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-text-muted">Connections Made</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Demo Modal */}
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </section>
  )
}
