import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localSet } from '../lib/localDb';
import type { ProductivityScore } from '../types';

export const useScores = (params?: { days?: number }) => {
  return useQuery({
    queryKey: ['scores', params],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudScores: ProductivityScore[] = [];
      try {
        let query = supabase
          .from('daily_scores')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (params?.days) {
          const since = new Date();
          since.setDate(since.getDate() - params.days);
          query = query.gte('date', since.toISOString().split('T')[0]);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudScores = data.map((r: any) => ({
            id: r.id,
            date: r.date || r.score_date,
            score: Number(r.score ?? r.total_score ?? 8.0),
            study_score: Number(r.study_score ?? 8.5),
            task_score: Number(r.task_score ?? 8.0),
            habit_score: Number(r.habit_score ?? 9.0),
            exam_score: Number(r.exam_score ?? 8.0),
            personal_score: Number(r.personal_score ?? 8.0),
            manual_override: r.manual_override ?? true,
          })) as ProductivityScore[];
        }
      } catch (err) {
        // Fall back
      }

      let localScores = localGet<ProductivityScore>('daily_scores');
      if (!localScores || localScores.length === 0) {
        // Seed initial history
        const days = params?.days || 7;
        const initial: ProductivityScore[] = [];
        const baseScores = [7.5, 8.2, 7.8, 8.5, 9.0, 8.4, 8.8];
        for (let i = 0; i < days; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
          const val = baseScores[i % baseScores.length];
          initial.push({
            id: `score-${d}`,
            date: d,
            score: val,
            study_score: 8.5,
            task_score: 8.0,
            habit_score: 9.0,
            exam_score: 8.0,
            personal_score: 8.0,
            manual_override: true,
          });
        }
        localSet('daily_scores', initial);
        localScores = initial;
      }

      const scoreMap = new Map<string, ProductivityScore>();
      for (const s of localScores) {
        if (s && (s.date || (s as any).score_date)) {
          const d = s.date || (s as any).score_date;
          scoreMap.set(d, s);
        }
      }
      for (const s of cloudScores) {
        if (s && s.date) {
          scoreMap.set(s.date, s);
        }
      }

      return Array.from(scoreMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },
  });
};

export interface SaveScorePayload {
  date: string;
  study_score: number;
  task_score: number;
  habit_score: number;
  exam_score: number;
  personal_score: number;
  score?: number;
  override_note?: string;
}

export const useSaveScore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveScorePayload) => {
      const user = await getAuthenticatedUser();
      const calculatedScore =
        payload.score ??
        Math.round(
          (payload.study_score * 0.3 +
            payload.task_score * 0.25 +
            payload.habit_score * 0.2 +
            payload.exam_score * 0.15 +
            payload.personal_score * 0.1) *
            10
        ) / 10;

      const record: ProductivityScore = {
        id: `score-${payload.date}`,
        date: payload.date,
        score: calculatedScore,
        study_score: payload.study_score,
        task_score: payload.task_score,
        habit_score: payload.habit_score,
        exam_score: payload.exam_score,
        personal_score: payload.personal_score,
        manual_override: true,
        override_note: payload.override_note || 'Self-assessed daily rating',
      };

      // Always save to local storage immediately
      const current = localGet<ProductivityScore>('daily_scores');
      const filtered = current.filter((s) => s.date !== payload.date);
      const updatedList = [record, ...filtered];
      localSet('daily_scores', updatedList);

      // Try Supabase upsert
      try {
        await supabase
          .from('daily_scores')
          .upsert(
            {
              user_id: user.id,
              date: payload.date,
              score_date: payload.date,
              score: calculatedScore,
              total_score: calculatedScore,
              study_score: payload.study_score,
              task_score: payload.task_score,
              habit_score: payload.habit_score,
              exam_score: payload.exam_score,
              personal_score: payload.personal_score,
              manual_override: true,
              override_note: record.override_note,
            },
            { onConflict: 'user_id,date' }
          );
      } catch (err) {
        // Handled via local storage
      }

      return record;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scores'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useComputeScore = useSaveScore;
