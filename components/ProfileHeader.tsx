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
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-md"
    >
      {/* Banner */}
      <div className="h-48 bg-primary relative">
        <div className="absolute inset-0 bg-primary/80" />
        <div className="absolute -bottom-16 left-6">
          <div className="w-32 h-32 bg-primary rounded-full border-4 border-card flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://via.placeholder.com/150';
                }}
              />
            ) : (
              user.avatar
            )}
          </div>
        </div>
        {isOwnProfile && (
          <button className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-text p-2 rounded-full hover:bg-card transition-colors shadow-md">
            <Edit3 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="pt-20 px-6 pb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text mb-1">{user.name}</h1>
            <p className="text-lg text-text-muted mb-3">{user.title} at {user.company}</p>

            {/* Contact Information */}
            <div className="flex flex-wrap items-center text-text-muted text-sm gap-4 mb-4">
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
            <p className="text-text-muted leading-relaxed max-w-2xl">
              Passionate software engineer with 5+ years of experience in full-stack development.
              Specialized in React, Node.js, and cloud technologies. Love building scalable web applications
              and mentoring junior developers.
            </p>
          </div>

          {isOwnProfile && (
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2 shadow-md">
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

       {/* Connection Tiers Visualization */}
       {isOwnProfile && (
         <div className="pt-6 border-t border-border">
           <h3 className="text-lg font-semibold text-text mb-4">Your Network Tiers</h3>
           <div className="grid grid-cols-3 gap-4">
             <div className="text-center">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                 <Users className="w-8 h-8 text-primary" />
               </div>
               <div className="text-2xl font-bold text-text">128</div>
               <div className="text-sm text-text-muted">1st Degree</div>
               <div className="text-xs text-text-muted">Direct connections</div>
             </div>
             <div className="text-center">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                 <Users className="w-8 h-8 text-accent" />
               </div>
               <div className="text-2xl font-bold text-text">456</div>
               <div className="text-sm text-text-muted">2nd Degree</div>
               <div className="text-xs text-text-muted">Connections of connections</div>
             </div>
             <div className="text-center">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                 <Users className="w-8 h-8 text-primary" />
               </div>
               <div className="text-2xl font-bold text-text">1,234</div>
               <div className="text-sm text-text-muted">3rd Degree</div>
               <div className="text-xs text-text-muted">Extended network</div>
             </div>
           </div>
         </div>
       )}

       {/* Stats Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
         <div className="text-center">
           <div className="flex items-center justify-center mb-1">
             <Users className="w-5 h-5 text-primary mr-2" />
             <span className="text-2xl font-bold text-text">{user.connections.toLocaleString()}</span>
           </div>
           <span className="text-text-muted text-sm">connections</span>
         </div>

         <div className="text-center">
           <div className="flex items-center justify-center mb-1">
             <Eye className="w-5 h-5 text-primary mr-2" />
             <span className="text-2xl font-bold text-text">234</span>
           </div>
           <span className="text-text-muted text-sm">profile views</span>
         </div>

         <div className="text-center">
           <div className="flex items-center justify-center mb-1">
             <Briefcase className="w-5 h-5 text-primary mr-2" />
             <span className="text-2xl font-bold text-text">12</span>
           </div>
           <span className="text-text-muted text-sm">jobs applied</span>
         </div>

         <div className="text-center">
           <div className="flex items-center justify-center mb-1">
             <Award className="w-5 h-5 text-primary mr-2" />
             <span className="text-2xl font-bold text-text">8</span>
           </div>
           <span className="text-text-muted text-sm">certifications</span>
         </div>
       </div>
     </div>
   </motion.div>
 )
}
