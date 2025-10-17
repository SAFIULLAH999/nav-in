'use client'

import { useState } from 'react'
import { Search, Home, Users, Briefcase, MessageCircle, Bell, ChevronDown, Menu, User, Settings, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur-sm shadow-soft border-b border-border z-50"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Search */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold text-text">NavIN</span>
          </Link>

          <div className="hidden md:flex items-center bg-secondary rounded-full px-4 py-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-text-muted mr-3" />
            <input
              type="text"
              placeholder="Search for people, jobs, posts..."
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="hidden lg:flex items-center space-x-1">
          <NavIcon icon={Home} label="Home" href="/feed" />
          <NavIcon icon={Users} label="Network" href="/network" />
          <NavIcon icon={Briefcase} label="Jobs" href="/jobs" />
          <NavIcon icon={MessageCircle} label="Messages" href="/messages" />
          <NavIcon icon={Bell} label="Notifications" href="/notifications" />

          {/* Profile Menu */}
          <div className="ml-4 pl-4 border-l border-border">
            <ProfileMenu />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-text" />
        </button>
      </div>
    </motion.nav>
  )
}

function NavIcon({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50 group"
    >
      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  )
}

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
          JD
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-48 bg-surface rounded-lg border border-border shadow-soft py-2 z-50"
        >
          <Link
            href="/profile"
            className="flex items-center space-x-3 px-4 py-2 hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">View Profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-4 py-2 hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </Link>
          <div className="border-t border-border mt-2 pt-2">
            <button className="flex items-center space-x-3 px-4 py-2 hover:bg-secondary transition-colors w-full text-left text-red-500">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
