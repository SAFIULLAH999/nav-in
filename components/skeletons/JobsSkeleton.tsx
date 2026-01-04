import React from 'react'

export function JobsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card rounded-xl shadow-soft border border-border p-6 animate-pulse">
          {/* Job Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary rounded-lg"></div>
              <div>
                <div className="h-6 bg-secondary rounded w-48 mb-2"></div>
                <div className="h-4 bg-secondary rounded w-32 mb-1"></div>
                <div className="h-4 bg-secondary rounded w-24"></div>
              </div>
            </div>
            <div className="w-20 h-8 bg-secondary rounded"></div>
          </div>

          {/* Job Details */}
          <div className="mb-4">
            <div className="flex items-center space-x-4 mb-3">
              <div className="h-4 bg-secondary rounded w-16"></div>
              <div className="h-4 bg-secondary rounded w-20"></div>
              <div className="h-4 bg-secondary rounded w-16"></div>
            </div>
            <div className="h-4 bg-secondary rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-secondary rounded w-3/4"></div>
          </div>

          {/* Tags/Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-secondary rounded w-16"></div>
            <div className="h-6 bg-secondary rounded w-20"></div>
            <div className="h-6 bg-secondary rounded w-14"></div>
            <div className="h-6 bg-secondary rounded w-18"></div>
            <div className="h-6 bg-secondary rounded w-12"></div>
          </div>

          {/* Job Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="h-4 bg-secondary rounded w-24"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary rounded"></div>
              <div className="w-8 h-8 bg-secondary rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}