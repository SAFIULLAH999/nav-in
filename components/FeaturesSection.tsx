'use client'

import { motion } from 'framer-motion'
import { Users, Briefcase, MessageCircle, TrendingUp, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Build Your Network',
    description: 'Connect with professionals in your field and discover new opportunities through meaningful relationships.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Briefcase,
    title: 'Find Your Dream Job',
    description: 'Explore thousands of job opportunities from top companies and get matched with roles that fit your skills.',
    color: 'bg-accent/10 text-accent'
  },
  {
    icon: MessageCircle,
    title: 'Real-time Messaging',
    description: 'Stay connected with your professional network through our integrated messaging system.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: TrendingUp,
    title: 'Career Growth Insights',
    description: 'Get personalized insights and recommendations to accelerate your career development.',
    color: 'bg-accent/10 text-accent'
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Your data is protected with enterprise-grade security and privacy controls.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built with modern technologies for the fastest and most responsive user experience.',
    color: 'bg-accent/10 text-accent'
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-6">
            Everything You Need to{' '}
            <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-lg text-text-muted max-w-3xl mx-auto">
            NavIN provides all the tools and connections you need to take your career to the next level.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group p-8 bg-background rounded-3xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-text mb-4">
              Ready to Transform Your Career?
            </h3>
            <p className="text-text-muted mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already building their future with NavIN.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors shadow-soft hover:shadow-medium">
                Join NavIN Today
              </button>
              <button className="border-2 border-primary/20 text-primary px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/5 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
