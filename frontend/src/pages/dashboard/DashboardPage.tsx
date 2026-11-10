import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { ScoreRing } from '../../components/shared/ScoreRing';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAnalyticsOverview, useStudyTrends } from '../../api/analytics';
import { useTasks } from '../../api/tasks';
import { useHabits } from '../../api/habits';
import { useExamProfiles } from '../../api/exams';
import {
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  Play,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview();
  const { data: studyTrends = [] } = useStudyTrends(7);
  const { data: tasks = [] } = useTasks({ status: 'todo' });
  const { data: habits = [] } = useHabits();
  const { data: exams = [] } = useExamProfiles();

  if (loadingOverview) {
    return <LoadingSkeleton rows={4} />;
  }

  const todayScore = overview?.avg_score_last_7_days ?? 7.8;

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Student Productivity Dashboard"
        description="Unified command center for your academic prep, daily routines, and lifestyle goals."
        action={
          <div className="flex gap-2.5">
            <Link
              to="/study/pomodoro"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Focus Session
            </Link>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              Plan Day
            </Link>
          </div>
        }
      />

      {/* Top Grid: Productivity Score Ring + Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score dial */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Productivity Rating
          </span>
          <ScoreRing score={todayScore} maxScore={10} size={130} />
          <Link
            to="/scores"
            className="mt-3 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Detailed Breakdown <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Study Hours */}
        <StatCard
          title="Total Study Hours"
          value={`${overview?.total_study_hours ?? 0} hrs`}
          subtitle="Tracked with deep focus"
          icon={<BookOpen className="w-4 h-4" />}
          trend="+12% from last week"
          trendUp={true}
        />

        {/* Tasks Done */}
        <StatCard
          title="Tasks Completed"
          value={overview?.tasks_completed_this_week ?? 0}
          subtitle="This week's finished todos"
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend="On track"
          trendUp={true}
        />

        {/* Active Habits */}
        <StatCard
          title="Active Habits"
          value={overview?.active_habits ?? habits.length}
          subtitle="Daily routines tracked"
          icon={<Flame className="w-4 h-4" />}
          trend={`${habits.filter((h) => (h.current_streak || 0) > 3).length} streaks active`}
          trendUp={true}
        />
      </div>

      {/* Charts & Focus Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">7-Day Study Volume</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hours logged per day</p>
            </div>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Consistency High
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyTrends.length > 0 ? studyTrends : [
                { date: 'Mon', hours: 4.5 },
                { date: 'Tue', hours: 6.0 },
                { date: 'Wed', hours: 5.5 },
                { date: 'Thu', hours: 7.2 },
                { date: 'Fri', hours: 6.8 },
                { date: 'Sat', hours: 8.0 },
                { date: 'Sun', hours: 5.0 },
              ]}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Todos */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground">Priority Tasks</h3>
              <Link to="/tasks" className="text-xs text-primary font-semibold hover:underline">
                View all ({tasks.length})
              </Link>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                title="All caught up!"
                description="No pending tasks right now. Great job keeping your plate clean."
                action={
                  <Link
                    to="/tasks"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/40 transition"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {t.priority} priority • {t.estimated_minutes ? `${t.estimated_minutes}m` : 'Unestimated'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/tasks"
            className="mt-4 pt-3 border-t border-border text-center text-xs text-primary font-semibold hover:underline block"
          >
            Manage Task Board →
          </Link>
        </div>
      </div>

      {/* Target Exams Banner & Quick Routines */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Active Competitive Examinations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Syllabus progression and mock test benchmarks</p>
          </div>
          <Link to="/exam" className="text-xs text-primary font-semibold hover:underline">
            Manage Exams →
          </Link>
        </div>

        {exams.length === 0 ? (
          <EmptyState
            title="No exam profile selected"
            description="Choose target examinations like UPSC, NDA, CDS, AFCAT, SSC, or Banking to begin structured prep."
            action={
              <Link
                to="/exam"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground font-semibold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Set Up Target Exam
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                to={`/exam/${exam.id}`}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                    {exam.exam_type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Attempt #{exam.attempt_number}</span>
                </div>
                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition truncate">
                  {exam.exam_name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {exam.target_date || 'Ongoing preparation'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
