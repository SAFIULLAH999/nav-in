'use client'

import { motion } from 'framer-motion'
import { Search, MessageCircle, Mail, Book, Video, Users, Shield, Settings, Briefcase } from 'lucide-react'
import { useState } from 'react'

const categories = [
  {
    icon: Users,
    title: 'Getting Started',
    description: 'New to NavIN? Start here',
    articles: [
      'Creating your profile',
      'Connecting with professionals',
      'Finding your first job',
      'Setting up notifications'
    ]
  },
  {
    icon: Briefcase,
    title: 'Job Search',
    description: 'Everything about jobs',
    articles: [
      'How to apply for jobs',
      'Setting job preferences',
      'Tracking applications',
      'Salary negotiation tips'
    ]
  },
  {
    icon: MessageCircle,
    title: 'Networking',
    description: 'Build meaningful connections',
    articles: [
      'Sending connection requests',
      'Messaging best practices',
      'Joining professional groups',
      'Building your network'
    ]
  },
  {
    icon: Settings,
    title: 'Account & Privacy',
    description: 'Manage your account',
    articles: [
      'Privacy settings',
      'Account security',
      'Data export',
      'Account deletion'
    ]
  }
]

const faqs = [
  {
    question: 'How do I create a professional profile?',
    answer: 'Click on your profile icon and select "Edit Profile". Add your work experience, education, skills, and a professional photo to make your profile stand out.'
  },
  {
    question: 'Can I hide my profile from certain companies?',
    answer: 'Yes, you can control who can see your profile through the Privacy Settings. You can make your profile visible to everyone, only recruiters, or completely private.'
  },
  {
    question: 'How does the job matching algorithm work?',
    answer: 'Our algorithm considers your skills, experience, location preferences, and job history to match you with relevant opportunities. You can also set specific job preferences to improve matches.'
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We use enterprise-grade encryption and security measures to protect your data. You can review our Privacy Policy for detailed information about how we handle your data.'
  },
  {
    question: 'How can I get more profile views?',
    answer: 'Complete your profile fully, add a professional photo, regularly post and engage with content, and actively participate in your professional network.'
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            How can we <span className="text-primary">help you?</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto mb-8">
            Find answers to common questions and learn how to make the most of NavIN.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-text mb-6">Help Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.title}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.title ? null : category.title
                    )}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                      selectedCategory === category.title
                        ? 'bg-primary text-white'
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{category.title}</div>
                        <div className={`text-sm ${
                          selectedCategory === category.title ? 'text-white/80' : 'text-text-muted'
                        }`}>
                          {category.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedCategory ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <h3 className="text-2xl font-bold text-text mb-6">{selectedCategory}</h3>
                <div className="space-y-4">
                  {categories.find(c => c.title === selectedCategory)?.articles.map((article, index) => (
                    <div
                      key={article}
                      className="p-4 bg-surface rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-text font-medium">{article}</span>
                        <Book className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-12 text-center"
              >
                <Book className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-text mb-4">
                  Choose a category to get started
                </h3>
                <p className="text-text-muted">
                  Select a help category from the left to explore relevant articles and guides.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-text text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-text mb-4">{faq.question}</h3>
                <p className="text-text-muted leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-card rounded-2xl p-8 border border-border text-center hover:shadow-lg transition-all duration-300">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-4">Live Chat</h3>
            <p className="text-text-muted mb-6">
              Get instant help from our support team during business hours.
            </p>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border text-center hover:shadow-lg transition-all duration-300">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-4">Email Support</h3>
            <p className="text-text-muted mb-6">
              Send us a detailed message and we'll respond within 24 hours.
            </p>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Send Email
            </button>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border text-center hover:shadow-lg transition-all duration-300">
            <Video className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-4">Video Tutorials</h3>
            <p className="text-text-muted mb-6">
              Watch step-by-step guides to learn NavIN features.
            </p>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Watch Videos
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}