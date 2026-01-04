'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { motion } from 'framer-motion'
import {
  Briefcase,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Award,
  MapPin,
  Calendar,
  Building
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Experience {
  id: string
  title: string
  company: string
  location?: string
  isCurrent: boolean
  startDate: string
  endDate?: string
  description?: string
}

interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy?: string
  startDate: string
  endDate?: string
  grade?: string
  description?: string
}

interface ProfileData {
  name: string
  username: string
  title: string
  company: string
  location: string
  bio: string
  website: string
  skills: string
}

interface NewExperienceData {
  title: string
  company: string
  location: string
  isCurrent: boolean
  startDate: string
  endDate: string
  description: string
}

interface NewEducationData {
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  grade: string
  description: string
}

export default function EditProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'education'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    username: '',
    title: '',
    company: '',
    location: '',
    bio: '',
    website: '',
    skills: ''
  })

  // Experience state
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [editingExperience, setEditingExperience] = useState<string | null>(null)
  const [newExperience, setNewExperience] = useState<NewExperienceData>({
    title: '',
    company: '',
    location: '',
    isCurrent: false,
    startDate: '',
    endDate: '',
    description: ''
  })

  // Education state
  const [education, setEducation] = useState<Education[]>([])
  const [editingEducation, setEditingEducation] = useState<string | null>(null)
  const [newEducation, setNewEducation] = useState<NewEducationData>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    grade: '',
    description: ''
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      // Load profile, experiences and education
      const [profileResponse, expResponse, eduResponse] = await Promise.all([
        fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/profile/experience', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/profile/education', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const [profileData, expData, eduData] = await Promise.all([
        profileResponse.json(),
        expResponse.json(),
        eduResponse.json()
      ])

      if (profileData.success) {
        setProfile({
          name: profileData.data.name || '',
          username: profileData.data.username || '',
          title: profileData.data.title || '',
          company: profileData.data.company || '',
          location: profileData.data.location || '',
          bio: profileData.data.bio || '',
          website: profileData.data.website || '',
          skills: profileData.data.skills ? JSON.stringify(profileData.data.skills) : ''
        })
      }

      if (expData.success) {
        setExperiences(expData.data)
      }

      if (eduData.success) {
        setEducation(eduData.data)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const updateData = {
        name: profile.name,
        username: profile.username,
        title: profile.title,
        company: profile.company,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        skills: profile.skills ? JSON.parse(profile.skills) : []
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const addExperience = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const response = await fetch('/api/profile/experience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newExperience)
      })

      const data = await response.json()

      if (data.success) {
        setExperiences(prev => [data.data, ...prev])
        setNewExperience({
          title: '',
          company: '',
          location: '',
          isCurrent: false,
          startDate: '',
          endDate: '',
          description: ''
        })
        toast.success('Experience added successfully')
      } else {
        toast.error(data.error || 'Failed to add experience')
      }
    } catch (error) {
      toast.error('Failed to add experience')
    } finally {
      setSaving(false)
    }
  }

  const addEducation = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      const response = await fetch('/api/profile/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEducation)
      })

      const data = await response.json()

      if (data.success) {
        setEducation(prev => [data.data, ...prev])
        setNewEducation({
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          grade: '',
          description: ''
        })
        toast.success('Education added successfully')
      } else {
        toast.error(data.error || 'Failed to add education')
      }
    } catch (error) {
      toast.error('Failed to add education')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 px-4 py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto pt-20 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Edit Profile</h1>
          <p className="text-text-muted">Manage your professional profile and experience</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col space-y-1 mb-8 bg-secondary rounded-lg p-1">
          {[
            { id: 'profile', label: 'Profile', icon: Award },
            { id: 'experience', label: 'Experience', icon: Briefcase },
            { id: 'education', label: 'Education', icon: GraduationCap }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-background text-primary shadow-soft'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'experience' && (
          <ExperienceSection
            experiences={experiences}
            setExperiences={setExperiences}
            newExperience={newExperience}
            setNewExperience={setNewExperience}
            onAdd={addExperience}
            saving={saving}
          />
        )}

        {activeTab === 'education' && (
          <EducationSection
            education={education}
            setEducation={setEducation}
            newEducation={newEducation}
            setNewEducation={setNewEducation}
            onAdd={addEducation}
            saving={saving}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSection profile={profile} setProfile={setProfile} onSave={saveProfile} saving={saving} />
        )}
      </div>
    </div>
  )
}

function ExperienceSection({ experiences, newExperience, setNewExperience, onAdd, saving }: any) {
  return (
    <div className="space-y-6">
      {/* Add New Experience */}
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Work Experience</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Job Title</label>
            <input
              type="text"
              value={newExperience.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Company</label>
            <input
              type="text"
              value={newExperience.company}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Location</label>
            <input
              type="text"
              value={newExperience.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="San Francisco, CA"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={newExperience.isCurrent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, isCurrent: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isCurrent" className="text-sm text-text">Currently working here</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Start Date</label>
            <input
              type="date"
              value={newExperience.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {!newExperience.isCurrent && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">End Date</label>
              <input
                type="date"
                value={newExperience.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text mb-2">Description</label>
          <textarea
            value={newExperience.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewExperience((prev: NewExperienceData) => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Describe your role and achievements..."
          />
        </div>

        <button
          onClick={onAdd}
          disabled={saving || !newExperience.title || !newExperience.company}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Adding...' : 'Add Experience'}</span>
        </button>
      </div>

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.map((exp: Experience) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-soft border border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-text">{exp.title}</h4>
                  {exp.isCurrent && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm text-text-muted">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>{exp.company}</span>
                  </div>

                  {exp.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{exp.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(exp.startDate).toLocaleDateString()} - {' '}
                      {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                    </span>
                  </div>
                </div>

                {exp.description && (
                  <p className="text-sm text-text-muted mt-3">{exp.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button className="p-2 text-text-muted hover:text-text">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-text-muted hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function EducationSection({ education, newEducation, setNewEducation, onAdd, saving }: any) {
  return (
    <div className="space-y-6">
      {/* Add New Education */}
      <div className="bg-card rounded-xl shadow-soft border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Education</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Institution</label>
            <input
              type="text"
              value={newEducation.institution}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, institution: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="University of California"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Degree</label>
            <input
              type="text"
              value={newEducation.degree}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, degree: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Bachelor of Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Field of Study</label>
            <input
              type="text"
              value={newEducation.fieldOfStudy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, fieldOfStudy: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Grade/GPA</label>
            <input
              type="text"
              value={newEducation.grade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="3.8 GPA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Start Date</label>
            <input
              type="date"
              value={newEducation.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">End Date</label>
            <input
              type="date"
              value={newEducation.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text mb-2">Description</label>
          <textarea
            value={newEducation.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEducation((prev: NewEducationData) => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Relevant coursework, activities, achievements..."
          />
        </div>

        <button
          onClick={onAdd}
          disabled={saving || !newEducation.institution || !newEducation.degree}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Adding...' : 'Add Education'}</span>
        </button>
      </div>

      {/* Education List */}
      <div className="space-y-4">
        {education.map((edu: Education) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-soft border border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-text">{edu.degree}</h4>
                </div>

                <div className="space-y-1 text-sm text-text-muted">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>{edu.institution}</span>
                  </div>

                  {edu.fieldOfStudy && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>{edu.fieldOfStudy}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(edu.startDate).toLocaleDateString()} - {' '}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                    </span>
                  </div>

                  {edu.grade && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>{edu.grade}</span>
                    </div>
                  )}
                </div>

                {edu.description && (
                  <p className="text-sm text-text-muted mt-3">{edu.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button className="p-2 text-text-muted hover:text-text">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-text-muted hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ProfileSection({ profile, setProfile, onSave, saving }: any) {
  return (
    <div className="bg-card rounded-xl shadow-soft border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4">Basic Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Username</label>
          <input
            type="text"
            value={profile.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, username: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Professional Title</label>
          <input
            type="text"
            value={profile.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Software Engineer"
          />
        </div>

       <div>
         <label className="block text-sm font-medium text-text mb-2">Company</label>
         <input
           type="text"
           value={profile.company}
           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="San Francisco, CA"
          />
       </div>
     </div>

     <div className="mt-4">
       <label className="block text-sm font-medium text-text mb-2">Bio</label>
       <textarea
         value={profile.bio}
         onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile((prev: ProfileData) => ({ ...prev, bio: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-text mb-2">Skills</label>
        <input
          type="text"
          value={profile.skills}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile((prev: ProfileData) => ({ ...prev, skills: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="JavaScript, React, Node.js, Python"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
