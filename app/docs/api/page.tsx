'use client'

import { motion } from 'framer-motion'
import { Book, Code, Key, Zap, Shield, Globe } from 'lucide-react'

const endpoints = [
  {
    method: 'GET',
    path: '/api/users',
    description: 'Retrieve user profiles',
    icon: Book
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user',
    icon: Key
  },
  {
    method: 'GET',
    path: '/api/jobs',
    description: 'Search and filter jobs',
    icon: Globe
  },
  {
    method: 'POST',
    path: '/api/connections',
    description: 'Create professional connections',
    icon: Zap
  }
]

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Code className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            NavIN <span className="text-primary">API</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Build powerful integrations with our comprehensive REST API. Connect NavIN with your existing tools and workflows.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Getting Started</h2>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <p className="text-text-muted mb-4">
                  1. Sign up for a developer account
                </p>
                <p className="text-text-muted mb-4">
                  2. Generate your API key in the dashboard
                </p>
                <p className="text-text-muted">
                  3. Start building with our REST endpoints
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-text mb-4">Authentication</h3>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <code className="text-sm text-primary">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-text mb-4">Rate Limits</h3>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <ul className="space-y-2 text-text-muted">
                  <li>• Free tier: 1,000 requests/hour</li>
                  <li>• Professional: 10,000 requests/hour</li>
                  <li>• Enterprise: Unlimited</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-text mb-6">Popular Endpoints</h2>
            {endpoints.map((endpoint, index) => {
              const Icon = endpoint.icon
              return (
                <div
                  key={endpoint.path}
                  className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          endpoint.method === 'GET' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm text-text">{endpoint.path}</code>
                      </div>
                      <p className="text-text-muted">{endpoint.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12 text-center"
        >
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-text mb-4">
            Ready to integrate?
          </h3>
          <p className="text-text-muted mb-8 max-w-2xl mx-auto">
            Get your API key and start building. Our developer support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
              Get API Key
            </button>
            <button className="border-2 border-primary/20 text-primary px-8 py-4 rounded-2xl font-semibold hover:bg-primary/5 transition-colors">
              View Documentation
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}