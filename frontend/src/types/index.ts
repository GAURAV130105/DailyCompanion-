export interface User {
  id: string;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string | null;
  bio?: string;
  timezone?: string;
  daily_study_goal_minutes?: number;
  pomodoro_work_duration?: number;
  pomodoro_short_break?: number;
  pomodoro_long_break?: number;
  theme?: 'light' | 'dark' | 'system';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Planner
export interface TimeBlock {
  id: string;
  daily_plan?: string;
  daily_plan_id?: string;
  date?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  block_type?: 'study' | 'task' | 'break' | 'exercise' | 'meal' | 'sleep' | 'other' | string;
  category?: 'study' | 'task' | 'break' | 'exercise' | 'meal' | 'sleep' | 'other' | string;
  color?: string;
  is_completed: boolean;
  completed_at?: string | null;
  recurring?: boolean;
}

export interface DailyPlan {
  id: string;
  date: string;
  primary_goal?: string;
  is_template?: boolean;
  template_name?: string;
  notes?: string;
  time_blocks: TimeBlock[];
}

// Tasks
export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  task: string;
  title: string;
  is_completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  tags?: string[];
  tags_detail?: TaskTag[];
  subtasks?: SubTask[];
  completed_at?: string | null;
  is_recurring?: boolean;
  created_at: string;
}

// Study
export interface StudySession {
  id: string;
  subject?: string | null;
  subject_name?: string;
  topic?: string | null;
  topic_name?: string;
  session_type: 'study' | 'revision' | 'practice' | 'mock_test';
  start_time: string;
  end_time?: string | null;
  duration_mins?: number;
  focus_rating?: number | null;
  notes?: string;
}

export interface PomodoroSession {
  id: string;
  study_session?: string | null;
  work_mins: number;
  break_mins: number;
  cycles_planned: number;
  cycles_done: number;
  is_active: boolean;
  started_at: string;
  ended_at?: string | null;
}

// Exams
export interface Topic {
  id: string;
  chapter: string;
  chapter_id?: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_revision';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  notes?: string;
  is_completed?: boolean;
  completed_at?: string | null;
}

export interface Chapter {
  id: string;
  subject: string;
  subject_id?: string;
  name: string;
  order: number;
  estimated_hours: number;
  is_completed?: boolean;
  status?: 'pending' | 'in_progress' | 'completed' | 'needs_revision';
  completed_at?: string | null;
  topics?: Topic[];
}

export interface Subject {
  id: string;
  exam_profile: string;
  exam_profile_id?: string;
  name: string;
  weightage: number;
  color: string;
  order: number;
  chapters?: Chapter[];
}

export interface ExamProfile {
  id: string;
  exam_type: 'UPSC' | 'NDA' | 'CDS' | 'AFCAT' | 'SSC' | 'Banking' | 'State' | 'Custom';
  exam_name: string;
  target_date?: string | null;
  attempt_number: number;
  is_active: boolean;
  notes?: string;
  subjects?: Subject[];
}

export interface ExamProgress {
  total_topics: number;
  completed: number;
  completed_topics?: number;
  in_progress: number;
  pending: number;
  needs_revision: number;
  percent: number;
  progress_percent?: number;
  by_subject: Array<{
    subject_id: string;
    subject_name: string;
    color: string;
    total_topics: number;
    completed: number;
    percent: number;
  }>;
}

export interface MockTest {
  id: string;
  exam_profile: string;
  exam_profile_id?: string;
  test_name: string;
  test_date: string;
  total_marks: number;
  obtained_marks: number;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted?: number;
  time_taken_mins?: number | null;
  percentile?: number | null;
  notes?: string;
}

export interface MistakeNotebook {
  id: string;
  exam_profile?: string;
  exam_profile_id?: string;
  mock_test?: string | null;
  subject: string;
  subject_name?: string;
  topic?: string | null;
  question_text: string;
  correct_answer: string;
  user_answer?: string;
  explanation?: string;
  reviewed: boolean;
  reviewed_at?: string | null;
}

export interface RevisionSchedule {
  id: string;
  user_id?: string;
  exam_profile?: string;
  exam_profile_id?: string;
  topic: string;
  topic_name?: string;
  item_type?: 'chapter' | 'topic';
  subject_name?: string;
  scheduled_date: string;
  completed: boolean;
  completed_at?: string | null;
  interval_days: number;
  revision_number: number;
}

// Goals & Habits
export interface Milestone {
  id: string;
  goal: string;
  title: string;
  target_date?: string | null;
  completed: boolean;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'academic' | 'exam' | 'health' | 'finance' | 'skill' | 'personal' | 'career';
  target_date?: string | null;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  progress: number;
  milestones?: Milestone[];
  created_at?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_days?: string[];
  target_count: number;
  unit: string;
  color: string;
  icon?: string;
  is_active: boolean;
  current_streak?: number;
  longest_streak?: number;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  habit: string;
  habit_id?: string;
  date: string;
  log_date?: string;
  completed: boolean;
  value: number;
  notes?: string;
}

// Finance
export interface TransactionCategory {
  id: string;
  name: string;
  icon?: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  is_default?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number | string;
  type: 'income' | 'expense';
  category?: string | null;
  category_name?: string;
  category_color?: string;
  date: string;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  category_name?: string;
  month: string;
  amount: number | string;
  spent?: number;
}

// Journal
export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: 'great' | 'good' | 'neutral' | 'low' | 'bad' | null;
  mood_score?: number | null;
  achievements?: string;
  challenges?: string;
  lessons?: string;
  tomorrow_goals?: string;
}

// Productivity Scores
export interface ProductivityScore {
  id: string;
  date: string;
  score: number;
  study_score: number;
  task_score: number;
  habit_score: number;
  exam_score: number;
  personal_score: number;
  manual_override: boolean;
  override_note?: string;
  breakdown_json?: Record<string, any>;
}

// Health
export interface HealthLog {
  id: string;
  date: string;
  sleep_hours?: number | string | null;
  water_ml?: number | null;
  exercise_mins?: number | null;
  exercise_type?: string;
  steps?: number | null;
  weight_kg?: number | string | null;
  notes?: string;
}

// Notes
export interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string | null;
  subject_name?: string;
  topic?: string | null;
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics
export interface AnalyticsOverview {
  total_study_hours: number;
  tasks_completed_this_week: number;
  avg_score_last_7_days?: number | null;
  active_habits: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  total_habits?: number;
  total_study_minutes?: number;
  today_score?: number | null;
  task_completion_rate?: number;
}

export interface StudyTrendPoint {
  date: string;
  hours: number;
  total_minutes?: number;
  sessions?: number;
}

export interface ExamProgressItem {
  exam_id: string;
  exam_name: string;
  total_topics: number;
  completed: number;
  percent: number;
  completed_topics?: number;
  progress_percent?: number;
}

export interface HabitAnalyticsItem {
  habit_id: string;
  name: string;
  color: string;
  total_days: number;
  completed_days: number;
  completion_rate: number;
}

export interface FinanceAnalyticsItem {
  month: string;
  income: number;
  expense: number;
}

// AI Assistant
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  context_type: 'general' | 'schedule' | 'exam' | 'finance' | 'health';
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'achievement' | 'system';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}
