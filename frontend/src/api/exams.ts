import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete } from '../lib/localDb';
import type {
  ExamProfile,
  ExamProgress,
  Subject,
  Chapter,
  Topic,
  MockTest,
  MistakeNotebook,
  RevisionSchedule,
} from '../types';

// ─── Exam Profiles ──────────────────────────────────────────────────────────

export const useExamProfiles = () => {
  return useQuery<ExamProfile[]>({
    queryKey: ['examProfiles'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('exam_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as ExamProfile[];
      } catch (err) {
        // Fall back
      }
      return localGet<ExamProfile>('exam_profiles');
    },
  });
};

export const useExamProfile = (id: string) => {
  return useQuery<ExamProfile>({
    queryKey: ['examProfile', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('exam_profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as ExamProfile;
      } catch (err) {
        // Fall back
      }
      const exams = localGet<ExamProfile>('exam_profiles');
      return exams.find((e) => e.id === id) || exams[0];
    },
    enabled: !!id,
  });
};

export const useExamProgress = (id: string) => {
  return useQuery<ExamProgress>({
    queryKey: ['examProgress', id],
    queryFn: async () => {
      let subjectsWithChapters: any[] = [];
      try {
        const { data, error } = await supabase
          .from('exam_subjects')
          .select('id, name, color, exam_chapters(id, is_completed, status, exam_topics(id, is_completed, status))')
          .eq('exam_profile_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          subjectsWithChapters = data;
        }
      } catch (err) {
        // Fall back to localDb
      }

      if (subjectsWithChapters.length === 0) {
        const localSubjects = localGet<any>('exam_subjects').filter(
          (s: any) => s.exam_profile_id === id || s.exam_profile === id
        );
        const allChapters = localGet<any>('exam_chapters');
        const allTopics = localGet<any>('exam_topics');
        subjectsWithChapters = localSubjects.map((sub: any) => {
          const chs = allChapters.filter(
            (c: any) => c.subject_id === sub.id || c.subject === sub.id
          );
          return {
            ...sub,
            exam_chapters: chs.map((c: any) => ({
              ...c,
              exam_topics: allTopics.filter(
                (t: any) => t.chapter_id === c.id || t.chapter === c.id
              ),
            })),
          };
        });
      }

      let total = 0;
      let completed = 0;
      const bySubject: ExamProgress['by_subject'] = [];

      for (const sub of subjectsWithChapters) {
        let subTotal = 0;
        let subCompleted = 0;
        const chapters = sub.exam_chapters || sub.chapters || [];
        for (const ch of chapters) {
          const topics = ch.exam_topics || ch.topics || [];
          if (topics.length > 0) {
            for (const topic of topics) {
              total++;
              subTotal++;
              if (topic.is_completed || topic.status === 'completed') {
                completed++;
                subCompleted++;
              }
            }
          } else {
            // Count chapter directly if no granular topics exist
            total++;
            subTotal++;
            if (ch.is_completed || ch.status === 'completed') {
              completed++;
              subCompleted++;
            }
          }
        }
        bySubject.push({
          subject_id: sub.id,
          subject_name: sub.name,
          color: sub.color || '#6366f1',
          total_topics: subTotal,
          completed: subCompleted,
          percent: subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0,
        });
      }

      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        total_topics: total,
        completed: completed,
        completed_topics: completed,
        in_progress: 0,
        pending: Math.max(0, total - completed),
        needs_revision: 0,
        percent: pct,
        progress_percent: pct,
        by_subject: bySubject,
      } as ExamProgress;
    },
    enabled: !!id,
  });
};

export const useCreateExamProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ExamProfile>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data: result, error } = await supabase
          .from('exam_profiles')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) return result as ExamProfile;
      } catch (err) {
        // Fall through
      }
      return localInsert<ExamProfile>('exam_profiles', {
        ...data,
        user_id: user.id,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['examProfiles'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
      qc.invalidateQueries({ queryKey: ['examProgressAnalytics'] });
    },
  });
};

export const useUpdateExamProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExamProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('exam_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ExamProfile;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['examProfiles'] });
      qc.invalidateQueries({ queryKey: ['examProfile', data.id] });
    },
  });
};

export const useDeleteExamProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['examProfiles'] });
      qc.invalidateQueries({ queryKey: ['examProgressAnalytics'] });
    },
  });
};

// ─── Subjects ───────────────────────────────────────────────────────────────

export const useSubjects = (examProfileId?: string) => {
  return useQuery<Subject[]>({
    queryKey: ['subjects', examProfileId],
    queryFn: async () => {
      let cloudSubjects: Subject[] = [];
      try {
        let query = supabase
          .from('exam_subjects')
          .select('*, exam_chapters(*, exam_topics(*))')
          .order('order', { ascending: true });
        if (examProfileId) {
          query = query.eq('exam_profile_id', examProfileId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudSubjects = data.map((sub: any) => ({
            ...sub,
            chapters: (sub.exam_chapters || sub.chapters || []).map((ch: any) => ({
              ...ch,
              topics: ch.exam_topics || ch.topics || [],
            })),
          })) as Subject[];
        }
      } catch (err) {
        // Fall back
      }

      let localSubjects = localGet<Subject>('exam_subjects');
      if (examProfileId) {
        localSubjects = localSubjects.filter(
          (s: any) => s.exam_profile_id === examProfileId || s.exam_profile === examProfileId
        );
      }

      const allLocalChapters = localGet<Chapter>('exam_chapters');
      const allLocalTopics = localGet<Topic>('exam_topics');

      const populatedLocalSubjects = localSubjects.map((sub: any) => {
        const subChapters = allLocalChapters
          .filter((c: any) => c.subject_id === sub.id || c.subject === sub.id)
          .map((ch: any) => {
            const chTopics = allLocalTopics.filter(
              (t: any) => t.chapter_id === ch.id || t.chapter === ch.id
            );
            return {
              ...ch,
              topics: chTopics,
            };
          });
        return {
          ...sub,
          chapters: subChapters,
        };
      });

      const map = new Map<string, Subject>();
      for (const s of populatedLocalSubjects) {
        if (s && s.id) map.set(s.id, s);
      }
      for (const s of cloudSubjects) {
        if (s && s.id) {
          const localItem = map.get(s.id);
          const chapters =
            s.chapters && s.chapters.length > 0
              ? s.chapters
              : localItem?.chapters || [];
          map.set(s.id, { ...s, chapters });
        }
      }

      return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    enabled: examProfileId !== undefined ? !!examProfileId : true,
  });
};

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Subject>) => {
      const payload: Record<string, any> = { ...data };
      const profileId = data.exam_profile || (data as any).exam_profile_id;
      if (profileId) {
        payload.exam_profile_id = profileId;
        payload.exam_profile = profileId;
      }

      // Save locally first so UI updates without crashing
      const localRecord = localInsert<Subject>('exam_subjects', payload as any);

      try {
        const { data: result, error } = await supabase
          .from('exam_subjects')
          .insert({
            name: payload.name,
            weightage: Number(payload.weightage) || 0,
            color: payload.color || '#3B82F6',
            order: Number(payload.order) || 1,
            exam_profile_id: payload.exam_profile_id,
          })
          .select()
          .single();
        if (!error && result) {
          localDelete('exam_subjects', localRecord.id);
          localInsert<Subject>('exam_subjects', result as any);
          return result as Subject;
        }
      } catch (err) {
        // Handled via localRecord
      }
      return localRecord as Subject;
    },
    onSuccess: (data) => {
      const profileId = (data as any).exam_profile_id || (data as any).exam_profile;
      qc.invalidateQueries({ queryKey: ['subjects'] });
      if (profileId) {
        qc.invalidateQueries({ queryKey: ['subjects', profileId] });
        qc.invalidateQueries({ queryKey: ['examProfile', profileId] });
        qc.invalidateQueries({ queryKey: ['examProgress', profileId] });
      }
    },
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('exam_subjects', id);
      try {
        await supabase.from('exam_subjects').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['examProgress'] });
    },
  });
};

// ─── Chapters ───────────────────────────────────────────────────────────────

export const useChapters = (subjectId?: string) => {
  return useQuery<Chapter[]>({
    queryKey: ['chapters', subjectId],
    queryFn: async () => {
      let cloudChapters: Chapter[] = [];
      try {
        let query = supabase
          .from('exam_chapters')
          .select('*, exam_topics(*)')
          .order('order', { ascending: true });
        if (subjectId) {
          query = query.eq('subject_id', subjectId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudChapters = data.map((ch: any) => ({
            ...ch,
            topics: ch.exam_topics || ch.topics || [],
          })) as Chapter[];
        }
      } catch (err) {
        // Fall back
      }

      let localChapters = localGet<Chapter>('exam_chapters');
      if (subjectId) {
        localChapters = localChapters.filter(
          (c: any) => c.subject_id === subjectId || c.subject === subjectId
        );
      }

      const allLocalTopics = localGet<Topic>('exam_topics');
      const populatedLocalChapters = localChapters.map((ch: any) => {
        const chTopics = allLocalTopics.filter(
          (t: any) => t.chapter_id === ch.id || t.chapter === ch.id
        );
        return {
          ...ch,
          topics: chTopics,
        };
      });

      const map = new Map<string, Chapter>();
      for (const c of populatedLocalChapters) {
        if (c && c.id) map.set(c.id, c);
      }
      for (const c of cloudChapters) {
        if (c && c.id) {
          const localItem = map.get(c.id);
          const topics =
            c.topics && c.topics.length > 0
              ? c.topics
              : localItem?.topics || [];
          map.set(c.id, { ...c, topics });
        }
      }

      return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    enabled: subjectId !== undefined ? !!subjectId : true,
  });
};

export const useCreateChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Chapter>) => {
      const payload: Record<string, any> = {
        ...data,
        is_completed: data.is_completed ?? false,
        status: data.status || 'pending',
      };
      const subId = data.subject || (data as any).subject_id;
      if (subId) {
        payload.subject_id = subId;
        payload.subject = subId;
      }

      const localRecord = localInsert<Chapter>('exam_chapters', payload as any);

      try {
        const { data: result, error } = await supabase
          .from('exam_chapters')
          .insert({
            name: payload.name,
            estimated_hours: Number(payload.estimated_hours) || 1,
            order: Number(payload.order) || 1,
            subject_id: payload.subject_id,
            is_completed: payload.is_completed,
            status: payload.status,
          })
          .select()
          .single();
        if (!error && result) {
          localDelete('exam_chapters', localRecord.id);
          localInsert<Chapter>('exam_chapters', result as any);
          return result as Chapter;
        }
      } catch (err) {
        // Handled via localRecord
      }
      return localRecord as Chapter;
    },
    onSuccess: (data) => {
      const subId = (data as any).subject_id || (data as any).subject;
      qc.invalidateQueries({ queryKey: ['chapters'] });
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['examProfile'] });
      qc.invalidateQueries({ queryKey: ['examProgress'] });
      if (subId) {
        qc.invalidateQueries({ queryKey: ['chapters', subId] });
      }
    },
  });
};

export const useUpdateChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Chapter> & { id: string }) => {
      const payload: Record<string, any> = { ...updates };
      const subId = updates.subject || (updates as any).subject_id;
      if (subId) {
        payload.subject_id = subId;
        payload.subject = subId;
      }

      const localUpdated = localUpdate<Chapter>('exam_chapters', id, payload);

      try {
        const { data, error } = await supabase
          .from('exam_chapters')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Chapter;
      } catch (err) {
        // Fall back
      }
      return localUpdated as Chapter;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapters'] });
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['examProfile'] });
      qc.invalidateQueries({ queryKey: ['examProgress'] });
      qc.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
};

export const useDeleteChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('exam_chapters', id);
      try {
        await supabase.from('exam_chapters').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapters'] });
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['examProgress'] });
    },
  });
};

// ─── Topics ─────────────────────────────────────────────────────────────────

export const useTopics = (chapterId?: string) => {
  return useQuery<Topic[]>({
    queryKey: ['topics', chapterId],
    queryFn: async () => {
      let query = supabase
        .from('exam_topics')
        .select('*')
        .order('order', { ascending: true });
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Topic[];
    },
    enabled: chapterId !== undefined ? !!chapterId : true,
  });
};

export const useCreateTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Topic>) => {
      const payload: Record<string, any> = { ...data };
      if (data.chapter && !payload.chapter_id) {
        payload.chapter_id = data.chapter;
      }
      const { data: result, error } = await supabase
        .from('exam_topics')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return result as Topic;
    },
    onSuccess: (data) => {
      const chId = data.chapter_id || data.chapter;
      if (chId) {
        qc.invalidateQueries({ queryKey: ['topics', chId] });
      }
    },
  });
};

export const useUpdateTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Topic> & { id: string }) => {
      const payload: Record<string, any> = { ...updates };
      if (updates.chapter && !payload.chapter_id) {
        payload.chapter_id = updates.chapter;
      }
      const { data, error } = await supabase
        .from('exam_topics')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Topic;
    },
    onSuccess: (data) => {
      const chId = data.chapter_id || data.chapter;
      if (chId) {
        qc.invalidateQueries({ queryKey: ['topics', chId] });
      }
    },
  });
};

export const useDeleteTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_topics').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  });
};

// ─── Mock Tests ─────────────────────────────────────────────────────────────

export const useMockTests = (examProfileId?: string) => {
  return useQuery<MockTest[]>({
    queryKey: ['mockTests', examProfileId],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        let query = supabase
          .from('mock_tests')
          .select('*')
          .eq('user_id', user.id)
          .order('test_date', { ascending: false });
        if (examProfileId) {
          query = query.eq('exam_profile_id', examProfileId);
        }
        const { data, error } = await query;
        if (!error && data) return data as MockTest[];
      } catch (err) {
        // Fall back
      }
      return [] as MockTest[];
    },
  });
};

export const useCreateMockTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MockTest>) => {
      const user = await getAuthenticatedUser();
      const payload: Record<string, any> = { ...data, user_id: user.id };
      if (data.exam_profile && !payload.exam_profile_id) {
        payload.exam_profile_id = data.exam_profile;
      }
      try {
        const { data: result, error } = await supabase
          .from('mock_tests')
          .insert(payload)
          .select()
          .single();
        if (!error && result) return result as MockTest;
      } catch (err) {
        // Fall through
      }
      return { id: `mock-${Date.now()}`, ...payload } as MockTest;
    },
    onSuccess: (data) => {
      const profileId = data.exam_profile_id || data.exam_profile;
      if (profileId) {
        qc.invalidateQueries({ queryKey: ['mockTests', profileId] });
      } else {
        qc.invalidateQueries({ queryKey: ['mockTests'] });
      }
    },
  });
};

export const useDeleteMockTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('mock_tests').delete().eq('id', id);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mockTests'] }),
  });
};

// ─── Mistakes ───────────────────────────────────────────────────────────────

export const useMistakes = (examProfileId?: string) => {
  return useQuery<MistakeNotebook[]>({
    queryKey: ['mistakes', examProfileId],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        let query = supabase
          .from('mistake_notebooks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (examProfileId) {
          query = query.eq('exam_profile_id', examProfileId);
        }
        const { data, error } = await query;
        if (!error && data) return data as MistakeNotebook[];
      } catch (err) {
        // Fall through
      }
      return [] as MistakeNotebook[];
    },
  });
};

export const useCreateMistake = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MistakeNotebook>) => {
      const user = await getAuthenticatedUser();
      const payload: Record<string, any> = { ...data, user_id: user.id };
      if (data.exam_profile && !payload.exam_profile_id) {
        payload.exam_profile_id = data.exam_profile;
      }
      try {
        const { data: result, error } = await supabase
          .from('mistake_notebooks')
          .insert(payload)
          .select()
          .single();
        if (!error && result) return result as MistakeNotebook;
      } catch (err) {
        // Fall through
      }
      return { id: `mistake-${Date.now()}`, ...payload } as MistakeNotebook;
    },
    onSuccess: (data) => {
      const profileId = data.exam_profile_id || data.exam_profile;
      if (profileId) {
        qc.invalidateQueries({ queryKey: ['mistakes', profileId] });
      } else {
        qc.invalidateQueries({ queryKey: ['mistakes'] });
      }
    },
  });
};

export const useDeleteMistake = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('mistake_notebooks').delete().eq('id', id);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mistakes'] }),
  });
};

// ─── Revisions ──────────────────────────────────────────────────────────────

export const useRevisions = (examProfileId?: string) => {
  return useQuery<RevisionSchedule[]>({
    queryKey: ['revisions', examProfileId],
    queryFn: async () => {
      let cloudRevisions: RevisionSchedule[] = [];
      try {
        const user = await getAuthenticatedUser();
        let query = supabase
          .from('revision_schedules')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_date', { ascending: true });
        if (examProfileId) {
          query = query.eq('exam_profile_id', examProfileId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudRevisions = data as RevisionSchedule[];
        }
      } catch (err) {
        // Fall through
      }

      let localRevisions = localGet<RevisionSchedule>('revision_schedules');
      if (examProfileId) {
        localRevisions = localRevisions.filter(
          (r: any) =>
            r.exam_profile_id === examProfileId || r.exam_profile === examProfileId
        );
      }

      const map = new Map<string, RevisionSchedule>();
      for (const r of localRevisions) {
        if (r && r.id) map.set(r.id, r);
      }
      for (const r of cloudRevisions) {
        if (r && r.id) map.set(r.id, r);
      }

      return Array.from(map.values()).sort(
        (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );
    },
  });
};

export const useCreateRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RevisionSchedule>) => {
      let userId = 'demo-user-12345';
      try {
        const user = await getAuthenticatedUser();
        userId = user.id;
      } catch (err) {
        // fallback
      }
      const payload: Record<string, any> = {
        ...data,
        user_id: data.user_id || userId,
        completed: data.completed ?? false,
        interval_days: data.interval_days || 1,
        revision_number: data.revision_number || 1,
        scheduled_date:
          data.scheduled_date ||
          new Date(Date.now() + 86400000).toISOString().split('T')[0],
      };
      if (data.exam_profile && !payload.exam_profile_id) {
        payload.exam_profile_id = data.exam_profile;
      }

      const localRecord = localInsert<RevisionSchedule>(
        'revision_schedules',
        payload as any
      );

      try {
        const { data: result, error } = await supabase
          .from('revision_schedules')
          .insert(payload)
          .select()
          .single();
        if (!error && result) {
          localDelete('revision_schedules', localRecord.id);
          localInsert<RevisionSchedule>('revision_schedules', result as any);
          return result as RevisionSchedule;
        }
      } catch (err) {
        // Fall through
      }
      return localRecord as RevisionSchedule;
    },
    onSuccess: (data) => {
      const profileId = data.exam_profile_id || data.exam_profile;
      qc.invalidateQueries({ queryKey: ['revisions'] });
      if (profileId) {
        qc.invalidateQueries({ queryKey: ['revisions', profileId] });
      }
    },
  });
};

export const useCompleteRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      localUpdate<RevisionSchedule>('revision_schedules', id, {
        completed: true,
        completed_at: now,
      });

      try {
        const { data, error } = await supabase
          .from('revision_schedules')
          .update({ completed: true, completed_at: now })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as RevisionSchedule;
      } catch (err) {
        // ignore
      }
      return { id, completed: true, completed_at: now } as RevisionSchedule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revisions'] }),
  });
};

export const useDeleteRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('revision_schedules', id);
      try {
        await supabase.from('revision_schedules').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revisions'] }),
  });
};
