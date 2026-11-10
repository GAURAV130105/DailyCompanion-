import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import {
  useDailyPlanByDate,
  useCreateDailyPlan,
  useUpdateDailyPlan,
  useTimeBlocks,
  useCreateTimeBlock,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
} from '../../api/planner';
import { todayISO } from '../../lib/utils';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Target,
  Sparkles,
  Coffee,
  BookOpen,
  Dumbbell,
  Moon,
  Utensils,
  CheckSquare,
} from 'lucide-react';
import type { TimeBlock } from '../../types';

export const PlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());

  // Fetch plan for selected date (backend gets or creates smoothly)
  const { data: currentPlan, isLoading: loadingPlan } = useDailyPlanByDate(selectedDate);
  const { data: timeBlocks = [], isLoading: loadingBlocks } = useTimeBlocks({ date: selectedDate });

  const createPlan = useCreateDailyPlan();
  const updatePlan = useUpdateDailyPlan();
  const createBlock = useCreateTimeBlock();
  const updateBlock = useUpdateTimeBlock();
  const deleteBlock = useDeleteTimeBlock();

  const [newBlock, setNewBlock] = useState({
    title: '',
    start_time: '09:00',
    end_time: '11:00',
    block_type: 'study' as const,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [primaryGoalText, setPrimaryGoalText] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Sync primary goal text when currentPlan loads or selected date changes
  React.useEffect(() => {
    setPrimaryGoalText(currentPlan?.primary_goal || '');
  }, [currentPlan, selectedDate]);

  const handleSaveGoal = async () => {
    try {
      if (currentPlan?.id) {
        await updatePlan.mutateAsync({
          id: currentPlan.id,
          primary_goal: primaryGoalText,
        });
      } else {
        await createPlan.mutateAsync({
          date: selectedDate,
          primary_goal: primaryGoalText,
        });
      }
      setIsEditingGoal(false);
    } catch (err) {
      console.warn('Plan goal save handled:', err);
      setIsEditingGoal(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let planId = currentPlan?.id;
      if (!planId) {
        const created = await createPlan.mutateAsync({
          date: selectedDate,
          primary_goal: primaryGoalText || 'Focus on daily goals',
        });
        planId = created.id;
      }

      await createBlock.mutateAsync({
        daily_plan_id: planId,
        daily_plan: planId,
        date: selectedDate,
        title: newBlock.title,
        start_time: newBlock.start_time,
        end_time: newBlock.end_time,
        block_type: newBlock.block_type,
        category: newBlock.block_type,
        is_completed: false,
      });

      setNewBlock({ title: '', start_time: '09:00', end_time: '11:00', block_type: 'study' });
      setShowAddModal(false);
    } catch (err) {
      console.warn('Block creation handled:', err);
      setShowAddModal(false);
    }
  };

  const handleDeleteBlock = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}"?`)) {
      await deleteBlock.mutateAsync(id);
    }
  };

  const getBlockIcon = (type?: string) => {
    switch (type) {
      case 'study':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'break':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'exercise':
        return <Dumbbell className="w-4 h-4 text-rose-500" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loadingPlan && loadingBlocks) return <LoadingSkeleton rows={4} />;

  // Consolidate blocks from hook and plan's nested blocks, deduplicating by ID and sorting chronologically
  const isSeedBlock = (b: any) =>
    !b ||
    b.id === 'block-1' ||
    b.id === 'block-2' ||
    b.title?.toLowerCase().includes('polity deep study') ||
    b.title?.toLowerCase().includes('csat practice');

  const allBlocksMap = new Map<string, TimeBlock>();
  if (currentPlan && currentPlan.date === selectedDate && Array.isArray(currentPlan.time_blocks)) {
    for (const b of currentPlan.time_blocks) {
      if (b && b.id && !isSeedBlock(b)) allBlocksMap.set(b.id, b);
    }
  }
  for (const b of timeBlocks) {
    if (b && b.id && !isSeedBlock(b)) {
      if (!b.date || b.date === selectedDate) {
        allBlocksMap.set(b.id, b);
      }
    }
  }
  const blocks: TimeBlock[] = Array.from(allBlocksMap.values()).sort((a, b) =>
    (a.start_time || '').localeCompare(b.start_time || '')
  );
  const completedCount = blocks.filter((b) => b.is_completed).length;
  const totalCount = blocks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Daily Planner"
        description="Schedule your day into structured time blocks. Protect high-focus study hours, balance breaks, and eliminate scheduling conflicts."
        action={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Time Block
            </button>
          </div>
        }
      />

      {/* MIT (Most Important Task) Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Primary Focus for the Day (MIT)
              </div>
              {isEditingGoal ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    value={primaryGoalText}
                    onChange={(e) => setPrimaryGoalText(e.target.value)}
                    placeholder="What is your #1 critical milestone for today?"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGoal}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3 py-1.5 text-xs font-semibold bg-muted text-foreground rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingGoal(true)}
                  className="text-sm font-semibold text-foreground mt-0.5 cursor-pointer hover:text-primary transition"
                  title="Click to edit daily MIT"
                >
                  {primaryGoalText || currentPlan?.primary_goal || 'Click here to set today\'s MIT (Most Important Task)...'}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-muted-foreground">Execution</span>
            <div className="text-lg font-black text-primary">{completionPercent}%</div>
            <span className="text-[11px] text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Schedule Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Daily Time Blocks ({blocks.length})
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title="No blocks scheduled for this day"
              description="Plan your study slots, practice tests, exercise routines, and breaks to maintain maximum focus."
              action={
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule First Time Block
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => {
                const activityType = block.block_type || block.category || 'study';
                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition ${
                      block.is_completed
                        ? 'bg-muted/30 border-border opacity-70'
                        : 'bg-background border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() =>
                          updateBlock.mutate({
                            id: block.id,
                            is_completed: !block.is_completed,
                          })
                        }
                        className={`mt-0.5 rounded-full p-1 transition ${
                          block.is_completed
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                        title={block.is_completed ? 'Mark pending' : 'Mark completed'}
                      >
                        {block.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getBlockIcon(activityType)}
                          <h4
                            className={`text-sm font-semibold truncate ${
                              block.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {block.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {block.start_time?.slice(0, 5)} - {block.end_time?.slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span className="capitalize font-medium text-primary">
                            {activityType}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          block.is_completed
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {block.is_completed ? 'Done' : 'Scheduled'}
                      </span>
                      <button
                        onClick={() => handleDeleteBlock(block.id, block.title)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                        title="Delete time block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Routine & Productivity Tips */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> High-Performance Guidelines
            </h4>
            <ul className="text-xs text-muted-foreground space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="text-primary font-bold text-sm">•</span>
                <span>
                  <strong>Deep Work First:</strong> Reserve morning hours for challenging syllabus chapters (Polity, CSAT, Optional).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary font-bold text-sm">•</span>
                <span>
                  <strong>Active Recall Buffer:</strong> Dedicate 45 minutes at dusk to review mistake notebooks and flashcards.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary font-bold text-sm">•</span>
                <span>
                  <strong>Rest & Recovery:</strong> Keep meal and exercise blocks sacred to avoid burnout during exam prep cycles.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-foreground mb-3">Day Overview</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border text-muted-foreground">
                <span>Total Time Blocks:</span>
                <span className="font-semibold text-foreground">{totalCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border text-muted-foreground">
                <span>Completed Blocks:</span>
                <span className="font-semibold text-emerald-500">{completedCount}</span>
              </div>
              <div className="flex justify-between py-1 text-muted-foreground">
                <span>Pending Blocks:</span>
                <span className="font-semibold text-primary">{totalCount - completedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Time Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add Time Block
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Indian History - Spectrum Chapter 5"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Activity Category</label>
                <select
                  value={newBlock.block_type}
                  onChange={(e) => setNewBlock({ ...newBlock, block_type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="study">Study / Deep Work</option>
                  <option value="task">Task / To-Do</option>
                  <option value="break">Rest / Break</option>
                  <option value="exercise">Workout / Exercise</option>
                  <option value="meal">Meal</option>
                  <option value="sleep">Sleep</option>
                  <option value="other">Other</option>
                </select>
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
                  disabled={createBlock.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                >
                  {createBlock.isPending ? 'Saving...' : 'Save Time Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
