import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete } from '../lib/localDb';
import type { Task, TaskTag } from '../types';

export const useTasks = (params?: { status?: string; priority?: string; search?: string }) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (params?.status) query = query.eq('status', params.status);
        if (params?.priority) query = query.eq('priority', params.priority);
        if (params?.search) query = query.ilike('title', `%${params.search}%`);

        const { data, error } = await query;
        if (!error && data) return data as Task[];
      } catch (err) {
        // Fall back to localDb
      }

      // Local fallback
      let list = localGet<Task>('tasks');
      if (params?.status) list = list.filter((t) => t.status === params.status);
      if (params?.priority) list = list.filter((t) => t.priority === params.priority);
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((t) => t.title.toLowerCase().includes(q));
      }
      return list;
    },
  });
};

export const useTaskTags = () => {
  return useQuery({
    queryKey: ['taskTags'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('task_tags')
          .select('*')
          .eq('user_id', user.id);
        if (!error && data) return data as TaskTag[];
      } catch (err) {
        // Fall back
      }
      return [
        { id: 'tag-1', name: 'Polity', color: '#3b82f6' },
        { id: 'tag-2', name: 'History', color: '#f59e0b' },
        { id: 'tag-3', name: 'Economy', color: '#10b981' },
      ] as TaskTag[];
    },
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({ ...task, user_id: user.id })
          .select()
          .single();
        if (!error && data) return data as Task;
      } catch (err) {
        // Fall through to local
      }
      return localInsert<Task>('tasks', {
        ...task,
        user_id: user.id,
        created_at: new Date().toISOString(),
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Task;
      } catch (err) {
        // Fall through to local
      }
      const updated = localUpdate<Task>('tasks', id, updates);
      return (updated || updates) as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Task;
      } catch (err) {
        // Fall through to local
      }
      const updated = localUpdate<Task>('tasks', id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return updated as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) return;
      } catch (err) {
        // Fall through to local
      }
      localDelete('tasks', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};
