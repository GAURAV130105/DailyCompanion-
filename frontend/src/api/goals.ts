import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete } from '../lib/localDb';
import type { Goal } from '../types';

export const useGoals = () => {
  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudGoals: Goal[] = [];
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudGoals = data as Goal[];
        }
      } catch (err) {
        // Fall back
      }

      const localGoals = localGet<Goal>('goals');
      const map = new Map<string, Goal>();
      for (const g of localGoals) {
        if (g && g.id) map.set(g.id, g);
      }
      for (const g of cloudGoals) {
        if (g && g.id) map.set(g.id, g);
      }

      return Array.from(map.values()).sort((a, b) =>
        (b.created_at || '').localeCompare(a.created_at || '')
      );
    },
  });
};

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Goal>) => {
      const user = await getAuthenticatedUser();
      const localRecord = localInsert<Goal>('goals', {
        ...data,
        user_id: user.id,
        status: data.status || 'active',
        progress: Number(data.progress || 0),
        created_at: new Date().toISOString(),
      } as any);

      try {
        const { data: result, error } = await supabase
          .from('goals')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) {
          localUpdate<Goal>('goals', localRecord.id, result as any);
          return result as Goal;
        }
      } catch (err) {
        // Handled via localRecord
      }
      return localRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const updatedLocal = localUpdate<Goal>('goals', id, updates as any);
      try {
        const { data, error } = await supabase
          .from('goals')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Goal;
      } catch (err) {
        // Fall through
      }
      return (updatedLocal || { id, ...updates }) as Goal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('goals', id);
      try {
        await supabase.from('goals').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};
