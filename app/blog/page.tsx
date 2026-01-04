'use client'

import { motion } from 'framer-motion'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

const posts = [
  {
    id: 1,
    title: 'The Future of Professional Networking',
    excerpt: 'How AI and automation are reshaping the way professionals connect and grow their careers.',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Industry Insights',
    image: '/api/placeholder/400/200'
  },
  {
    id: 2,
    title: 'Building Authentic Professional Relationships',
    excerpt: 'Tips for creating meaningful connections that go beyond surface-level networking.',
    author: 'Marcus Johnson',
    date: '2024-01-12',
    readTime: '7 min read',
    category: 'Career Advice',
    image: '/api/placeholder/400/200'
  },
  {
    id: 3,
    title: 'Remote Work Trends in 2024',
    excerpt: 'Exploring how remote work is changing professional networking and job searching.',
    author: 'Elena Rodriguez',
    date: '2024-01-10',
    readTime: '6 min read',
    category: 'Remote Work',
    image: '/api/placeholder/400/200'
  },
  {
    id: 4,
    title: 'The Skills That Matter Most',
    excerpt: 'A data-driven analysis of the most in-demand skills across different industries.',
    author: 'David Kim',
    date: '2024-01-08',
    readTime: '8 min read',
    category: 'Skills',
    image: '/api/placeholder/400/200'
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-6">
            NavIN <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Insights, tips, and stories from the world of professional networking and career growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              <div className="aspect-video bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">
                    {post.category}
                  </span>
                  <span className="text-text-muted text-sm">{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-text mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-text-muted mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-text-muted text-sm">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                    <Calendar className="w-4 h-4 ml-2" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  
                  <Link
                    href={`/blog/${post.id}`}
                    className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="text-sm font-medium">Read more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-text mb-4">
              Stay Updated
            </h3>
            <p className="text-text-muted mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to get the latest insights and tips delivered directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}