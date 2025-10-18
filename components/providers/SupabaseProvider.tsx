'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

interface SupabaseContextType {
  supabase: SupabaseClient | null
  user: User | null
  session: Session | null
  isConnected: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  subscribeToTable: (table: string, callback: (payload: any) => void) => () => void
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not provided')
      return
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    setSupabase(supabaseClient)

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsConnected(true)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsConnected(true)
    })

    return () => subscription.unsubscribe()
  }, [supabaseUrl, supabaseAnonKey])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized')
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized')
    return supabase.auth.signUp({ email, password })
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not initialized')
    return supabase.auth.signOut()
  }

  const subscribeToTable = (table: string, callback: (payload: any) => void) => {
    if (!supabase) return () => {}

    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const value: SupabaseContextType = {
    supabase,
    user,
    session,
    isConnected,
    signIn,
    signUp,
    signOut,
    subscribeToTable
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}