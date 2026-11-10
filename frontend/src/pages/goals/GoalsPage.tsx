import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../../api/goals';
import { Target, Plus, CheckCircle2, Calendar, Trash2, Check, Award } from 'lucide-react';
import type { Goal } from '../../types';

export const GoalsPage: React.FC = () => {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'academic' as const,
    target_date: '',
    progress: 0,
  });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGoal.mutateAsync({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        target_date: newGoal.target_date || null,
        progress: Number(newGoal.progress),
        status: Number(newGoal.progress) === 100 ? 'completed' : 'active',
      });
      setNewGoal({ title: '', description: '', category: 'academic', target_date: '', progress: 0 });
      setShowAddModal(false);
    } catch (err: any) {
      console.warn('Goal creation handled:', err);
      setShowAddModal(false);
    }
  };

  const handleProgressChange = async (id: string, newProgress: number) => {
    const isDone = newProgress >= 100;
    await updateGoal.mutateAsync({
      id,
      progress: newProgress,
      status: isDone ? 'completed' : 'active',
    });
  };

  const handleToggleComplete = async (goal: Goal) => {
    const isDone = goal.progress >= 100 || goal.status === 'completed';
    await updateGoal.mutateAsync({
      id: goal.id,
      progress: isDone ? 0 : 100,
      status: isDone ? 'active' : 'completed',
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete goal "${title}"?`)) {
      await deleteGoal.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;

  const completedCount = goals.filter((g) => g.progress >= 100 || g.status === 'completed').length;
  const inProgressCount = goals.length - completedCount;
  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + (Number(g.progress) || 0), 0) / goals.length)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & Milestones"
        description="Set high-impact academic, exam qualification, health, and personal milestone objectives. Adjust sliders to track progress."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Set New Goal
          </button>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Milestones Completed
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {completedCount} <span className="text-xs font-normal text-muted-foreground">/ {goals.length}</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              In Active Progress
            </span>
            <div className="text-2xl font-black text-primary mt-1">{inProgressCount}</div>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Overall Completion Rate
            </span>
            <div className="text-2xl font-black text-foreground mt-1">{avgProgress}%</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="No goals formulated yet"
          description="Transform broad ambitions into measurable milestones — whether it is completing 10,000 MCQs, finishing GS-1 syllabus, or qualifying Prelims."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Define First Goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const isCompleted = g.progress >= 100 || g.status === 'completed';
            return (
              <div
                key={g.id}
                className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition ${
                  isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {g.category}
                    </span>

                    <button
                      onClick={() => handleToggleComplete(g)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-muted/60 text-muted-foreground border-border hover:border-primary'
                      }`}
                      title={isCompleted ? 'Mark Incomplete' : 'Mark 100% Completed'}
                    >
                      <Check className="w-3 h-3" />
                      {isCompleted ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>

                  <h3
                    className={`font-bold text-base mb-1 ${
                      isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {g.title}
                  </h3>
                  {g.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                  )}

                  {/* Interactive Slider & Progress */}
                  <div className="mt-5 space-y-2 p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground text-[11px]">
                        Completion Slider
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          isCompleted ? 'text-emerald-600' : 'text-primary'
                        }`}
                      >
                        {g.progress}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={g.progress}
                      onChange={(e) => handleProgressChange(g.id, Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                    />

                    {/* Progress Bar Display */}
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {g.target_date || 'No deadline'}
                  </span>
                  <button
                    onClick={() => handleDelete(g.id, g.title)}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
            <h3 className="font-bold text-lg text-foreground">Create Goal / Milestone</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete 50 Mock Tests before May"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cover all test series papers with detailed solution analysis"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="academic">Academic / Coursework</option>
                  <option value="exam">Competitive Exam Prep</option>
                  <option value="skill">Skill & Career</option>
                  <option value="health">Fitness & Health</option>
                  <option value="personal">Personal Development</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Current Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newGoal.progress}
                    onChange={(e) => setNewGoal({ ...newGoal, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
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
                  disabled={createGoal.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                >
                  {createGoal.isPending ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
