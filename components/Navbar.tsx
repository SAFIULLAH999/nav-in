'use client'

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
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import SearchBar from "./SearchBar"
import Avatar from '@/components/Avatar'
import { useFirebase } from '@/components/FirebaseProvider'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const [isPremium, setIsPremium] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [loadingPremiumStatus, setLoadingPremiumStatus] = useState(true)
  const pathname = usePathname()
  const { user, isLoaded, isSignedIn } = useUser()
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
    <nav className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-text">
                NavIn
              </span>
            </Link>
          </div>

          {/* Compact Search Bar */}
          <div className="flex-1 max-w-md mx-4 relative">
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
                  className={`relative flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-150 touch-target focus-visible ${
                    isActive
                      ? "text-primary bg-muted"
                      : "text-text-muted hover:text-text hover:bg-muted"
                  }`}
                >
                   <div className="relative transition-transform duration-200">
                    <Icon className="w-5 h-5 mb-1 transition-all duration-200" />
                    {item.name === "Notifications" && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full border-2 border-surface flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium transition-all duration-200">{item.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full transition-all duration-300"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Premium Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Post Button */}
            <Button
              size="sm"
              aria-label="Create new post"
              className="hidden sm:flex items-center space-x-2 touch-target focus-visible"
            >
              <Plus className="w-4 h-4" />
              <span>Post</span>
            </Button>

            {/* User Profile */}
            {isLoaded && user ? (
              <div className="relative group">
                <button
                  aria-label="User profile menu"
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-muted transition-all duration-300 touch-target focus-visible"
                >
                  <div className="relative">
                    <Avatar src={user.imageUrl || null} name={user.fullName || user.username || 'User'} size="sm" className="ring-2 ring-surface shadow-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-surface flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-text" />
              ) : (
                <Menu className="w-6 h-6 text-text" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-muted text-primary"
                      : "text-text-muted hover:bg-muted hover:text-text"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
            <div className="pt-3 border-t border-border mt-3 space-y-2">
              {isLoaded && user ? (
                <>
                  <Link href="/profile" className="block">
                    <Button variant="secondary" className="w-full">View Profile</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => firebaseSignOut?.()}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="secondary" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
