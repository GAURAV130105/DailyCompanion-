import { describe, it, expect, beforeEach } from 'vitest';
import { localGet, localSet } from './lib/localDb';

describe('Planner & Habit Local Storage Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('purges Polity Deep Study and CSAT Practice from time_blocks', () => {
    // Simulate dirty localStorage with legacy seed blocks
    localStorage.setItem(
      'slos_local_time_blocks',
      JSON.stringify([
        { id: 'block-1', title: 'Polity Deep Study Session', start_time: '09:00' },
        { id: 'block-2', title: 'CSAT Practice Problems', start_time: '14:00' },
        { id: 'block-custom', title: 'Mathematics', start_time: '10:00' },
      ])
    );

    const blocks = localGet('time_blocks');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe('Mathematics');
  });

  it('purges Polity Deep Study and CSAT Practice from daily_plans', () => {
    localStorage.setItem(
      'slos_local_daily_plans',
      JSON.stringify([
        {
          id: 'plan-1',
          date: '2026-11-10',
          time_blocks: [
            { id: 'block-1', title: 'Polity Deep Study Session' },
            { id: 'block-math', title: 'Mathematics' },
          ],
        },
      ])
    );

    const plans = localGet('daily_plans');
    expect(plans).toHaveLength(1);
    expect(plans[0].time_blocks).toHaveLength(1);
    expect(plans[0].time_blocks[0].title).toBe('Mathematics');
  });

  it('stores and retrieves habit logs and habits via localSet', () => {
    const habit = { id: 'h-1', name: 'Reasoning / DSA', current_streak: 2 };
    localSet('habits', [habit]);

    const loadedHabits = localGet('habits');
    expect(loadedHabits).toHaveLength(1);
    expect(loadedHabits[0].name).toBe('Reasoning / DSA');
    expect(loadedHabits[0].current_streak).toBe(2);

    const log = { id: 'hl-1', habit: 'h-1', date: '2026-11-10', completed: true, value: 1 };
    localSet('habit_logs', [log]);

    const loadedLogs = localGet('habit_logs');
    expect(loadedLogs).toHaveLength(1);
    expect(loadedLogs[0].completed).toBe(true);
  });
});
