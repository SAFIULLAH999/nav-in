'use client'

import { Users, Briefcase, MessageCircle, Settings, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function LeftSidebar() {
  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="hidden lg:block w-64 xl:w-80 bg-surface border-r border-border p-6 space-y-6"
    >
      {/* User Profile Card */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl border border-primary/10 p-6 shadow-soft">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-soft">
            JD
          </div>
          <div>
            <h3 className="font-semibold text-base text-text">John Doe</h3>
            <p className="text-sm text-text-muted">Senior Software Engineer</p>
          </div>
        </div>
        <div className="text-sm text-text-muted mb-4">
          1,234 connections
        </div>
        <button className="w-full text-sm text-primary hover:bg-primary/10 py-3 px-4 rounded-2xl transition-all duration-300 font-medium border border-primary/20 hover:border-primary/40">
          View Profile
        </button>
      </div>

      {/* Navigation Links */}
      <div className="space-y-3">
        <SidebarLink icon={Users} label="My Network" count="45" href="/network" />
        <SidebarLink icon={Briefcase} label="Jobs" href="/jobs" />
        <SidebarLink icon={MessageCircle} label="Messages" count="3" href="/messages" />
        <SidebarLink icon={Settings} label="Settings" href="/settings" />
      </div>

      {/* Recent Activity */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-base font-semibold text-text mb-4">Recent Activity</h4>
        <div className="space-y-3">
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-secondary">
            # React Development
          </div>
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-secondary">
            # Frontend Engineering
          </div>
          <div className="text-sm text-text-muted hover:text-primary cursor-pointer transition-colors p-2 rounded-xl hover:bg-secondary">
            # Career Growth
          </div>
        </div>
        <button className="text-sm text-primary mt-3 hover:underline font-medium">
          Show more
        </button>
      </div>
    </motion.aside>
  )
}

function SidebarLink({ icon: Icon, label, count, href }: { icon: any, label: string, count?: string, href?: string }) {
  const content = (
    <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-2xl cursor-pointer transition-all duration-300 group w-full">
      <div className="flex items-center space-x-4">
        <Icon className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
        <span className="text-base font-medium text-text group-hover:text-primary transition-colors">{label}</span>
      </div>
      {count && (
        <span className="bg-primary text-white text-sm px-3 py-1 rounded-full font-medium">
          {count}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    )
  }

  return content
}
