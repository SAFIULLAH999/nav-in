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
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 hover:text-primary transition-colors">
            {job.title}
          </h3>
          <p className="text-gray-600 font-medium">{job.company}</p>
          <div className="flex items-center text-gray-500 text-sm mt-1 space-x-4">
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
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bookmark className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ExternalLink className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">
        {job.description}
      </p>

      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-900 mb-2">Requirements:</h4>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(job.requirements) && job.requirements.slice(0, 3).map((requirement, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
              {requirement}
            </span>
          ))}
          {Array.isArray(job.requirements) && job.requirements.length > 3 && (
            <span className="text-gray-500 text-xs px-2 py-1">
              +{job.requirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Posted {job.postedDate}
        </span>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.href = `/apply/${job.id}`}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Apply Now
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Save
          </button>
        </div>
      </div>
    </motion.div>
  )
}
