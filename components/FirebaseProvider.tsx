'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { firebaseAuth, AuthUser, FirebaseAuthError } from '@/lib/firebase-auth';

interface FirebaseContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: clerkUser } = useUser();

  useEffect(() => {
    // If we have a Clerk user, create a mock Firebase user
    if (clerkUser) {
      const mockFirebaseUser: AuthUser = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        displayName: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: '',
        tenantId: null,
        phoneNumber: null,
        photoURL: clerkUser.imageUrl || null,
        providerId: 'clerk',
        delete: async () => Promise.resolve(),
        getIdToken: async (forceRefresh?: boolean) => {
          // Generate a longer-lasting token (24 hours)
          const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
          return `mock-token-${clerkUser.id}-${expirationTime}`;
        },
        getIdTokenResult: async (forceRefresh?: boolean) => {
          const expirationTime = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();
          return {
            token: `mock-token-${clerkUser.id}-${Date.now()}`,
            expirationTime,
            issuedAtTime: new Date().toISOString(),
            authTime: new Date().toISOString(),
            signInProvider: 'clerk',
            signInSecondFactor: null,
            claims: { user_id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress }
          };
        },
        reload: async () => Promise.resolve(),
        toJSON: () => ({ uid: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress }),
      };

      setUser(mockFirebaseUser as AuthUser);
      setLoading(false);

      // Persist a client-side access token so API calls can use it (CreatePostCard, fetches, etc.)
      ;(async () => {
        try {
          const token = await mockFirebaseUser.getIdToken()
          if (token) {
            // Store in localStorage to match other components' expectations
            localStorage.setItem('accessToken', token)
          }
        } catch (err) {
          console.error('Failed to set access token for Clerk user:', err)
        }
      })()
    } else {
      // No user, try Firebase auth state
      try {
        const unsubscribe = firebaseAuth.onAuthStateChange((user) => {
          setUser(user);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Firebase auth state listener failed:', error);
        setLoading(false);
      }
    }
  }, [clerkUser]);

  // Force re-render when auth state might have changed
  useEffect(() => {
    const handleFocus = () => {
      // Only check Firebase user if no Clerk user exists
      if (!clerkUser) {
        const currentUser = firebaseAuth.getCurrentUser();
        setUser(currentUser);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [clerkUser]);

  // Keep local storage cleaned up: remove access token when clerk user signs out
  useEffect(() => {
    if (!clerkUser) {
      localStorage.removeItem('accessToken')
      sessionStorage.removeItem('accessToken')
    }
  }, [clerkUser]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await firebaseAuth.signIn(email, password);
      // Force state update after successful sign in
      setUser(firebaseAuth.getCurrentUser());
      setLoading(false);
    } catch (error) {
      const authError = error as FirebaseAuthError;
      setError(authError.message);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      setLoading(true);
      await firebaseAuth.signUp(email, password, displayName);
    } catch (error) {
      const authError = error as FirebaseAuthError;
      setError(authError.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseAuth.signOutUser();
      // Force state update after sign out
      setUser(null);
      // Clear any stored client-side auth tokens
      localStorage.removeItem('accessToken')
      sessionStorage.removeItem('accessToken')
    } catch (error) {
      const authError = error as FirebaseAuthError;
      setError(authError.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await firebaseAuth.resetPassword(email);
    } catch (error) {
      const authError = error as FirebaseAuthError;
      setError(authError.message);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: FirebaseContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
