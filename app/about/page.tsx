'use client'

import { motion } from 'framer-motion'
import { Users, Target, Heart, Globe, Award, TrendingUp } from 'lucide-react'

const values = [
  {
    icon: Users,
    title: 'Community First',
    description: 'We believe in the power of genuine connections and building meaningful professional relationships.'
  },
  {
    icon: Target,
    title: 'Career Growth',
    description: 'Our platform is designed to help professionals at every stage of their career journey reach new heights.'
  },
  {
    icon: Heart,
    title: 'Authenticity',
    description: 'We foster an environment where professionals can be their true selves and build authentic connections.'
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Connecting professionals worldwide to create opportunities and drive innovation across borders.'
  }
]

const stats = [
  { label: 'Active Professionals', value: '50,000+' },
  { label: 'Companies', value: '2,500+' },
  { label: 'Job Placements', value: '15,000+' },
  { label: 'Countries', value: '120+' }
]

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-founder',
    bio: 'Former VP of Product at LinkedIn with 15+ years in professional networking.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'Marcus Johnson',
    role: 'CTO & Co-founder',
    bio: 'Ex-Google engineer passionate about building scalable social platforms.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Head of Growth',
    bio: 'Growth expert who scaled multiple startups to millions of users.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'David Kim',
    role: 'Head of Engineering',
    bio: 'Full-stack architect with expertise in real-time applications.',
    image: '/api/placeholder/150/150'
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            About <span className="text-primary">NavIN</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            We're building the future of professional networking, where authentic connections 
            lead to meaningful opportunities and career growth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-text mb-6">Our Mission</h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  To democratize professional networking by creating a platform where talent meets opportunity, 
                  and where every professional has the tools and connections they need to succeed in their career.
                </p>
                <p className="text-text-muted text-lg leading-relaxed">
                  We believe that great careers are built on great relationships, and our platform is designed 
                  to foster those authentic connections that drive real career growth.
                </p>
              </div>
              <div className="relative">
                <div className="w-full h-80 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-32 h-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-text text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-4">{value.title}</h3>
                  <p className="text-text-muted leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-text text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-text text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={member.name}
                className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">{member.name}</h3>
                <p className="text-primary font-medium mb-4">{member.role}</p>
                <p className="text-text-muted text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}