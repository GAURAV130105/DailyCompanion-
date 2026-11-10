-- ==============================================================================
-- STUDENT LIFE OS - COMPLETE SUPABASE DATABASE SCHEMA
-- Run this entire script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  avatar TEXT,
  bio TEXT DEFAULT '',
  user_timezone TEXT DEFAULT 'Asia/Kolkata',
  daily_study_goal_minutes INTEGER DEFAULT 240,
  pomodoro_work_duration INTEGER DEFAULT 25,
  pomodoro_short_break INTEGER DEFAULT 5,
  pomodoro_long_break INTEGER DEFAULT 15,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. DAILY PLANS
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  primary_goal TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_template BOOLEAN DEFAULT FALSE,
  template_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. TIME BLOCKS
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_plan_id UUID REFERENCES daily_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'study',
  block_type TEXT DEFAULT 'study',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT FALSE,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASK TAGS
CREATE TABLE IF NOT EXISTS task_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  due_date DATE,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  subject_name TEXT,
  topic TEXT,
  topic_name TEXT,
  session_type TEXT DEFAULT 'study',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  duration_mins INTEGER DEFAULT 0,
  focus_rating INTEGER,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. POMODORO SESSIONS
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  work_mins INTEGER DEFAULT 25,
  break_mins INTEGER DEFAULT 5,
  cycles_planned INTEGER DEFAULT 4,
  cycles_done INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXAM PROFILES
CREATE TABLE IF NOT EXISTS exam_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_type TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  target_date DATE,
  attempt_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXAM SUBJECTS
CREATE TABLE IF NOT EXISTS exam_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_profile_id UUID REFERENCES exam_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  weightage NUMERIC(5,2) DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXAM CHAPTERS
CREATE TABLE IF NOT EXISTS exam_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES exam_subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  estimated_hours NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXAM TOPICS
CREATE TABLE IF NOT EXISTS exam_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES exam_chapters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  difficulty TEXT DEFAULT 'medium',
  estimated_hours NUMERIC(5,2) DEFAULT 2,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  completed_at TIMESTAMPTZ,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MOCK TESTS
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_profile_id UUID REFERENCES exam_profiles(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE,
  total_marks NUMERIC DEFAULT 0,
  obtained_marks NUMERIC DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  attempted INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0,
  unattempted INTEGER DEFAULT 0,
  time_taken_mins INTEGER,
  percentile NUMERIC(5,2),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. MISTAKE NOTEBOOKS
CREATE TABLE IF NOT EXISTS mistake_notebooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_profile_id UUID REFERENCES exam_profiles(id) ON DELETE CASCADE,
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  subject_name TEXT,
  topic TEXT,
  question_text TEXT NOT NULL,
  user_answer TEXT DEFAULT '',
  correct_answer TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. REVISION SCHEDULES
CREATE TABLE IF NOT EXISTS revision_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_profile_id UUID REFERENCES exam_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  topic_name TEXT,
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  interval_days INTEGER DEFAULT 1,
  revision_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. GOALS
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'academic',
  target_date DATE,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. HABITS
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  frequency TEXT DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'times',
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'CheckCircle',
  is_active BOOLEAN DEFAULT TRUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. HABIT LOGS
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  log_date DATE,
  completed BOOLEAN DEFAULT TRUE,
  value INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- 18. TRANSACTION CATEGORIES
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Wallet',
  type TEXT DEFAULT 'both',
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category UUID REFERENCES transaction_categories(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  spent NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  entry_date DATE,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good',
  mood_score INTEGER DEFAULT 8,
  achievements TEXT DEFAULT '',
  challenges TEXT DEFAULT '',
  lessons TEXT DEFAULT '',
  tomorrow_goals TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 22. HEALTH LOGS
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  log_date DATE,
  sleep_hours NUMERIC(4,2),
  water_ml INTEGER DEFAULT 2000,
  exercise_mins INTEGER DEFAULT 0,
  exercise_type TEXT DEFAULT '',
  steps INTEGER DEFAULT 0,
  weight_kg NUMERIC(5,2),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 23. NOTES
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  subject_name TEXT,
  topic TEXT,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. DAILY SCORES
CREATE TABLE IF NOT EXISTS daily_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  score_date DATE,
  score NUMERIC(4,2) DEFAULT 0,
  total_score NUMERIC(4,2) DEFAULT 0,
  study_score NUMERIC(4,2) DEFAULT 0,
  task_score NUMERIC(4,2) DEFAULT 0,
  habit_score NUMERIC(4,2) DEFAULT 0,
  exam_score NUMERIC(4,2) DEFAULT 0,
  personal_score NUMERIC(4,2) DEFAULT 0,
  manual_override BOOLEAN DEFAULT FALSE,
  override_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 25. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  context_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 26. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'reminder',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each student can only access and modify their own data
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Standard policies for direct user_id tables
DROP POLICY IF EXISTS "Users manage own profiles" ON profiles;
CREATE POLICY "Users manage own profiles" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own daily_plans" ON daily_plans;
CREATE POLICY "Users manage own daily_plans" ON daily_plans FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own time_blocks" ON time_blocks;
CREATE POLICY "Users manage own time_blocks" ON time_blocks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own task_tags" ON task_tags;
CREATE POLICY "Users manage own task_tags" ON task_tags FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own tasks" ON tasks;
CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own study_sessions" ON study_sessions;
CREATE POLICY "Users manage own study_sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own pomodoro_sessions" ON pomodoro_sessions;
CREATE POLICY "Users manage own pomodoro_sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own exam_profiles" ON exam_profiles;
CREATE POLICY "Users manage own exam_profiles" ON exam_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own mock_tests" ON mock_tests;
CREATE POLICY "Users manage own mock_tests" ON mock_tests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own mistake_notebooks" ON mistake_notebooks;
CREATE POLICY "Users manage own mistake_notebooks" ON mistake_notebooks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own revision_schedules" ON revision_schedules;
CREATE POLICY "Users manage own revision_schedules" ON revision_schedules FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own goals" ON goals;
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own habits" ON habits;
CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own habit_logs" ON habit_logs;
CREATE POLICY "Users manage own habit_logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own transaction_categories" ON transaction_categories;
CREATE POLICY "Users manage own transaction_categories" ON transaction_categories FOR ALL USING (auth.uid() = user_id OR is_default = TRUE);

DROP POLICY IF EXISTS "Users manage own transactions" ON transactions;
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own budgets" ON budgets;
CREATE POLICY "Users manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own journal_entries" ON journal_entries;
CREATE POLICY "Users manage own journal_entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own health_logs" ON health_logs;
CREATE POLICY "Users manage own health_logs" ON health_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notes" ON notes;
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own daily_scores" ON daily_scores;
CREATE POLICY "Users manage own daily_scores" ON daily_scores FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own ai_conversations" ON ai_conversations;
CREATE POLICY "Users manage own ai_conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own ai_messages" ON ai_messages;
CREATE POLICY "Users manage own ai_messages" ON ai_messages FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Relational RLS for syllabus hierarchy (subjects, chapters, topics)
DROP POLICY IF EXISTS "Users manage exam_subjects" ON exam_subjects;
CREATE POLICY "Users manage exam_subjects" ON exam_subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM exam_profiles ep WHERE ep.id = exam_subjects.exam_profile_id AND ep.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage exam_chapters" ON exam_chapters;
CREATE POLICY "Users manage exam_chapters" ON exam_chapters FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_subjects es
    JOIN exam_profiles ep ON ep.id = es.exam_profile_id
    WHERE es.id = exam_chapters.subject_id AND ep.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users manage exam_topics" ON exam_topics;
CREATE POLICY "Users manage exam_topics" ON exam_topics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_chapters ec
    JOIN exam_subjects es ON es.id = ec.subject_id
    JOIN exam_profiles ep ON ep.id = es.exam_profile_id
    WHERE ec.id = exam_topics.chapter_id AND ep.user_id = auth.uid()
  )
);

-- Seed default transaction categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_txn_cat_default ON transaction_categories (name) WHERE is_default = TRUE;

INSERT INTO transaction_categories (name, icon, type, color, is_default)
VALUES
  ('Books & Study Materials', 'BookOpen', 'expense', '#3b82f6', TRUE),
  ('Exam & Course Fees', 'GraduationCap', 'expense', '#8b5cf6', TRUE),
  ('Food & Groceries', 'Utensils', 'expense', '#10b981', TRUE),
  ('Hostel & Accommodation', 'Home', 'expense', '#f59e0b', TRUE),
  ('Travel & Transport', 'Bus', 'expense', '#06b6d4', TRUE),
  ('Pocket Money / Allowance', 'Wallet', 'income', '#22c55e', TRUE),
  ('Scholarship & Stipend', 'Award', 'income', '#a855f7', TRUE),
  ('Freelance / Tutoring', 'Briefcase', 'income', '#14b8a6', TRUE)
ON CONFLICT (name) WHERE is_default = TRUE DO NOTHING;
