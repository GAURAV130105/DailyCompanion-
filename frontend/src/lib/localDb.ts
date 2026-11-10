// Local Database with realistic seeds and localStorage persistence
// Seamlessly activates when Supabase tables don't exist yet (PGRST205) or in offline/demo mode.

const STORAGE_PREFIX = 'slos_local_';

const SEED_DATA: Record<string, any[]> = {
  tasks: [
    {
      id: 'task-1',
      user_id: 'demo-user-12345',
      title: 'Read Economic Survey 2026: Chapter on Agriculture & Food Management',
      description: 'Focus on MSP reforms, crop diversification, and PM-KISAN outlay.',
      priority: 'high',
      status: 'in_progress',
      estimated_minutes: 60,
      actual_minutes: 30,
      due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      user_id: 'demo-user-12345',
      title: 'Solve 50 GS Paper-1 Practice Questions (Polity & Constitution)',
      description: 'Practice questions on Fundamental Rights, Writs, and Judicial Review.',
      priority: 'urgent',
      status: 'todo',
      estimated_minutes: 75,
      actual_minutes: null,
      due_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      user_id: 'demo-user-12345',
      title: 'Revise Modern Indian History Timeline (1857 - 1947)',
      description: 'Key Governor Generals, Congress sessions, and Revolutionary movements.',
      priority: 'medium',
      status: 'completed',
      estimated_minutes: 45,
      actual_minutes: 50,
      due_date: new Date().toISOString().split('T')[0],
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-4',
      user_id: 'demo-user-12345',
      title: 'CSAT Quantitative Aptitude: Time, Speed & Distance Practice',
      description: 'Review relative speed problems and train crossing concepts.',
      priority: 'low',
      status: 'todo',
      estimated_minutes: 40,
      actual_minutes: null,
      due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ],
  habits: [
    {
      id: 'habit-1',
      user_id: 'demo-user-12345',
      name: 'Early Morning Routine (Wake at 06:00 AM)',
      description: 'Hydrate, light stretching, and 15 mins plan review',
      target_frequency: 'daily',
      color: '#3b82f6',
      streak_count: 12,
      created_at: new Date().toISOString(),
    },
    {
      id: 'habit-2',
      user_id: 'demo-user-12345',
      name: 'Daily 4 Hours Deep Focus Study',
      description: 'Undivided study time with phone on Do Not Disturb',
      target_frequency: 'daily',
      color: '#10b981',
      streak_count: 8,
      created_at: new Date().toISOString(),
    },
    {
      id: 'habit-3',
      user_id: 'demo-user-12345',
      name: 'Read The Hindu / Indian Express Editorial',
      description: 'Analyze bilateral diplomacy and macroeconomic op-eds',
      target_frequency: 'daily',
      color: '#8b5cf6',
      streak_count: 19,
      created_at: new Date().toISOString(),
    },
  ],
  goals: [
    {
      id: 'goal-1',
      user_id: 'demo-user-12345',
      title: 'Complete Indian Polity (M. Laxmikanth) 2nd Comprehensive Revision',
      description: 'All 76 chapters with highlight annotations and formula cards',
      category: 'academic',
      progress: 68,
      status: 'active',
      target_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    {
      id: 'goal-2',
      user_id: 'demo-user-12345',
      title: 'Attempt 20 Full-Length Prelims Mock Test Papers',
      description: 'Target average score above 115 in GS Paper 1',
      category: 'exam',
      progress: 45,
      status: 'active',
      target_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ],
  exam_profiles: [
    {
      id: 'exam-1',
      user_id: 'demo-user-12345',
      exam_name: 'UPSC Civil Services Examination 2026',
      exam_category: 'upsc',
      target_year: 2026,
      target_date: '2026-05-24',
      syllabus_progress: 48,
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'exam-2',
      user_id: 'demo-user-12345',
      exam_name: 'Combined Defence Services (CDS I)',
      exam_category: 'defence',
      target_year: 2026,
      target_date: '2026-09-06',
      syllabus_progress: 62,
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ],
  exam_subjects: [
    {
      id: 'sub-1',
      exam_profile_id: 'exam-1',
      name: 'Indian Polity & Governance',
      weightage: 25,
      color: '#3B82F6',
      order: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sub-2',
      exam_profile_id: 'exam-1',
      name: 'Modern Indian History',
      weightage: 20,
      color: '#F59E0B',
      order: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sub-3',
      exam_profile_id: 'exam-1',
      name: 'Geography & Environment',
      weightage: 20,
      color: '#10B981',
      order: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sub-cds-1',
      exam_profile_id: 'exam-2',
      name: 'Elementary Mathematics',
      weightage: 33,
      color: '#6366F1',
      order: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sub-cds-2',
      exam_profile_id: 'exam-2',
      name: 'English Comprehension & Grammar',
      weightage: 33,
      color: '#EC4899',
      order: 2,
      created_at: new Date().toISOString(),
    },
  ],
  exam_chapters: [
    {
      id: 'ch-1',
      subject_id: 'sub-1',
      name: 'Constitutional Framework & Preamble',
      estimated_hours: 8,
      order: 1,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-2',
      subject_id: 'sub-1',
      name: 'Fundamental Rights & Directive Principles (DPSP)',
      estimated_hours: 12,
      order: 2,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-3',
      subject_id: 'sub-1',
      name: 'Union Parliament & State Legislatures',
      estimated_hours: 14,
      order: 3,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-4',
      subject_id: 'sub-2',
      name: 'Revolt of 1857 & Early Resistance to British Rule',
      estimated_hours: 6,
      order: 1,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-5',
      subject_id: 'sub-2',
      name: 'Indian National Movement (1885 - 1947)',
      estimated_hours: 16,
      order: 2,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-6',
      subject_id: 'sub-3',
      name: 'Physical Geography & River Systems of India',
      estimated_hours: 10,
      order: 1,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ch-cds-1',
      subject_id: 'sub-cds-1',
      name: 'Arithmetic: Number Systems & Percentages',
      estimated_hours: 10,
      order: 1,
      is_completed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ],
  exam_topics: [
    {
      id: 'top-1',
      chapter_id: 'ch-1',
      name: 'Making of the Constitution & Constituent Assembly',
      status: 'pending',
      difficulty: 'medium',
      estimated_hours: 3,
      is_completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'top-2',
      chapter_id: 'ch-1',
      name: 'Salient Features of the Indian Constitution',
      status: 'pending',
      difficulty: 'easy',
      estimated_hours: 2,
      is_completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'top-3',
      chapter_id: 'ch-2',
      name: 'Article 14 to 18: Right to Equality & Landmark Cases',
      status: 'pending',
      difficulty: 'hard',
      estimated_hours: 4,
      is_completed: false,
      created_at: new Date().toISOString(),
    },
  ],
  revision_schedules: [],
  study_sessions: [
    {
      id: 'study-1',
      user_id: 'demo-user-12345',
      subject: 'Indian Polity',
      topic: 'Directive Principles of State Policy (DPSP)',
      duration_minutes: 90,
      session_type: 'study',
      focus_rating: 5,
      start_time: new Date(Date.now() - 3600000 * 5).toISOString(),
      end_time: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    },
    {
      id: 'study-2',
      user_id: 'demo-user-12345',
      subject: 'Modern History',
      topic: 'Non-Cooperation Movement 1920',
      duration_minutes: 60,
      session_type: 'revision',
      focus_rating: 4,
      start_time: new Date(Date.now() - 3600000 * 24).toISOString(),
      end_time: new Date(Date.now() - 3600000 * 23).toISOString(),
    },
    {
      id: 'study-3',
      user_id: 'demo-user-12345',
      subject: 'Geography',
      topic: 'Indian River Basins & Monsoon Climate Systems',
      duration_minutes: 75,
      session_type: 'practice',
      focus_rating: 5,
      start_time: new Date(Date.now() - 3600000 * 48).toISOString(),
      end_time: new Date(Date.now() - 3600000 * 46.75).toISOString(),
    },
  ],
  daily_plans: [
    {
      id: 'plan-1',
      user_id: 'demo-user-12345',
      date: new Date().toISOString().split('T')[0],
      primary_goal: 'Daily Study & Focus Goals',
      notes: 'Stay hydrated and complete evening revision on time.',
      time_blocks: [],
    },
  ],
  time_blocks: [],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'demo-user-12345',
      title: 'Welcome to Student Life OS!',
      message: 'Organize your study goals, exam revisions, and daily habits seamlessly.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      user_id: 'demo-user-12345',
      title: 'Study Streak Active 🔥',
      message: 'You have maintained your study streak for 8 consecutive days. Keep going!',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  notes: [
    {
      id: 'note-1',
      user_id: 'demo-user-12345',
      title: 'Polity: Important Constitutional Amendments Summary',
      content: '42nd Amendment (Mini Constitution 1976), 44th Amendment (Right to Property removed), 86th Amendment (Right to Education Art 21A), 101st Amendment (GST).',
      tags: ['Polity', 'Prelims', 'QuickRevision'],
      is_pinned: true,
      created_at: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 'tx-1',
      user_id: 'demo-user-12345',
      title: 'Standard Reference Books (Laxmikanth & Spectrum)',
      amount: 1450,
      transaction_type: 'expense',
      category: 'Books & Materials',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      user_id: 'demo-user-12345',
      title: 'Monthly Study Allowance / Scholarship',
      amount: 8000,
      transaction_type: 'income',
      category: 'Allowance',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ],
  budgets: [
    {
      id: 'b-1',
      category: 'Books & Materials',
      monthly_limit: 3000,
      spent: 1450,
    },
    {
      id: 'b-2',
      category: 'Food & Nutrition',
      monthly_limit: 4500,
      spent: 2100,
    },
  ],
  health_logs: [
    {
      id: 'health-1',
      user_id: 'demo-user-12345',
      date: new Date().toISOString().split('T')[0],
      sleep_hours: 7.5,
      water_ml: 2800,
      exercise_mins: 35,
      exercise_type: 'Morning Jog',
      steps: 6400,
      weight_kg: 68.0,
      notes: 'Morning run completed. Feeling fresh and alert.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'health-2',
      user_id: 'demo-user-12345',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
      sleep_hours: 6.5,
      water_ml: 2200,
      exercise_mins: 20,
      exercise_type: 'Yoga',
      steps: 4800,
      weight_kg: 68.2,
      notes: 'Shorter sleep due to late revision. Yoga in evening.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'health-3',
      user_id: 'demo-user-12345',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0]; })(),
      sleep_hours: 8.0,
      water_ml: 3100,
      exercise_mins: 45,
      exercise_type: 'Gym',
      steps: 8200,
      weight_kg: 67.9,
      notes: 'Excellent recovery day. Full 8h sleep, good gym session.',
      created_at: new Date().toISOString(),
    },
  ],
  journal_entries: [
    {
      id: 'journal-1',
      user_id: 'demo-user-12345',
      date: new Date().toISOString().split('T')[0],
      title: 'Polity deep dive + 50 MCQs complete',
      content: 'Had an intense 4-hour study cycle today on Polity and History. Feeling confident about the upcoming mock test!',
      mood: 'great',
      mood_score: 9,
      achievements: 'Mastered Directive Principles and solved 50 MCQs with 84% accuracy.',
      challenges: 'Post-lunch energy dip slowed me down for 30 minutes.',
      lessons: 'Take a 10-minute walk after lunch to restore focus.',
      tomorrow_goals: '1. Complete Economy Ch 4\n2. 2h Current Affairs\n3. Run 5km',
      created_at: new Date().toISOString(),
    },
    {
      id: 'journal-2',
      user_id: 'demo-user-12345',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
      title: 'Slow start, solid evening session',
      content: 'Morning was sluggish due to poor sleep. Picked up momentum after lunch.',
      mood: 'good',
      mood_score: 6,
      achievements: 'Completed CSAT practice paper in 70 minutes.',
      challenges: 'Difficulty concentrating in the morning.',
      lessons: 'Revise notes digitally before sleeping for better retention.',
      tomorrow_goals: '1. Polity revision\n2. Environment static notes\n3. Yoga 30min',
      created_at: new Date().toISOString(),
    },
    {
      id: 'journal-3',
      user_id: 'demo-user-12345',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0]; })(),
      title: 'Outstanding study day — full flow state',
      content: 'Got into deep flow state for 6 continuous hours. Best study day this month.',
      mood: 'great',
      mood_score: 10,
      achievements: 'Covered all of Modern History Spectrum + Geography Maps.',
      challenges: 'None significant today.',
      lessons: 'Starting early (5:30 AM) triggers the best focus window.',
      tomorrow_goals: '1. CSAT Maths Ch 3\n2. Art & Culture notes\n3. 8km run',
      created_at: new Date().toISOString(),
    },
  ],
};

function getTableKey(table: string): string {
  return `${STORAGE_PREFIX}${table}`;
}

export function localSet<T = any>(table: string, records: T[]): void {
  try {
    localStorage.setItem(getTableKey(table), JSON.stringify(records));
  } catch (err) {
    console.warn(`[localDb] Failed to set ${table}:`, err);
  }
}

function sanitizeBlocks(blocks: any[]): any[] {
  return blocks.filter(
    (b: any) =>
      b &&
      b.id !== 'block-1' &&
      b.id !== 'block-2' &&
      !b.title?.toLowerCase().includes('polity deep study') &&
      !b.title?.toLowerCase().includes('csat practice')
  );
}

export function localGet<T = any>(table: string): T[] {
  try {
    let raw = localStorage.getItem(getTableKey(table));

    // Also check for legacy student_os_ prefix if slos_local_ is not yet set
    if (!raw) {
      const legacy = localStorage.getItem(`student_os_${table}`);
      if (legacy) {
        raw = legacy;
        try {
          localStorage.setItem(getTableKey(table), legacy);
        } catch (e) {
          // ignore
        }
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (table === 'time_blocks') {
          const cleaned = sanitizeBlocks(parsed);
          if (cleaned.length !== parsed.length) {
            localSet(table, cleaned);
          }
          return cleaned as T[];
        }
        if (table === 'daily_plans') {
          let modified = false;
          const cleanedPlans = parsed.map((p: any) => {
            if (Array.isArray(p.time_blocks)) {
              const cleaned = sanitizeBlocks(p.time_blocks);
              if (cleaned.length !== p.time_blocks.length) {
                modified = true;
                return { ...p, time_blocks: cleaned };
              }
            }
            return p;
          });
          if (modified) {
            localSet(table, cleanedPlans);
          }
          return cleanedPlans as T[];
        }
        return parsed as T[];
      }
    }
  } catch (err) {
    console.warn(`[localDb] Failed to read ${table}:`, err);
  }

  // Fallback to seed data and initialize localStorage
  const seeds = SEED_DATA[table] || [];
  try {
    localStorage.setItem(getTableKey(table), JSON.stringify(seeds));
  } catch (e) {
    // ignore
  }
  return seeds as T[];
}

export function localInsert<T extends { id?: string }>(table: string, record: T): T {
  const current = localGet<T>(table);
  const newRecord = {
    ...record,
    id: record.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    created_at: (record as any).created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(getTableKey(table), JSON.stringify(updated));
  } catch (err) {
    console.warn(`[localDb] Failed to insert into ${table}:`, err);
  }
  return newRecord;
}

export function localUpdate<T extends { id?: string }>(table: string, id: string, updates: Partial<T>): T | null {
  const current = localGet<T>(table);
  let updatedRecord: T | null = null;
  const next = current.map((item) => {
    if (item.id === id) {
      updatedRecord = { ...item, ...updates, updated_at: new Date().toISOString() };
      return updatedRecord;
    }
    return item;
  });
  try {
    localStorage.setItem(getTableKey(table), JSON.stringify(next));
  } catch (err) {
    console.warn(`[localDb] Failed to update ${table}:`, err);
  }
  return updatedRecord;
}

export function localDelete(table: string, id: string): boolean {
  const current = localGet(table);
  const next = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(getTableKey(table), JSON.stringify(next));
    return true;
  } catch (err) {
    console.warn(`[localDb] Failed to delete from ${table}:`, err);
    return false;
  }
}
