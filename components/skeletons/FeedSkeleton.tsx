import React from 'react'

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-card rounded-xl shadow-soft border border-border p-6 animate-pulse">
          {/* Post Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-secondary rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-secondary rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-secondary rounded w-1/6"></div>
            </div>
            <div className="w-8 h-8 bg-secondary rounded"></div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <div className="h-4 bg-secondary rounded w-full mb-2"></div>
            <div className="h-4 bg-secondary rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-secondary rounded w-3/4"></div>
          </div>

          {/* Media placeholder */}
          <div className="mb-4">
            <div className="w-full h-64 bg-secondary rounded-lg"></div>
          </div>

          {/* Engagement buttons */}
          <div className="flex items-center space-x-6 pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-secondary rounded"></div>
              <div className="h-4 bg-secondary rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-secondary rounded"></div>
              <div className="h-4 bg-secondary rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-secondary rounded"></div>
              <div className="h-4 bg-secondary rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-secondary rounded"></div>
              <div className="h-4 bg-secondary rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}