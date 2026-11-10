import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert } from '../lib/localDb';
import type { JournalEntry } from '../types';

export const useJournalEntries = () => {
  return useQuery({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        if (!error && data && data.length > 0) return data as JournalEntry[];
      } catch (err) {
        // Fall back
      }
      return localGet<JournalEntry>('journal_entries');
    },
  });
};

export const useJournalEntryByDate = (date: string) => {
  return useQuery({
    queryKey: ['journalEntry', date],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .maybeSingle();

        if (!error && data) return data as JournalEntry;
      } catch (err) {
        // Fall back
      }
      const entries = localGet<JournalEntry>('journal_entries');
      return entries.find((e) => e.date === date) || null;
    },
    enabled: !!date,
    retry: false,
  });
};

/**
 * Returns a map of { [date]: score } for all journal entries that have a mood_score.
 * Used for calendar heatmap – converts 0-10 mood_score to 1-5 band.
 */
export const useJournalScoreMap = () => {
  return useQuery<Record<string, number>>({
    queryKey: ['journalScoreMap'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let entries: JournalEntry[] = [];
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('date, mood_score')
          .eq('user_id', user.id)
          .order('date', { ascending: true });
        if (!error && data && data.length > 0) {
          entries = data as JournalEntry[];
        } else {
          entries = localGet<JournalEntry>('journal_entries');
        }
      } catch {
        entries = localGet<JournalEntry>('journal_entries');
      }

      const map: Record<string, number> = {};
      for (const e of entries) {
        if (e.date && typeof e.mood_score === 'number' && e.mood_score > 0) {
          // Map mood_score (1-10) → 1-5 band
          map[e.date] = Math.min(5, Math.max(1, Math.ceil(e.mood_score / 2)));
        }
      }
      return map;
    },
  });
};

/** Mood trend using REAL user journal entries (not artificial). */
export const useMoodTrend = (days: number = 7) => {
  return useQuery({
    queryKey: ['moodTrend', days],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let entries: JournalEntry[] = [];
      try {
        const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('journal_entries')
          .select('date, mood, mood_score')
          .eq('user_id', user.id)
          .gte('date', since)
          .order('date', { ascending: true });
        if (!error && data && data.length > 0) {
          entries = data as JournalEntry[];
        } else {
          entries = localGet<JournalEntry>('journal_entries');
        }
      } catch {
        entries = localGet<JournalEntry>('journal_entries');
      }

      return entries.map((e) => ({
        date: e.date,
        mood: e.mood || 'neutral',
        score: typeof e.mood_score === 'number' ? e.mood_score : 5,
      }));
    },
  });
};

export const useSaveJournalEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<JournalEntry>) => {
      const user = await getAuthenticatedUser();
      const entryDate = data.date || new Date().toISOString().split('T')[0];
      const payload: Record<string, any> = {
        user_id: user.id,
        date: entryDate,
        title: data.title || '',
        content: data.content || '',
        mood: data.mood || 'good',
        mood_score: typeof data.mood_score === 'number' ? data.mood_score : 5,
        achievements: data.achievements || '',
        challenges: data.challenges || '',
        lessons: data.lessons || '',
        tomorrow_goals: data.tomorrow_goals || '',
      };
      try {
        const { data: result, error } = await supabase
          .from('journal_entries')
          .upsert(payload, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (!error && result) return result as JournalEntry;
      } catch (err) {
        // Fall through
      }
      return localInsert<JournalEntry>('journal_entries', payload as any);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['journalEntries'] });
      qc.invalidateQueries({ queryKey: ['journalScoreMap'] });
      qc.invalidateQueries({ queryKey: ['moodTrend'] });
      if (variables.date) {
        qc.invalidateQueries({ queryKey: ['journalEntry', variables.date] });
      }
    },
  });
};

export const useDeleteJournalEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('journal_entries').delete().eq('id', id);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journalEntries'] });
      qc.invalidateQueries({ queryKey: ['journalScoreMap'] });
    },
  });
};
