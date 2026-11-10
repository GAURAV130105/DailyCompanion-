import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  avatar?: string | null;
  timezone?: string;
  theme?: string;
}

interface AuthState {
  user: Profile | null;
  supabaseUser: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  setAuth: (supabaseUser: User, profile?: Partial<Profile>) => void;
  setDemoAuth: () => void;
  updateProfile: (profile: Partial<Profile>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      supabaseUser: null,
      isAuthenticated: false,
      isDemoMode: false,
      setAuth: (supabaseUser, profile) =>
        set({
          supabaseUser,
          isAuthenticated: true,
          isDemoMode: false,
          user: {
            id: supabaseUser.id,
            email: supabaseUser.email ?? '',
            full_name: profile?.full_name ?? supabaseUser.user_metadata?.full_name ?? '',
            username: profile?.username ?? supabaseUser.user_metadata?.username,
            first_name: profile?.first_name ?? supabaseUser.user_metadata?.first_name,
            last_name: profile?.last_name ?? supabaseUser.user_metadata?.last_name,
            avatar: profile?.avatar ?? supabaseUser.user_metadata?.avatar_url,
            timezone: profile?.timezone,
            theme: profile?.theme,
          },
        }),
      setDemoAuth: () =>
        set({
          supabaseUser: null,
          isAuthenticated: true,
          isDemoMode: true,
          user: {
            id: 'demo-user-12345',
            email: 'demo@studentlifeos.app',
            full_name: 'Aditya Sharma',
            first_name: 'Aditya',
            last_name: 'Sharma',
            username: 'aditya_sharma',
            timezone: 'Asia/Kolkata',
            theme: 'light',
          },
        }),
      updateProfile: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
        })),
      clearAuth: () =>
        set({ user: null, supabaseUser: null, isAuthenticated: false, isDemoMode: false }),
    }),
    { name: 'slos-auth-user' }
  )
);
