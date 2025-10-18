'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();

  useEffect(() => {
    // If we have a NextAuth session, create a mock Firebase user
    if (session?.user) {
      const mockFirebaseUser: AuthUser = {
        uid: session.user.id || `user_${session.user.email}`,
        email: session.user.email!,
        displayName: session.user.name || session.user.email?.split('@')[0] || null,
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
        photoURL: session.user.image || null,
        providerId: 'nextauth',
        delete: async () => Promise.resolve(),
        getIdToken: async () => Promise.resolve(`mock-token-${session.user.id}`),
        getIdTokenResult: async () => Promise.resolve({
          token: `mock-token-${session.user.id}`,
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          issuedAtTime: new Date().toISOString(),
          authTime: new Date().toISOString(),
          signInProvider: 'nextauth',
          signInSecondFactor: null,
          claims: { user_id: session.user.id, email: session.user.email }
        }),
        reload: async () => Promise.resolve(),
        toJSON: () => ({ uid: session.user.id, email: session.user.email }),
      };

      setUser(mockFirebaseUser as AuthUser);
      setLoading(false);
    } else {
      // No session, try Firebase auth state
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
  }, [session]);

  // Force re-render when auth state might have changed
  useEffect(() => {
    const handleFocus = () => {
      // Check for current user when window regains focus
      const currentUser = firebaseAuth.getCurrentUser();
      setUser(currentUser);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
