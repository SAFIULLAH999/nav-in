'use client'

import { Image, Video, Briefcase, FileText, Smile } from 'lucide-react'
import { motion } from 'framer-motion'

export function CreatePostCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-3xl border border-border p-6 shadow-soft hover:shadow-medium transition-all duration-300"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-soft">
          JD
        </div>
        <button className="flex-1 bg-secondary hover:bg-primary/5 rounded-2xl px-6 py-4 text-left transition-all duration-300 border border-border hover:border-primary/20">
          <span className="text-text-muted">Share something with your network...</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center space-x-8">
          <PostOption icon={Image} label="Photo" color="hover:text-primary" />
          <PostOption icon={Video} label="Video" color="hover:text-accent" />
          <PostOption icon={Briefcase} label="Job" color="hover:text-primary" />
          <PostOption icon={FileText} label="Article" color="hover:text-accent" />
        </div>
        <div className="flex items-center space-x-2">
          <Smile className="w-5 h-5 text-text-muted cursor-pointer hover:text-primary transition-colors" />
          <span className="text-xs text-text-muted">Anyone</span>
        </div>
      </div>
    </motion.div>
  )
}

function PostOption({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <button className={`flex items-center space-x-3 text-text-muted ${color} transition-all duration-300 p-3 rounded-xl hover:bg-secondary`}>
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
