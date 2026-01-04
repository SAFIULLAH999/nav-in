'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
  animated?: boolean
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = false,
  animated = true 
}: SkeletonProps) {
  return (
    <div
      className={`bg-secondary ${rounded ? 'rounded-full' : 'rounded'} ${animated ? 'animate-pulse' : ''} ${className}`}
      style={{ width, height }}
    />
  )
}

export function JobCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-xl shadow-soft border border-border p-6"
    >
      <div className="flex items-start space-x-4">
        <Skeleton width={48} height={48} rounded className="flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton width={100} height={14} />
            <Skeleton width={80} height={14} />
            <Skeleton width={120} height={14} />
          </div>
          <Skeleton width="100%" height={16} />
          <div className="flex space-x-2">
            <Skeleton width={60} height={20} rounded />
            <Skeleton width={80} height={20} rounded />
            <Skeleton width={70} height={20} rounded />
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <Skeleton width={60} height={20} rounded />
          <Skeleton width={80} height={32} rounded />
        </div>
      </div>
    </motion.div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-xl shadow-soft border border-border p-6"
    >
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width={64} height={64} rounded className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="80%" height={14} />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="70%" height={16} />
      </div>
      <div className="flex space-x-2 mt-4">
        <Skeleton width={60} height={20} rounded />
        <Skeleton width={80} height={20} rounded />
        <Skeleton width={70} height={20} rounded />
      </div>
    </motion.div>
  )
}

export function FeedPostSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-xl shadow-soft border border-border p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton width={40} height={40} rounded />
        <div className="space-y-1">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
      <Skeleton width="100%" height={200} className="mb-4" />
      <div className="flex space-x-4">
        <Skeleton width={60} height={20} rounded />
        <Skeleton width={80} height={20} rounded />
        <Skeleton width={70} height={20} rounded />
      </div>
    </motion.div>
  )
}

export function StatsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-xl shadow-soft border border-border p-6 text-center"
    >
      <Skeleton width={60} height={32} className="mx-auto mb-2" />
      <Skeleton width="100%" height={16} />
    </motion.div>
  )
}

export function CompanyCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl p-6 border border-border"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Skeleton width={48} height={48} rounded />
          <div className="space-y-2">
            <Skeleton width={100} height={18} />
            <Skeleton width={120} height={14} />
          </div>
        </div>
        <Skeleton width={20} height={20} />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>
      <Skeleton width="100%" height={40} rounded />
    </motion.div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          <Skeleton width={32} height={32} rounded />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={60} height={20} rounded />
        </div>
      ))}
    </motion.div>
  )
}