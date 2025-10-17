'use client'

import { useState } from 'react'
import { ArrowLeft, Save, User, Briefcase, GraduationCap, Award, Settings as SettingsIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: 'John Doe',
    title: 'Senior Software Engineer',
    company: 'NavIN Corp',
    location: 'San Francisco, CA',
    email: 'john.doe@navin.com',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
    website: 'https://johndoe.dev',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
    experience: [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'NavIN Corp',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Lead development of key platform features, mentor junior developers, and architect scalable solutions.'
      }
    ],
    education: [
      {
        id: '1',
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        startDate: '2016-09',
        endDate: '2020-05',
        description: 'GPA: 3.8/4.0 • Relevant Coursework: Data Structures, Algorithms, Software Engineering'
      }
    ]
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings: ' + result.error)
      }
    } catch (error) {
      alert('Failed to save settings: ' + error)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'account', label: 'Account', icon: SettingsIcon },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/feed" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-lg border border-border p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface rounded-lg border border-border p-6"
          >
            {activeTab === 'profile' && <ProfileSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'experience' && <ExperienceSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'education' && <EducationSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'skills' && <SkillsSettings formData={formData} setFormData={setFormData} />}
            {activeTab === 'account' && <AccountSettings formData={formData} setFormData={setFormData} />}

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <button
                onClick={handleSave}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Profile Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Professional Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Company</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Tell us about yourself..."
        />
      </div>
    </div>
  )
}

function ExperienceSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    }
    setFormData({
      ...formData,
      experience: [...formData.experience, newExperience]
    })
  }

  const updateExperience = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      experience: formData.experience.map((exp: any) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    })
  }

  const removeExperience = (id: string) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((exp: any) => exp.id !== id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Work Experience</h2>
        <button
          onClick={addExperience}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Add Experience
        </button>
      </div>

      <div className="space-y-6">
        {formData.experience.map((exp: any) => (
          <div key={exp.id} className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">Experience Entry</h3>
              <button
                onClick={() => removeExperience(exp.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                rows={3}
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your role and achievements..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EducationSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      startDate: '',
      endDate: '',
      description: ''
    }
    setFormData({
      ...formData,
      education: [...formData.education, newEducation]
    })
  }

  const updateEducation = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      education: formData.education.map((edu: any) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    })
  }

  const removeEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter((edu: any) => edu.id !== id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Education</h2>
        <button
          onClick={addEducation}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Add Education
        </button>
      </div>

      <div className="space-y-6">
        {formData.education.map((edu: any) => (
          <div key={edu.id} className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">Education Entry</h3>
              <button
                onClick={() => removeEducation(edu.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Bachelor of Science in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">School</label>
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Additional Information</label>
              <textarea
                rows={2}
                value={edu.description}
                onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="GPA, relevant coursework, achievements..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  const [newSkill, setNewSkill] = useState('')

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill: string) => skill !== skillToRemove)
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Skills</h2>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Add a skill..."
        />
        <button
          onClick={addSkill}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {formData.skills.map((skill: string) => (
          <span
            key={skill}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center space-x-2"
          >
            <span>{skill}</span>
            <button
              onClick={() => removeSkill(skill)}
              className="text-primary hover:text-primary/70"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function AccountSettings({ formData, setFormData }: { formData: any, setFormData: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Account Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button className="text-red-500 hover:text-red-700 font-medium">
          Delete Account
        </button>
      </div>
    </div>
  )
}
