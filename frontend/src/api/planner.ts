import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete, localSet } from '../lib/localDb';
import type { DailyPlan, TimeBlock } from '../types';

export const useDailyPlans = (params?: { date?: string }) => {
  return useQuery<DailyPlan[]>({
    queryKey: ['dailyPlans', params],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        let query = supabase
          .from('daily_plans')
          .select('*, time_blocks(*)')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (params?.date) query = query.eq('date', params.date);

        const { data, error } = await query;
        if (!error && data) return data as DailyPlan[];
      } catch (err) {
        // Fall back
      }
      let plans = localGet<DailyPlan>('daily_plans');
      if (params?.date) {
        plans = plans.filter((p) => p.date === params.date);
      }
      return plans;
    },
  });
};

export const useDailyPlan = (id: string) => {
  return useQuery<DailyPlan>({
    queryKey: ['dailyPlan', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('daily_plans')
          .select('*, time_blocks(*)')
          .eq('id', id)
          .single();
        if (!error && data) return data as DailyPlan;
      } catch (err) {
        // Fall back
      }
      const plans = localGet<DailyPlan>('daily_plans');
      return plans.find((p) => p.id === id) || plans[0];
    },
    enabled: !!id,
  });
};

export const useDailyPlanByDate = (date: string) => {
  return useQuery<DailyPlan | null>({
    queryKey: ['dailyPlanByDate', date],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('daily_plans')
          .select('*, time_blocks(*)')
          .eq('user_id', user.id)
          .eq('date', date)
          .maybeSingle();
        if (!error && data) return data as DailyPlan;
      } catch (err) {
        // Fall back
      }
      const plans = localGet<DailyPlan>('daily_plans');
      return plans.find((p) => p.date === date) || null;
    },
  });
};

export const useCreateDailyPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DailyPlan>) => {
      const user = await getAuthenticatedUser();
      const payload = {
        date: data.date,
        primary_goal: data.primary_goal || '',
        notes: data.notes || '',
        user_id: user.id,
      };
      try {
        const { data: result, error } = await supabase
          .from('daily_plans')
          .insert(payload)
          .select('*, time_blocks(*)')
          .single();
        if (!error && result) {
          localInsert<DailyPlan>('daily_plans', result as any);
          return result as DailyPlan;
        }
      } catch (err) {
        // Fall through
      }
      return localInsert<DailyPlan>('daily_plans', {
        ...payload,
        time_blocks: [],
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
      qc.invalidateQueries({ queryKey: ['dailyPlanByDate'] });
    },
  });
};

export const useUpdateDailyPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DailyPlan> & { id: string }) => {
      try {
        const { data: result, error } = await supabase
          .from('daily_plans')
          .update(data)
          .eq('id', id)
          .select('*, time_blocks(*)')
          .single();
        if (!error && result) {
          localUpdate<DailyPlan>('daily_plans', id, result as any);
          return result as DailyPlan;
        }
      } catch (err) {
        // Fall through
      }
      const updated = localUpdate<DailyPlan>('daily_plans', id, data as any);
      return (updated || { id, ...data }) as DailyPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
      qc.invalidateQueries({ queryKey: ['dailyPlanByDate'] });
    },
  });
};

export const useTimeBlocks = (params?: { daily_plan?: string; daily_plan_id?: string; date?: string }) => {
  return useQuery<TimeBlock[]>({
    queryKey: ['timeBlocks', params],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      const planId = params?.daily_plan_id || params?.daily_plan;
      let cloudBlocks: TimeBlock[] = [];
      try {
        let query = supabase
          .from('time_blocks')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (planId) {
          query = query.eq('daily_plan_id', planId);
        }
        if (params?.date) {
          query = query.eq('date', params.date);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudBlocks = data.map((b: any) => ({
            ...b,
            daily_plan: b.daily_plan_id || b.daily_plan,
            daily_plan_id: b.daily_plan_id || b.daily_plan,
          })) as TimeBlock[];
        }
      } catch (err) {
        // Fall back
      }

      let localBlocks = localGet<TimeBlock>('time_blocks');
      const today = new Date().toISOString().split('T')[0];
      if (params?.date) {
        localBlocks = localBlocks.filter((b: any) => (b.date || today) === params.date);
      }
      if (planId) {
        localBlocks = localBlocks.filter((b: any) => b.daily_plan_id === planId || b.daily_plan === planId);
      }

      const blockMap = new Map<string, TimeBlock>();
      for (const b of localBlocks) {
        if (b && b.id) {
          blockMap.set(b.id, {
            ...b,
            daily_plan: b.daily_plan_id || b.daily_plan,
            daily_plan_id: b.daily_plan_id || b.daily_plan,
          });
        }
      }
      for (const b of cloudBlocks) {
        if (b && b.id) {
          blockMap.set(b.id, b);
        }
      }

      return Array.from(blockMap.values()).sort((a: any, b: any) =>
        (a.start_time || '').localeCompare(b.start_time || '')
      );
    },
  });
};

export const useCreateTimeBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TimeBlock>) => {
      const user = await getAuthenticatedUser();
      const planId = data.daily_plan_id || data.daily_plan;
      const today = new Date().toISOString().split('T')[0];
      const dateVal = data.date || today;

      // Only include valid Supabase columns
      const payload: Record<string, any> = {
        title: data.title,
        description: data.description || '',
        start_time: data.start_time,
        end_time: data.end_time,
        block_type: data.block_type || data.category || 'study',
        category: data.category || data.block_type || 'study',
        is_completed: !!data.is_completed,
        color: data.color || '#6366f1',
        user_id: user.id,
        date: dateVal,
      };

      if (planId) {
        payload.daily_plan_id = planId;
      }

      // Always persist to local storage first so UI reflects block instantly
      const localRecord = localInsert<TimeBlock>('time_blocks', {
        ...payload,
        daily_plan: planId,
        daily_plan_id: planId,
      } as any);

      try {
        const { data: result, error } = await supabase
          .from('time_blocks')
          .insert(payload)
          .select()
          .single();
        if (!error && result) {
          const normalized = {
            ...result,
            daily_plan: result.daily_plan_id || planId,
            daily_plan_id: result.daily_plan_id || planId,
            date: result.date || dateVal,
          };
          localUpdate<TimeBlock>('time_blocks', localRecord.id, normalized as any);
          return normalized as TimeBlock;
        }
      } catch (err) {
        // Local record is already saved
      }

      return localRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeBlocks'] });
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
      qc.invalidateQueries({ queryKey: ['dailyPlanByDate'] });
    },
  });
};

export const useUpdateTimeBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TimeBlock> & { id: string }) => {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description;
      if (data.start_time !== undefined) payload.start_time = data.start_time;
      if (data.end_time !== undefined) payload.end_time = data.end_time;
      if (data.is_completed !== undefined) {
        payload.is_completed = data.is_completed;
        payload.completed_at = data.is_completed ? new Date().toISOString() : null;
      }
      if (data.block_type !== undefined) {
        payload.block_type = data.block_type;
        payload.category = data.block_type;
      }
      if (data.color !== undefined) payload.color = data.color;
      if (data.date !== undefined) payload.date = data.date;
      if (data.daily_plan_id || data.daily_plan) {
        payload.daily_plan_id = data.daily_plan_id || data.daily_plan;
      }

      try {
        const { data: result, error } = await supabase
          .from('time_blocks')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (!error && result) {
          const normalized = {
            ...result,
            daily_plan: result.daily_plan_id || (data.daily_plan || data.daily_plan_id),
            daily_plan_id: result.daily_plan_id || (data.daily_plan || data.daily_plan_id),
          };
          localUpdate<TimeBlock>('time_blocks', id, normalized as any);
          return normalized as TimeBlock;
        }
      } catch (err) {
        // Fall through
      }

      const updated = localUpdate<TimeBlock>('time_blocks', id, payload as any);
      return (updated || { id, ...payload }) as TimeBlock;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeBlocks'] });
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
      qc.invalidateQueries({ queryKey: ['dailyPlanByDate'] });
    },
  });
};

export const useDeleteTimeBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Delete from local time_blocks
      localDelete('time_blocks', id);

      // 2. Clean from local daily_plans time_blocks array
      const plans = localGet<DailyPlan>('daily_plans');
      let changed = false;
      const updatedPlans = plans.map((p) => {
        if (Array.isArray(p.time_blocks) && p.time_blocks.some((b: any) => b.id === id)) {
          changed = true;
          return { ...p, time_blocks: p.time_blocks.filter((b: any) => b.id !== id) };
        }
        return p;
      });
      if (changed) {
        localSet('daily_plans', updatedPlans);
      }

      // 3. Delete from Supabase
      try {
        await supabase.from('time_blocks').delete().eq('id', id);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeBlocks'] });
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
      qc.invalidateQueries({ queryKey: ['dailyPlanByDate'] });
    },
  });
};
