'use client';

import { useUser, useAuth } from '@clerk/nextjs';

export interface SessionData {
  user: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
  };
}

export function useClerkSession() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const session = isSignedIn && user ? {
    user: {
      id: user.id,
      name: user.fullName || user.firstName,
      email: user.primaryEmailAddress?.emailAddress,
      username: user.username,
      avatar: user.imageUrl,
    }
  } : null;

  const status = !authLoaded || !userLoaded 
    ? 'loading' 
    : isSignedIn 
      ? 'authenticated' 
      : 'unauthenticated';

  return {
    data: session,
    status,
    user: user || null,
    isSignedIn,
    isLoaded: authLoaded && userLoaded,
  };
}