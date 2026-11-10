import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete, localSet } from '../lib/localDb';
import type { Habit, HabitLog } from '../types';

export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudHabits: Habit[] = [];
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudHabits = data as Habit[];
        }
      } catch (err) {
        // Fall back
      }

      const localHabits = localGet<Habit>('habits');
      const localLogs = localGet<HabitLog>('habit_logs');
      const today = new Date().toISOString().split('T')[0];

      const isHabitDoneToday = (id: string) => {
        return localLogs.some(
          (l: any) =>
            (l.habit === id || l.habit_id === id) &&
            (l.date === today || l.log_date === today) &&
            Boolean(l.completed)
        );
      };

      const map = new Map<string, Habit>();
      for (const h of localHabits) {
        if (h && h.id) {
          const rawStreak = Number(h.current_streak ?? (h as any).streak_count ?? 0);
          const done = isHabitDoneToday(h.id);
          const streak = done ? Math.max(1, rawStreak) : rawStreak;
          map.set(h.id, {
            ...h,
            current_streak: streak,
            longest_streak: Math.max(streak, Number(h.longest_streak ?? streak)),
          });
        }
      }
      for (const h of cloudHabits) {
        if (h && h.id) {
          const rawStreak = Number(h.current_streak ?? (h as any).streak_count ?? 0);
          const done = isHabitDoneToday(h.id);
          const streak = done ? Math.max(1, rawStreak) : rawStreak;
          map.set(h.id, {
            ...h,
            current_streak: streak,
            longest_streak: Math.max(streak, Number(h.longest_streak ?? streak)),
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    },
  });
};

export const useHabitLogs = (date?: string) => {
  return useQuery({
    queryKey: ['habitLogs', date],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudLogs: HabitLog[] = [];
      try {
        let query = supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (date) query = query.or(`date.eq.${date},log_date.eq.${date}`);

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudLogs = data.map((r: any) => ({
            ...r,
            habit: r.habit || r.habit_id,
            habit_id: r.habit_id || r.habit,
            date: r.date || r.log_date,
            log_date: r.log_date || r.date,
            completed: Boolean(r.completed || r.status === 'completed'),
          })) as HabitLog[];
        }
      } catch (err) {
        // Fall back
      }

      let localLogs = localGet<HabitLog>('habit_logs');
      if (date) {
        localLogs = localLogs.filter((l) => l.date === date || (l as any).log_date === date);
      }

      const logMap = new Map<string, HabitLog>();
      for (const l of localLogs) {
        const hid = l.habit || (l as any).habit_id;
        if (hid) {
          logMap.set(hid, {
            ...l,
            habit: hid,
            habit_id: hid,
            completed: Boolean(l.completed),
          });
        }
      }
      for (const l of cloudLogs) {
        const hid = l.habit || (l as any).habit_id;
        if (hid) {
          logMap.set(hid, {
            ...l,
            habit: hid,
            habit_id: hid,
            completed: Boolean(l.completed),
          });
        }
      }

      return Array.from(logMap.values());
    },
  });
};

export const useCreateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Habit>) => {
      const user = await getAuthenticatedUser();
      const localRecord = localInsert<Habit>('habits', {
        ...data,
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
      } as any);

      try {
        const { data: result, error } = await supabase
          .from('habits')
          .insert({
            name: data.name,
            frequency: data.frequency || 'daily',
            target_count: data.target_count || 1,
            unit: data.unit || 'times',
            color: data.color || '#10B981',
            current_streak: 0,
            longest_streak: 0,
            user_id: user.id,
          })
          .select()
          .single();
        if (!error && result) {
          localUpdate<Habit>('habits', localRecord.id, result as any);
          return result as Habit;
        }
      } catch (err) {
        // Handled via localRecord
      }
      return localRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useUpdateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Habit> & { id: string }) => {
      const updated = localUpdate<Habit>('habits', id, data);
      try {
        const { data: result, error } = await supabase
          .from('habits')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (!error && result) return result as Habit;
      } catch (err) {
        // Fall through
      }
      return (updated || data) as Habit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('habits', id);
      try {
        await supabase.from('habits').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useLogHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      habit?: string;
      habit_id?: string;
      date: string;
      completed?: boolean;
      value?: number;
      status?: string;
      notes?: string;
    }) => {
      const user = await getAuthenticatedUser();
      const habitId = data.habit || data.habit_id || '';
      const isCompleted = data.completed ?? (data.status === 'completed');

      // 1. Update/upsert local habit_logs
      const allLogs = localGet<HabitLog>('habit_logs');
      const existingLogIdx = allLogs.findIndex(
        (l: any) =>
          (l.habit === habitId || l.habit_id === habitId) &&
          (l.date === data.date || l.log_date === data.date)
      );

      const logRecord: HabitLog = {
        id: existingLogIdx >= 0 ? allLogs[existingLogIdx].id : `hlog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        habit: habitId,
        habit_id: habitId,
        date: data.date,
        log_date: data.date,
        completed: isCompleted,
        value: isCompleted ? 1 : 0,
        notes: data.notes || '',
      };

      if (existingLogIdx >= 0) {
        allLogs[existingLogIdx] = logRecord;
      } else {
        allLogs.unshift(logRecord);
      }
      localSet('habit_logs', allLogs);

      // 2. Update habit streak in localDb
      const allHabits = localGet<Habit>('habits');
      const habitIdx = allHabits.findIndex((h) => h.id === habitId);
      let newStreak = 0;
      let newLongest = 0;
      if (habitIdx >= 0) {
        const cur = Number(allHabits[habitIdx].current_streak ?? (allHabits[habitIdx] as any).streak_count ?? 0);
        const longest = Number(allHabits[habitIdx].longest_streak ?? cur);
        newStreak = isCompleted ? Math.max(1, cur + 1) : Math.max(0, cur - 1);
        newLongest = Math.max(longest, newStreak);
        allHabits[habitIdx] = {
          ...allHabits[habitIdx],
          current_streak: newStreak,
          longest_streak: newLongest,
        };
        localSet('habits', allHabits);
      }

      // 3. Sync to Supabase
      try {
        await supabase
          .from('habit_logs')
          .upsert(
            {
              habit_id: habitId,
              user_id: user.id,
              date: data.date,
              log_date: data.date,
              completed: isCompleted,
              value: isCompleted ? 1 : 0,
              notes: data.notes || '',
            },
            { onConflict: 'habit_id,date' }
          );

        if (habitIdx >= 0) {
          await supabase
            .from('habits')
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
            })
            .eq('id', habitId);
        }
      } catch (err) {
        // Handled via local storage
      }

      return logRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habitLogs'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};
