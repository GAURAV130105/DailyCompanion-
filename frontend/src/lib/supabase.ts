import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'slos-supabase-session',
  },
});

export type Database = {
  public: {
    Tables: {
      tasks: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      daily_plans: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      time_blocks: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      study_sessions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      pomodoro_sessions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exam_profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exam_subjects: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exam_chapters: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exam_topics: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      mock_tests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      habits: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      habit_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      goals: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      transactions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      transaction_categories: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      budgets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      journal_entries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      health_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      notes: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      daily_scores: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ai_conversations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ai_messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
  };
};
