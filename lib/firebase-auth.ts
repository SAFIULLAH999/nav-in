import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser extends User {
  // Add any additional user properties you need
}

export class FirebaseAuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'FirebaseAuthError';
  }
}

export const firebaseAuth = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Check if Firebase is properly configured
      if (!auth || typeof auth.currentUser === 'undefined') {
        throw new FirebaseAuthError('auth/not-configured', 'Firebase is not properly configured. Please check your environment variables.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user as AuthUser;
    } catch (error) {
      const authError = error as AuthError;
      throw new FirebaseAuthError(authError.code, authError.message);
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      // Check if Firebase is properly configured
      if (!auth || typeof auth.currentUser === 'undefined') {
        throw new FirebaseAuthError('auth/not-configured', 'Firebase is not properly configured. Please check your environment variables.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      return userCredential.user as AuthUser;
    } catch (error) {
      const authError = error as AuthError;
      throw new FirebaseAuthError(authError.code, authError.message);
    }
  },

  /**
   * Sign out current user
   */
  async signOutUser(): Promise<void> {
    try {
      // Check if Firebase is properly configured
      if (!auth || typeof auth.currentUser === 'undefined') {
        throw new FirebaseAuthError('auth/not-configured', 'Firebase is not properly configured. Please check your environment variables.');
      }

      await signOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      throw new FirebaseAuthError(authError.code, authError.message);
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Check if Firebase is properly configured
      if (!auth || typeof auth.currentUser === 'undefined') {
        throw new FirebaseAuthError('auth/not-configured', 'Firebase is not properly configured. Please check your environment variables.');
      }

      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const authError = error as AuthError;
      throw new FirebaseAuthError(authError.code, authError.message);
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      // Check if Firebase is properly configured
      if (!auth || typeof auth.currentUser === 'undefined') {
        throw new FirebaseAuthError('auth/not-configured', 'Firebase is not properly configured. Please check your environment variables.');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new FirebaseAuthError('auth/no-current-user', 'No user is currently signed in');
      }
      await updateProfile(user, updates);
    } catch (error) {
      const authError = error as AuthError;
      throw new FirebaseAuthError(authError.code, authError.message);
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    try {
      return auth?.currentUser as AuthUser | null;
    } catch (error) {
      console.warn('Firebase not configured, returning null user');
      return null;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    try {
      if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.warn('Firebase not configured, auth state listener will not work');
        // Return a no-op unsubscribe function
        return () => {};
      }
      return auth.onAuthStateChanged(callback as (user: User | null) => void);
    } catch (error) {
      console.warn('Firebase auth state listener failed:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  },
};
