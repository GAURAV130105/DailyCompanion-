import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useStudySessions, useCreateStudySession } from '../../api/study';
import { useExamProfiles } from '../../api/exams';
import { formatDuration } from '../../lib/utils';
import { BookOpen, Play, Square, Star, Clock, Trophy } from 'lucide-react';

export const StudyTrackerPage: React.FC = () => {
  const { data: sessions = [], isLoading } = useStudySessions();
  const { data: exams = [] } = useExamProfiles();
  const createSession = useCreateStudySession();

  // Active Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessionType, setSessionType] = useState<'study' | 'revision' | 'practice' | 'mock_test'>('study');
  const [notes, setNotes] = useState('');
  const [focusRating, setFocusRating] = useState(5);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const handleStopTimer = async () => {
    setIsTimerRunning(false);
    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));
    await createSession.mutateAsync({
      session_type: sessionType,
      duration_mins: durationMinutes,
      focus_rating: focusRating,
      notes: notes,
      start_time: new Date(Date.now() - timerSeconds * 1000).toISOString(),
      end_time: new Date().toISOString(),
    });
    setTimerSeconds(0);
    setNotes('');
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study & Focus Session Tracker"
        description="Record deep work intervals, evaluate concentration ratings, and analyze academic study volume."
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Deep Work Hours"
          value={`${totalHours} hrs`}
          subtitle="All sessions cumulative"
          icon={<BookOpen className="w-4 h-4" />}
        />
        <StatCard
          title="Total Logged Sessions"
          value={sessions.length}
          subtitle="Study blocks completed"
          icon={<Trophy className="w-4 h-4" />}
        />
        <StatCard
          title="Average Focus Rating"
          value="4.6 / 5.0"
          subtitle="High retention index"
          icon={<Star className="w-4 h-4" />}
        />
      </div>

      {/* Live Session Control Panel */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Focus Tracker</span>
            <div className="text-5xl md:text-6xl font-black font-mono tracking-tight text-foreground">
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isTimerRunning ? 'Session active • Stay away from distractions' : 'Timer paused • Ready to begin'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!isTimerRunning ? (
              <button
                onClick={handleStartTimer}
                className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Start Focus Session
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                className="w-full sm:w-auto px-6 py-3.5 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" /> Finish & Log Session
              </button>
            )}
          </div>
        </div>

        {/* Live session parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
            >
              <option value="study">Deep Study</option>
              <option value="revision">Active Revision</option>
              <option value="practice">Answer Writing / Practice</option>
              <option value="mock_test">Mock Test Simulation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Focus Quality (1-5 Stars)</label>
            <select
              value={focusRating}
              onChange={(e) => setFocusRating(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
            >
              <option value={5}>⭐⭐⭐⭐⭐ (Peak Concentration)</option>
              <option value={4}>⭐⭐⭐⭐ (Solid Focus)</option>
              <option value={3}>⭐⭐⭐ (Moderate Focus)</option>
              <option value={2}>⭐⭐ (Distracted)</option>
              <option value={1}>⭐ (Low Retention)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Session Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Revised NCERT Class 11 Geography"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Logged Study Sessions</h3>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="No study sessions logged yet"
            description="Use the timer above to log your focus blocks and build your consistency streak."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Focus Rating</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-medium">{new Date(s.start_time).toLocaleDateString()}</td>
                    <td className="p-3.5 capitalize">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                        {s.session_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold">{s.duration_mins || 0} mins</td>
                    <td className="p-3.5">{'⭐'.repeat(s.focus_rating || 5)}</td>
                    <td className="p-3.5 text-muted-foreground">{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
