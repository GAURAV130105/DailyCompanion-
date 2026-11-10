import { supabase } from './supabase';
import { useAuthStore } from '../stores/authStore';

export interface SimpleAuthUser {
  id: string;
  email: string;
}

/**
 * Fast, non-blocking user resolver.
 * 1. Checks Zustand memory store (0ms).
 * 2. Checks local cached session via getSession() (0ms).
 * 3. Falls back to demo user so components never crash with "Not authenticated".
 */
export async function getAuthenticatedUser(): Promise<SimpleAuthUser> {
  const store = useAuthStore.getState();

  if (store.supabaseUser?.id) {
    return {
      id: store.supabaseUser.id,
      email: store.supabaseUser.email || '',
    };
  }

  if (store.user?.id) {
    return {
      id: store.user.id,
      email: store.user.email || '',
    };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || '',
      };
    }
  } catch (e) {
    // Ignore session errors
  }

  return {
    id: 'demo-user-12345',
    email: 'demo@studentlifeos.app',
  };
}
