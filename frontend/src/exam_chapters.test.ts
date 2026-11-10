import { describe, it, expect, beforeEach } from 'vitest';
import { localGet, localInsert, localUpdate, localDelete, localSet } from './lib/localDb';
import type { Chapter, RevisionSchedule, Subject } from './types';

describe('Exam Chapters & Revision Transfer Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows adding chapters with estimated hours and default status', () => {
    const chapter = localInsert<Chapter>('exam_chapters', {
      subject_id: 'sub-polity',
      name: 'Preamble & Salient Features',
      estimated_hours: 8,
      order: 1,
      is_completed: false,
      status: 'pending',
    } as any);

    expect(chapter.id).toBeDefined();
    expect(chapter.name).toBe('Preamble & Salient Features');
    expect(chapter.is_completed).toBe(false);

    const allChapters = localGet<Chapter>('exam_chapters');
    expect(allChapters.some((c) => c.name === 'Preamble & Salient Features')).toBe(true);
  });

  it('updates chapter completion state when ticked and transfers to revision', () => {
    const chapter = localInsert<Chapter>('exam_chapters', {
      subject_id: 'sub-polity',
      name: 'Fundamental Rights & Duties',
      estimated_hours: 12,
      order: 2,
      is_completed: false,
      status: 'pending',
    } as any);

    // User ticks chapter as completed
    const updatedChapter = localUpdate<Chapter>('exam_chapters', chapter.id, {
      is_completed: true,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    expect(updatedChapter).not.toBeNull();
    expect(updatedChapter?.is_completed).toBe(true);
    expect(updatedChapter?.status).toBe('completed');

    // Transferred to revision schedule
    const scheduledDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const revision = localInsert<RevisionSchedule>('revision_schedules', {
      exam_profile_id: 'exam-1',
      topic: chapter.id,
      topic_name: chapter.name,
      subject_name: 'Indian Polity',
      item_type: 'chapter',
      scheduled_date: scheduledDate,
      interval_days: 1,
      revision_number: 1,
      completed: false,
    } as any);

    expect(revision.id).toBeDefined();
    expect(revision.topic_name).toBe('Fundamental Rights & Duties');
    expect(revision.item_type).toBe('chapter');
    expect(revision.completed).toBe(false);

    const revisions = localGet<RevisionSchedule>('revision_schedules');
    expect(revisions.some((r) => r.topic === chapter.id)).toBe(true);
  });

  it('removes chapter from revision when un-ticked', () => {
    const chapter = localInsert<Chapter>('exam_chapters', {
      subject_id: 'sub-polity',
      name: 'Directive Principles (DPSP)',
      estimated_hours: 6,
      order: 3,
      is_completed: true,
      status: 'completed',
    } as any);

    const revision = localInsert<RevisionSchedule>('revision_schedules', {
      exam_profile_id: 'exam-1',
      topic: chapter.id,
      topic_name: chapter.name,
      scheduled_date: '2026-11-12',
      completed: false,
      interval_days: 1,
      revision_number: 1,
    } as any);

    expect(localGet<RevisionSchedule>('revision_schedules')).toHaveLength(1);

    // User un-ticks chapter
    localUpdate<Chapter>('exam_chapters', chapter.id, {
      is_completed: false,
      status: 'pending',
      completed_at: null,
    });
    localDelete('revision_schedules', revision.id);

    const remaining = localGet<RevisionSchedule>('revision_schedules');
    expect(remaining).toHaveLength(0);
  });
});
