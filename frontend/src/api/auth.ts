import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { getAuthenticatedUser } from '../lib/authHelper';
import type { User } from '../types';

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) return data as User;
  } catch (err) {
    // Missing table or network issue
  }
  return null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useCurrentUser = () => {
  const { isAuthenticated, supabaseUser, user } = useAuthStore();
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (supabaseUser) {
        const profile = await fetchProfile(supabaseUser.id);
        if (profile) return profile;
      }
      if (user) return user as unknown as User;
      return null;
    },
    enabled: isAuthenticated,
  });
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setAuth(data.user, profile ?? undefined);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      password_confirm?: string;
      first_name?: string;
      last_name?: string;
    }) => {
      const { password_confirm, first_name, last_name, ...rest } = userData;
      const fullName = [first_name, last_name].filter(Boolean).join(' ');

      const { data, error } = await supabase.auth.signUp({
        email: rest.email,
        password: rest.password,
        options: {
          data: { first_name, last_name, full_name: fullName },
        },
      });
      if (error) {
        // Helpful error hint if email rate limited
        if (error.message.includes('rate limit')) {
          throw new Error('Supabase email limit reached (3 emails/hr). Please use "⚡ Try Demo Mode" or disable "Confirm email" in Supabase Auth.');
        }
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setAuth(data.user, profile ?? undefined);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore signout network errors
      }
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const { updateProfile } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
          .select()
          .single();
        if (!error && data) return data as User;
      } catch (err) {
        // Fall back
      }
      return { id: user.id, email: user.email, ...updates } as User;
    },
    onSuccess: (data) => {
      updateProfile(data);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};
