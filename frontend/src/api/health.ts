import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localDelete, localSet } from '../lib/localDb';
import type { HealthLog } from '../types';

export const useHealthLogs = () => {
  return useQuery({
    queryKey: ['healthLogs'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudLogs: HealthLog[] = [];
      try {
        const { data, error } = await supabase
          .from('health_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudLogs = data as HealthLog[];
        }
      } catch (err) {
        // Fall back
      }

      const localLogs = localGet<HealthLog>('health_logs');
      const logMap = new Map<string, HealthLog>();
      for (const l of localLogs) {
        if (l && l.date) logMap.set(l.date, l);
      }
      for (const l of cloudLogs) {
        if (l && l.date) logMap.set(l.date, l);
      }

      return Array.from(logMap.values()).sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );
    },
  });
};

/** Fetch a single health log for a specific date. */
export const useHealthLogByDate = (date: string) => {
  return useQuery<HealthLog | null>({
    queryKey: ['healthLog', date],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('health_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .maybeSingle();
        if (!error && data) return data as HealthLog;
      } catch (err) {
        // Fall back
      }
      const logs = localGet<HealthLog>('health_logs');
      return logs.find((l) => l.date === date) || null;
    },
    enabled: !!date,
  });
};

export const useHealthStats = () => {
  return useQuery({
    queryKey: ['healthStats'],
    queryFn: async () => {
      const logs = localGet<HealthLog>('health_logs');

      const avg = (key: keyof HealthLog) => {
        const vals = logs
          .map((l: any) => Number(l[key]))
          .filter((v: number) => !isNaN(v) && v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };

      const week = {
        avg_sleep: avg('sleep_hours') || 0,
        avg_water: avg('water_ml') || 0,
        avg_steps: avg('steps') || 0,
        avg_exercise: avg('exercise_mins') || 0,
      };

      return {
        today: logs[0] ?? null,
        week,
        this_week: week,
        this_month: week,
      };
    },
  });
};

export const useLogHealth = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HealthLog>) => {
      const user = await getAuthenticatedUser();
      const logDate = data.date || new Date().toISOString().split('T')[0];
      const payload: Record<string, any> = {
        ...data,
        user_id: user.id,
        date: logDate,
      };

      // Always save to local storage immediately
      const current = localGet<HealthLog>('health_logs');
      const filtered = current.filter((l) => l.date !== logDate);
      const newRecord: HealthLog = {
        id: `hlog-${logDate}`,
        date: logDate,
        ...payload,
        created_at: new Date().toISOString(),
      } as any;
      localSet('health_logs', [newRecord, ...filtered]);

      try {
        const { data: result, error } = await supabase
          .from('health_logs')
          .upsert(payload, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (!error && result) return result as HealthLog;
      } catch (err) {
        // Handled via local storage
      }
      return newRecord;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['healthLogs'] });
      qc.invalidateQueries({ queryKey: ['healthStats'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
      if (variables.date) {
        qc.invalidateQueries({ queryKey: ['healthLog', variables.date] });
      }
    },
  });
};

export const useCreateHealthLog = useLogHealth;

export const useDeleteHealthLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idOrDate: string) => {
      const current = localGet<HealthLog>('health_logs');
      const next = current.filter((l) => l.id !== idOrDate && l.date !== idOrDate);
      localSet('health_logs', next);
      try {
        await supabase
          .from('health_logs')
          .delete()
          .or(`id.eq.${idOrDate},date.eq.${idOrDate}`);
      } catch (e) {
        // ignore
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['healthLogs'] });
      qc.invalidateQueries({ queryKey: ['healthStats'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};
