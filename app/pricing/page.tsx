'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, Users } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    icon: Users,
    features: [
      'Basic profile',
      'Connect with 50 people',
      'View job listings',
      'Apply to 5 jobs per month',
      'Basic messaging',
      'Community access'
    ],
    cta: 'Get Started Free',
    popular: false
  },
  {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'For serious professionals',
    icon: Star,
    features: [
      'Enhanced profile with portfolio',
      'Unlimited connections',
      'Unlimited job applications',
      'Advanced search & filters',
      'Priority messaging',
      'Analytics & insights',
      'Featured in searches',
      'Direct recruiter contact'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    description: 'For teams and companies',
    icon: Crown,
    features: [
      'Everything in Professional',
      'Team management',
      'Bulk job posting',
      'Advanced analytics',
      'API access',
      'Custom branding',
      'Dedicated support',
      'SSO integration'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            Choose Your{' '}
            <span className="text-primary">Perfect Plan</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Unlock your professional potential with plans designed for every stage of your career journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-card rounded-3xl shadow-soft border-2 transition-all duration-300 hover:shadow-lg ${
                  plan.popular
                    ? 'border-primary scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <div className={`w-16 h-16 ${
                    plan.popular ? 'bg-primary' : 'bg-secondary'
                  } rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-8 h-8 ${
                      plan.popular ? 'text-white' : 'text-primary'
                    }`} />
                  </div>

                  <h3 className="text-2xl font-bold text-text mb-2">{plan.name}</h3>
                  <p className="text-text-muted mb-6">{plan.description}</p>

                  <div className="mb-8">
                    <span className="text-4xl font-bold text-text">{plan.price}</span>
                    <span className="text-text-muted">/{plan.period}</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg'
                      : 'bg-secondary text-primary hover:bg-secondary/80'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12 text-center"
        >
          <Zap className="w-16 h-16 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-text mb-4">
            Need something custom?
          </h3>
          <p className="text-text-muted mb-8 max-w-2xl mx-auto">
            We're here to help. Contact our team for custom enterprise solutions tailored to your organization's needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
              Contact Sales
            </button>
            <Link
              href="/"
              className="border-2 border-primary/20 text-primary px-8 py-4 rounded-2xl font-semibold hover:bg-primary/5 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}