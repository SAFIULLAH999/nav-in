'use client'

import { useState } from 'react'
import { User, Briefcase, GraduationCap, FolderOpen, FileText, Award, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { User as UserType } from '@/data/mockData'

interface ProfileTabsProps {
  user: UserType
  isOwnProfile?: boolean
}

export function ProfileTabs({ user, isOwnProfile = false }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('about')

  const tabs = [
    { id: 'about', label: 'About', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'posts', label: 'Posts', icon: FileText },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg border border-gray-200"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'about' && <AboutTab user={user} isOwnProfile={isOwnProfile} />}
        {activeTab === 'experience' && <ExperienceTab isOwnProfile={isOwnProfile} />}
        {activeTab === 'education' && <EducationTab isOwnProfile={isOwnProfile} />}
        {activeTab === 'projects' && <ProjectsTab isOwnProfile={isOwnProfile} />}
        {activeTab === 'skills' && <SkillsTab isOwnProfile={isOwnProfile} />}
        {activeTab === 'posts' && <PostsTab />}
      </div>
    </motion.div>
  )
}

function AboutTab({ user, isOwnProfile }: { user: UserType, isOwnProfile?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">About</h3>
        {isOwnProfile && (
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            Edit
          </button>
        )}
      </div>
      <p className="text-gray-700 leading-relaxed">
        Passionate software engineer with 5+ years of experience in full-stack development.
        Specialized in React, Node.js, and cloud technologies. Love building scalable web applications
        and mentoring junior developers.
      </p>

      <div>
        <h4 className="font-medium mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'].map((skill) => (
            <span key={skill} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Languages</h4>
        <p className="text-gray-700">English (Native) • Spanish (Conversational)</p>
      </div>
    </div>
  )
}

function ExperienceTab({ isOwnProfile }: { isOwnProfile?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Experience</h3>
        {isOwnProfile && (
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Add Experience
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="border-l-4 border-primary/20 pl-6 py-4 bg-gray-50 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg">Senior Software Engineer</h4>
              <p className="text-primary font-medium">NavIN Corp • Jan 2022 - Present</p>
            </div>
            {isOwnProfile && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-gray-700 mt-3 leading-relaxed">
            Lead development of key platform features, mentor junior developers, and architect scalable solutions.
            Implemented microservices architecture resulting in 40% improvement in system performance.
          </p>
        </div>

        <div className="border-l-4 border-gray-200 pl-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg">Software Engineer</h4>
              <p className="text-gray-600">TechCorp Inc. • Mar 2020 - Dec 2021</p>
            </div>
            {isOwnProfile && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-gray-700 mt-3 leading-relaxed">
            Developed and maintained React applications, collaborated with design team on user experience improvements.
            Built responsive dashboard used by 10,000+ daily active users.
          </p>
        </div>
      </div>
    </div>
  )
}

function EducationTab({ isOwnProfile }: { isOwnProfile?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Education</h3>
        {isOwnProfile && (
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Add Education
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="border-l-4 border-primary/20 pl-6 py-4 bg-gray-50 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg">Bachelor of Science in Computer Science</h4>
              <p className="text-primary font-medium">University of California, Berkeley</p>
              <p className="text-gray-600">2016 - 2020</p>
            </div>
            {isOwnProfile && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-gray-700 mt-3">
            GPA: 3.8/4.0 • Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectsTab({ isOwnProfile }: { isOwnProfile?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Projects</h3>
        {isOwnProfile && (
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Add Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-medium transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-lg">E-commerce Platform</h4>
            {isOwnProfile && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">React</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Node.js</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">PostgreSQL</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Built a full-stack e-commerce platform with user authentication, payment processing, and admin dashboard.
            Features include inventory management, order tracking, and analytics dashboard.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-medium transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-lg">Task Management App</h4>
            {isOwnProfile && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">React Native</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Firebase</span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Redux</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Mobile app for team task management with real-time updates and collaborative features.
            Supports offline functionality and cross-platform synchronization.
          </p>
        </div>
      </div>
    </div>
  )
}

function SkillsTab({ isOwnProfile }: { isOwnProfile?: boolean }) {
  const skillCategories = [
    {
      category: 'Frontend Development',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'JavaScript']
    },
    {
      category: 'Backend Development',
      skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'REST APIs']
    },
    {
      category: 'Cloud & DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform']
    },
    {
      category: 'Tools & Technologies',
      skills: ['Git', 'Webpack', 'Jest', 'Figma', 'Slack']
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Skills</h3>
        {isOwnProfile && (
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Add Skills
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skillCategories.map((category) => (
          <div key={category.category} className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              {category.category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PostsTab() {
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-center py-8">Posts from this user will appear here</p>
    </div>
  )
}
