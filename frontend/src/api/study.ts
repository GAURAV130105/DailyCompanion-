import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert } from '../lib/localDb';
import type { StudySession, PomodoroSession } from '../types';

export const useStudySessions = () => {
  return useQuery({
    queryKey: ['studySessions'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false });
        if (!error && data) return data as StudySession[];
      } catch (err) {
        // Fall back
      }
      return localGet<StudySession>('study_sessions');
    },
  });
};

export const useCreateStudySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StudySession>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data: result, error } = await supabase
          .from('study_sessions')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) return result as StudySession;
      } catch (err) {
        // Fall through
      }
      return localInsert<StudySession>('study_sessions', {
        ...data,
        user_id: user.id,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
      qc.invalidateQueries({ queryKey: ['studyTrends'] });
    },
  });
};

export const usePomodoroSessions = () => {
  return useQuery({
    queryKey: ['pomodoroSessions'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) return data as PomodoroSession[];
      } catch (err) {
        // Fall back
      }
      return localGet<PomodoroSession>('pomodoro_sessions');
    },
  });
};

export const useCreatePomodoroSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PomodoroSession>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data: result, error } = await supabase
          .from('pomodoro_sessions')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) return result as PomodoroSession;
      } catch (err) {
        // Fall through
      }
      return localInsert<PomodoroSession>('pomodoro_sessions', {
        ...data,
        user_id: user.id,
      } as any);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pomodoroSessions'] }),
  });
};
