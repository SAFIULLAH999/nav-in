'use client'

import { MapPin, Link as LinkIcon, Calendar, Edit3, Plus, Users, Eye, Award, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { User } from '@/data/mockData'

interface ProfileHeaderProps {
  user: User
  isOwnProfile?: boolean
}

export function ProfileHeader({ user, isOwnProfile = false }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-soft"
    >
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary via-primary/80 to-accent relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-16 left-6">
          <div className="w-32 h-32 bg-primary rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-soft">
            {user.avatar}
          </div>
        </div>
        {isOwnProfile && (
          <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-soft">
            <Edit3 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="pt-20 px-6 pb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
            <p className="text-lg text-gray-600 mb-3">{user.title} at {user.company}</p>

            {/* Contact Information */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm gap-4 mb-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {user.location}
              </div>
              <div className="flex items-center">
                <LinkIcon className="w-4 h-4 mr-1" />
                linkedin.com/in/johndoe
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Joined March 2020
              </div>
            </div>

            {/* About Summary */}
            <p className="text-gray-700 leading-relaxed max-w-2xl">
              Passionate software engineer with 5+ years of experience in full-stack development.
              Specialized in React, Node.js, and cloud technologies. Love building scalable web applications
              and mentoring junior developers.
            </p>
          </div>

          {isOwnProfile && (
            <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2 shadow-soft">
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-gray-900">{user.connections.toLocaleString()}</span>
            </div>
            <span className="text-gray-600 text-sm">connections</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Eye className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-gray-900">234</span>
            </div>
            <span className="text-gray-600 text-sm">profile views</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Briefcase className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <span className="text-gray-600 text-sm">jobs applied</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-gray-900">8</span>
            </div>
            <span className="text-gray-600 text-sm">certifications</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
