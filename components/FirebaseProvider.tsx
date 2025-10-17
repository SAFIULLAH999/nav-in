'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
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
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await firebaseAuth.signIn(email, password);
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
