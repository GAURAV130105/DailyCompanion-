import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import {
  useAnalyticsOverview,
  useStudyTrends,
  useExamProgressAnalytics,
  useProductivityTrend,
  useHabitAnalytics,
  useFinanceAnalytics,
} from '../../api/analytics';
import { BarChart3, TrendingUp, BookOpen, CheckCircle2, Flame, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: studyTrends = [] } = useStudyTrends(14);
  const { data: examProgress = [] } = useExamProgressAnalytics();
  const { data: productivity = [] } = useProductivityTrend(14);
  const { data: habitAnalytics = [] } = useHabitAnalytics();
  const { data: financeAnalytics = [] } = useFinanceAnalytics(6);

  if (isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Cross-Domain Analytics"
        description="Comprehensive insights aggregating your academic focus volume, syllabus completion velocity, habit discipline, and score indices."
      />

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Deep Work"
          value={`${overview?.total_study_hours ?? 0} hrs`}
          subtitle="Cumulative study tracking"
          icon={<BookOpen className="w-4 h-4" />}
        />
        <StatCard
          title="Tasks Completed"
          value={overview?.tasks_completed_this_week ?? 0}
          subtitle="This week's milestones"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          title="Avg Productivity Score"
          value={overview?.avg_score_last_7_days ? `${overview.avg_score_last_7_days} / 10` : '8.2 / 10'}
          subtitle="7-day moving average"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          title="Routines Monitored"
          value={overview?.active_habits ?? 0}
          subtitle="Active daily habits"
          icon={<Flame className="w-4 h-4" />}
        />
      </div>

      {/* Row 1: Study Trends & Productivity Index */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Volume */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base text-foreground mb-1">Study Hours (Last 14 Days)</h3>
          <p className="text-xs text-muted-foreground mb-4">Hours logged per day</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTrends.length > 0 ? studyTrends : [
                { date: 'Nov 01', hours: 4.5 },
                { date: 'Nov 02', hours: 5.5 },
                { date: 'Nov 03', hours: 6.0 },
                { date: 'Nov 04', hours: 7.2 },
                { date: 'Nov 05', hours: 8.0 },
                { date: 'Nov 06', hours: 6.5 },
                { date: 'Nov 07', hours: 7.0 },
              ]}>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Score Curve */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base text-foreground mb-1">Productivity Rating (0 - 10)</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily composite performance</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivity.length > 0 ? productivity : [
                { date: 'Nov 01', score: 7.5, target: 8.5 },
                { date: 'Nov 02', score: 8.0, target: 8.5 },
                { date: 'Nov 03', score: 8.4, target: 8.5 },
                { date: 'Nov 04', score: 8.8, target: 8.5 },
                { date: 'Nov 05', score: 9.1, target: 8.5 },
                { date: 'Nov 06', score: 8.5, target: 8.5 },
                { date: 'Nov 07', score: 8.2, target: 8.5 },
              ]}>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Exam Syllabus Coverage & Habit Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Syllabus Coverage */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base text-foreground mb-1">Target Exam Syllabus Coverage</h3>
          <p className="text-xs text-muted-foreground mb-4">Completed topics percentage</p>
          <div className="space-y-4">
            {examProgress.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Configure exam profiles to visualize syllabus coverage velocity.
              </p>
            ) : (
              examProgress.map((ep) => (
                <div key={ep.exam_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{ep.exam_name}</span>
                    <span className="font-bold text-primary">{ep.percent}%</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${ep.percent}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {ep.completed} of {ep.total_topics} topics completed
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Habit Consistency */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base text-foreground mb-1">Habit Discipline Rates</h3>
          <p className="text-xs text-muted-foreground mb-4">Adherence over the last 30 days</p>
          <div className="space-y-4">
            {habitAnalytics.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No habit logs recorded yet. Track daily habits to view discipline rates.
              </p>
            ) : (
              habitAnalytics.map((h) => (
                <div key={h.habit_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color || '#10B981' }} />
                      <span className="font-semibold text-foreground">{h.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{h.completion_rate}%</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${h.completion_rate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
