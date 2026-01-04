'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Users, Briefcase, MessageCircle, TrendingUp, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

const demoSteps = [
  {
    title: 'Create Your Profile',
    description: 'Build a comprehensive professional profile that showcases your skills and experience.',
    icon: Users,
    image: '/api/placeholder/400/300',
    features: ['Professional photo', 'Work experience', 'Skills & endorsements', 'Portfolio links']
  },
  {
    title: 'Discover Opportunities',
    description: 'Find relevant job openings and connect with professionals in your industry.',
    icon: Briefcase,
    image: '/api/placeholder/400/300',
    features: ['Job matching algorithm', 'Company insights', 'Salary insights', 'Remote opportunities']
  },
  {
    title: 'Build Connections',
    description: 'Network with industry professionals and grow your professional circle.',
    icon: MessageCircle,
    image: '/api/placeholder/400/300',
    features: ['Smart suggestions', 'Direct messaging', 'Group discussions', 'Event invitations']
  },
  {
    title: 'Track Your Growth',
    description: 'Monitor your career progress and get personalized recommendations.',
    icon: TrendingUp,
    image: '/api/placeholder/400/300',
    features: ['Analytics dashboard', 'Growth tracking', 'Skill gaps analysis', 'Career roadmap']
  }
]

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentDemo = demoSteps[currentStep]
  const Icon = currentDemo.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">NavIN Demo</h2>
                  <p className="text-sm text-text-muted">
                    Step {currentStep + 1} of {demoSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4">
              <div className="w-full bg-secondary rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Left Side - Description */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-text">{currentDemo.title}</h3>
                  </div>
                  <p className="text-text-muted text-lg leading-relaxed">
                    {currentDemo.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-text mb-3">Key Features:</h4>
                  <ul className="space-y-2">
                    {currentDemo.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-primary font-medium">
                    💡 Pro Tip: This feature is available on all NavIN plans, including our free tier!
                  </p>
                </div>
              </div>

              {/* Right Side - Visual */}
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center border border-border">
                  <div className="text-center">
                    <Icon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-text-muted">Interactive Demo Preview</p>
                    <p className="text-sm text-text-muted/70 mt-2">
                      This is a simplified view of the actual feature
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-6 border-t border-border bg-surface/50">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 0
                    ? 'bg-secondary text-text-muted cursor-not-allowed'
                    : 'bg-card text-text hover:bg-secondary border border-border'
                }`}
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {demoSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep ? 'bg-primary' : 'bg-secondary hover:bg-border'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300"
              >
                {currentStep === demoSteps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}