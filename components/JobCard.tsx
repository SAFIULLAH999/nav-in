'use client'

import { MapPin, Clock, DollarSign, Bookmark, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Job } from '@/data/mockData'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-card rounded-xl border border-border p-6 shadow-soft hover:shadow-medium transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-text hover:text-primary transition-colors">
            {job.title}
          </h3>
          <p className="text-primary font-medium">{job.company}</p>
          <div className="flex items-center text-text-muted text-sm mt-1 space-x-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {job.location}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {job.type}
            </div>
            {job.salary && (
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {job.salary}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Bookmark className="w-5 h-5 text-text-muted" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ExternalLink className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>

      <p className="text-text mb-4 leading-relaxed">
        {job.description}
      </p>

      <div className="mb-4">
        <h4 className="font-medium text-sm text-text mb-2">Requirements:</h4>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(job.requirements) && job.requirements.slice(0, 3).map((requirement, index) => (
            <span key={index} className="bg-secondary text-text-muted px-2 py-1 rounded-md text-xs">
              {requirement}
            </span>
          ))}
          {Array.isArray(job.requirements) && job.requirements.length > 3 && (
            <span className="text-text-muted text-xs px-2 py-1">
              +{job.requirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-text-muted">
          Posted {job.postedDate}
        </span>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.href = `/apply/${job.id}`}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply Now
          </button>
          <button className="border border-border text-text px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
            Save
          </button>
        </div>
      </div>
    </motion.div>
  )
}
