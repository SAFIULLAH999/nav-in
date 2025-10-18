'use client'

import React from 'react'
import { Clock, UserCheck, UserX, CheckCircle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface ApplicationStatsProps {
  stats: {
    total: number
    pending: number
    interviewing: number
    rejected: number
    accepted: number
  }
}

export const ApplicationStats: React.FC<ApplicationStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Interviewing',
      value: stats.interviewing,
      icon: UserCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: UserX,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-xl p-4 border border-border`}
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold text-text mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-text-muted">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}