'use client'

import { Info, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { OnlineUsersList } from '@/components/OnlineUsersList'

export function RightSidebar() {
  return (
    <motion.aside
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      className="hidden xl:block w-72 lg:w-80 bg-surface border-l border-border p-6 space-y-6"
    >
      {/* Trending Topics */}
      <div className="bg-muted rounded-2xl border border-border p-6 shadow-md">
        <h3 className="font-semibold text-lg text-text mb-4">Trending Topics</h3>
        <div className="space-y-4">
          <TrendingTopic
            title="React 18"
            posts="12,543 posts"
            trending
          />
          <TrendingTopic
            title="Next.js 14"
            posts="8,921 posts"
          />
          <TrendingTopic
            title="TypeScript"
            posts="15,234 posts"
            trending
          />
          <TrendingTopic
            title="Web Development"
            posts="25,678 posts"
          />
        </div>
      </div>

      {/* Online Users */}
      <OnlineUsersList />

      {/* Suggested People */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-md">
        <h3 className="font-semibold text-lg text-text mb-4">People you may know</h3>
        <div className="space-y-4">
          <SuggestedPerson
            name="Sarah Johnson"
            title="Frontend Developer at Google"
            mutual={12}
          />
          <SuggestedPerson
            name="Mike Chen"
            title="Senior Software Engineer at Meta"
            mutual={8}
          />
          <SuggestedPerson
            name="Emily Davis"
            title="Product Manager at Netflix"
            mutual={15}
          />
        </div>
        <button className="text-primary text-sm mt-4 hover:underline font-medium transition-colors">
          Show more
        </button>
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-primary rounded-2xl p-8 text-white shadow-md">
        <div className="relative">
          <div className="flex items-center mb-3">
            <Info className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Sponsored</span>
          </div>
          <h4 className="font-bold text-xl mb-3">Upgrade to Premium</h4>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">
            Get unlimited access to insights and opportunities that matter to your career growth.
          </p>
          <button className="bg-accent text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-accent/90 transition-all duration-300 shadow-md">
            Learn more
          </button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm text-text-muted mb-6">
          <div className="space-y-2">
            <a href="#" className="block hover:text-primary transition-colors">About</a>
            <a href="#" className="block hover:text-primary transition-colors">Help Center</a>
            <a href="#" className="block hover:text-primary transition-colors">Privacy & Terms</a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block hover:text-primary transition-colors">Accessibility</a>
            <a href="#" className="block hover:text-primary transition-colors">Advertising</a>
            <a href="#" className="block hover:text-primary transition-colors">Business Services</a>
          </div>
        </div>
        <div className="pt-4 border-t border-border">
          <div className="text-sm text-text-muted">
            NavIN • Built with Next.js & TailwindCSS
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

function TrendingTopic({ title, posts, trending }: { title: string, posts: string, trending?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-background rounded-2xl cursor-pointer transition-all duration-300 group">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-1">
          <h4 className="font-medium text-sm text-text group-hover:text-primary transition-colors">{title}</h4>
          {trending && (
            <span className="bg-accent text-white text-xs px-2 py-1 rounded-full font-medium">
              Trending
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">{posts}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
    </div>
  )
}

function SuggestedPerson({ name, title, mutual }: { name: string, title: string, mutual: number }) {
  return (
    <div className="flex items-center space-x-4 p-2 rounded-2xl hover:bg-muted transition-all duration-300">
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-base">
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-text truncate">{name}</h4>
        <p className="text-xs text-text-muted truncate">{title}</p>
        <p className="text-xs text-text-muted">{mutual} mutual connections</p>
      </div>
      <button className="bg-accent text-white px-4 py-2 rounded-2xl text-xs font-medium hover:bg-accent/90 transition-colors shadow-md">
        Connect
      </button>
    </div>
  )
}
