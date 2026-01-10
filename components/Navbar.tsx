"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Home,
  Users,
  Briefcase,
  Bell,
  MessageCircle,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Plus,
  Zap,
  Shield,
  Crown,
  Sparkles,
  Sun,
  Moon
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useDarkMode } from "@/components/DarkModeProvider"
import SearchBar from "./SearchBar"
import Avatar from '@/components/Avatar'
import { useFirebase } from '@/components/FirebaseProvider'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3) // Mock notification count
  const [isPremium, setIsPremium] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [loadingPremiumStatus, setLoadingPremiumStatus] = useState(true)
  const pathname = usePathname()
  const { user, isLoaded, isSignedIn } = useUser()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { signOut: firebaseSignOut } = useFirebase()

  const navigation = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Network", href: "/network", icon: Users },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Messages", href: "/messages", icon: MessageCircle },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ]

  const profileMenuItems = [
    { name: "View Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help", href: "/help", icon: Shield },
    { name: "Sign out", href: "#", icon: LogOut },
  ]

  // Check premium status when user is loaded
  useEffect(() => {
    if (isLoaded && user && isSignedIn) {
      const checkPremiumStatus = async () => {
        try {
          setLoadingPremiumStatus(true)
          const response = await fetch('/api/user/premium-status')
          const data = await response.json()

          if (data.success) {
            setIsPremium(data.isPremium)
            setIsTrial(data.isTrial)
            if (data.trialEndsAt) {
              setTrialEndsAt(new Date(data.trialEndsAt))
            }
          }
        } catch (error) {
          console.error('Error checking premium status:', error)
        } finally {
          setLoadingPremiumStatus(false)
        }
      }

      checkPremiumStatus()
    } else {
      setIsPremium(false)
      setIsTrial(false)
      setTrialEndsAt(null)
      setLoadingPremiumStatus(false)
    }
  }, [isLoaded, user, isSignedIn])

  return (
    <nav className="sticky top-0 z-50 nav-premium shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  NavIn
                </span>
                {!loadingPremiumStatus && (
                  <div className="text-xs -mt-1">
                    {isPremium ? (
                      isTrial ? (
                        <span className="text-yellow-500 dark:text-yellow-400 font-medium">Trial</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Premium</span>
                      )
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Basic</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Premium Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 relative">
            <SearchBar />
          </div>

          {/* Premium Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={`Navigate to ${item.name} page`}
                  className={`relative group flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 touch-target focus-visible ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 mb-1" />
                    {item.name === "Notifications" && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center notification-badge">
                        <span className="text-xs font-bold text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Premium Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleDarkMode}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300 group relative touch-target focus-visible"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              <div className="relative">
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500 transition-colors duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors duration-300" />
                )}
              </div>
            </button>

            {/* Post Button */}
            <Button
              variant="outline"
              size="sm"
              aria-label="Create new post"
              className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 touch-target focus-visible"
            >
              <Plus className="w-4 h-4" />
              <span>Post</span>
            </Button>

            {/* User Profile */}
            {isLoaded && user ? (
              <div className="relative group">
                <button 
                  aria-label="User profile menu"
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300 touch-target focus-visible"
                >
                  <div className="relative">
                    <Avatar src={user.imageUrl || null} name={user.fullName || user.username || 'User'} size="sm" className="ring-2 ring-white dark:ring-gray-700 shadow-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors duration-200" />
                </button>

                {/* Profile Dropdown */}
                <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl shadow-black/10 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar src={user.imageUrl || null} name={user.fullName || user.username || 'User'} size="md" className="ring-2 ring-white dark:ring-gray-700" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{user.fullName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon
                    if (item.name === 'Sign out') {
                      return (
                        <button
                          key={item.name}
                          onClick={async () => {
                            try {
                              await firebaseSignOut()
                              window.location.href = '/sign-in'
                            } catch (err) {
                              console.error('Sign out failed', err)
                            }
                          }}
                          className="w-full text-left flex items-center px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors duration-200"
                        >
                          <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{item.name}</span>
                        </button>
                      )
                    }

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors duration-200"
                      >
                        <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/sign-in"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 h-9 flex items-center rounded-lg transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 h-9 flex items-center rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 touch-target focus-visible"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden nav-premium border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <SearchBar mobile={true} />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-label={`Navigate to ${item.name} page`}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 mobile-nav-item focus-visible ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile Actions */}
            <div className="pt-4 border-t border-gray-200/60 dark:border-gray-700/60 space-y-3">
              {/* Mobile Theme Switcher */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-900 dark:text-white font-medium">Theme</span>
                <button
                  onClick={toggleDarkMode}
                  aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300 touch-target focus-visible"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {isDarkMode ? 'Light' : 'Dark'}
                  </span>
                </button>
              </div>

              {isLoaded && user ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{user.fullName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                    </div>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        aria-label={item.name}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 rounded-xl transition-colors duration-200 touch-target focus-visible"
                      >
                        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{item.name}</span>
                      </Link>
                    )
                  })}
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-200 touch-target focus-visible"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg touch-target focus-visible"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
