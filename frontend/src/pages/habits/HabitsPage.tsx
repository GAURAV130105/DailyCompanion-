import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useHabits, useHabitLogs, useCreateHabit, useLogHabit, useDeleteHabit } from '../../api/habits';
import { todayISO } from '../../lib/utils';
import { Repeat, Plus, Check, Flame, Award, Calendar, Trash2 } from 'lucide-react';

export const HabitsPage: React.FC = () => {
  const today = todayISO();
  const { data: habits = [], isLoading } = useHabits();
  const { data: todayLogs = [] } = useHabitLogs(today);
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const deleteHabit = useDeleteHabit();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'daily' as const,
    target_count: 1,
    unit: 'times',
    color: '#10B981',
  });

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHabit.mutateAsync(newHabit);
      setNewHabit({ name: '', frequency: 'daily', target_count: 1, unit: 'times', color: '#10B981' });
      setShowAddModal(false);
    } catch (err: any) {
      console.warn('Habit creation handled:', err);
      setShowAddModal(false);
    }
  };

  const isHabitCompletedToday = (habitId: string) => {
    const log = todayLogs.find((l: any) => l.habit === habitId || l.habit_id === habitId);
    return Boolean(log?.completed);
  };

  const handleToggleHabit = async (habitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = isHabitCompletedToday(habitId);
    try {
      await logHabit.mutateAsync({
        habit: habitId,
        date: today,
        completed: !current,
        value: !current ? 1 : 0,
      });
    } catch (err) {
      console.warn('Habit toggle handled:', err);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;

  const completedTodayCount = habits.filter((h) => isHabitCompletedToday(h.id)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habit & Routine Tracker"
        description="Build compounding consistency across your study sessions, physical health, reading habits, and revision rituals."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Habit
          </button>
        }
      />

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Daily Routine Progress</span>
          <h3 className="text-2xl font-bold text-foreground mt-1">
            {completedTodayCount} of {habits.length} Habits Completed Today
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {completedTodayCount === habits.length && habits.length > 0
              ? '🎉 All routines completed! Incredible discipline today.'
              : 'Keep going — each completed routine boosts your daily productivity score.'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-current" />
              {habits.filter((h) => (Number(h.current_streak) || 0) > 0).length}
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase">Active Streaks</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-primary">
              {habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0}%
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase">Today's Rate</span>
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" />}
          title="No habits configured yet"
          description="Start tracking daily habits like 'Read The Hindu Editorial', '50 GS Practice Questions', 'Morning Jog', or 'Daily Meditation'."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Habit
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const completed = isHabitCompletedToday(habit.id);
            const streak = Number(habit.current_streak) || 0;
            return (
              <div
                key={habit.id}
                onClick={(e) => handleToggleHabit(habit.id, e)}
                className={`p-5 rounded-2xl border transition cursor-pointer select-none flex flex-col justify-between ${
                  completed
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: habit.color || '#10B981' }}
                    />
                    <h4
                      className={`font-semibold text-sm truncate ${
                        completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {habit.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleHabit(habit.id, e)}
                    className="p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    aria-label={completed ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
                  >
                    {completed ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-border hover:border-emerald-500 flex items-center justify-center transition" />
                    )}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize font-medium">{habit.frequency}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        streak > 0 ? 'text-amber-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'fill-amber-500' : ''}`} />{' '}
                      {streak} {streak === 1 ? 'day streak' : 'days streak'}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete habit "${habit.name}"?`)) {
                          await deleteHabit.mutateAsync(habit.id);
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Create Habit</h3>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Newspaper Analysis"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Frequency</label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Color Theme</label>
                  <input
                    type="color"
                    value={newHabit.color}
                    onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                    className="w-full h-9 p-1 rounded-lg border border-border bg-background cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
