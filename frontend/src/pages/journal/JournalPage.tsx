import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import {
  useJournalEntryByDate,
  useSaveJournalEntry,
  useJournalScoreMap,
} from '../../api/journal';
import { useHealthLogByDate } from '../../api/health';
import { todayISO } from '../../lib/utils';
import {
  BookMarked,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  AlertCircle,
  Star,
  Moon,
  Droplets,
  Activity,
  Footprints,
  Scale,
  Heart,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

// ─── Score helpers ────────────────────────────────────────────────────────────

/** Convert raw slider value (1–10) to 1–5 star band */
function sliderToStar(v: number): number {
  return Math.min(5, Math.max(1, Math.ceil(v / 2)));
}

/** Label for each star band */
const STAR_LABELS: Record<number, string> = {
  1: 'Rough Day',
  2: 'Below Average',
  3: 'Okay Day',
  4: 'Good Day',
  5: 'Outstanding!',
};

/** Tailwind bg color class per star band for the calendar */
function calendarCellColor(band: number | undefined): string {
  if (!band) return 'bg-muted/40 border border-border text-muted-foreground/40';
  const map: Record<number, string> = {
    1: 'bg-rose-500/80 text-white border border-rose-600',
    2: 'bg-orange-400/80 text-white border border-orange-500',
    3: 'bg-yellow-400/80 text-foreground border border-yellow-500',
    4: 'bg-emerald-400/80 text-white border border-emerald-500',
    5: 'bg-indigo-500/80 text-white border border-indigo-600',
  };
  return map[band] || 'bg-muted/40';
}

/** Tailwind text color for the star band badge */
function bandBadgeStyle(band: number): string {
  const map: Record<number, string> = {
    1: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    2: 'bg-orange-400/15 text-orange-600 border-orange-500/30',
    3: 'bg-yellow-400/15 text-yellow-700 border-yellow-500/30',
    4: 'bg-emerald-400/15 text-emerald-700 border-emerald-500/30',
    5: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
  };
  return map[band] || 'bg-muted/40 text-muted-foreground';
}

// ─── Calendar component ───────────────────────────────────────────────────────

interface MonthCalendarProps {
  scoreMap: Record<string, number>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ scoreMap, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = viewDate;

  const calDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push(`${year}-${mm}-${dd}`);
    }
    return cells;
  }, [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () =>
    setViewDate((v) => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const nextMonth = () =>
    setViewDate((v) => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const today = todayISO();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          Mood Calendar
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-foreground px-2">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} />;
          const band = scoreMap[dateStr];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const dayNum = parseInt(dateStr.slice(8));
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              title={band ? `Score band: ${band}/5 — ${STAR_LABELS[band]}` : 'No entry'}
              className={`
                relative aspect-square rounded-lg text-[11px] font-semibold flex items-center justify-center transition
                ${calendarCellColor(band)}
                ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                ${isToday && !band ? 'border-2 border-primary text-primary bg-primary/5' : ''}
                hover:scale-105 cursor-pointer
              `}
            >
              {dayNum}
              {isToday && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-card" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Score Legend
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5].map((b) => (
            <span
              key={b}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${bandBadgeStyle(b)}`}
            >
              {b}★ {STAR_LABELS[b]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Health Snapshot component ────────────────────────────────────────────────

interface HealthSnapshotProps {
  date: string;
}

const HealthSnapshot: React.FC<HealthSnapshotProps> = ({ date }) => {
  const { data: log } = useHealthLogByDate(date);

  const noData = !log || (
    !log.sleep_hours && !log.water_ml && !log.exercise_mins && !log.steps && !log.weight_kg
  );

  const sleepHrs = log?.sleep_hours ? Number(log.sleep_hours) : null;
  const waterMl = log?.water_ml ? Number(log.water_ml) : null;
  const exerciseMins = log?.exercise_mins ? Number(log.exercise_mins) : null;
  const steps = log?.steps ? Number(log.steps) : null;
  const weightKg = log?.weight_kg ? Number(log.weight_kg) : null;

  const sleepPct = sleepHrs !== null ? Math.min(100, (sleepHrs / 8) * 100) : 0;
  const waterPct = waterMl !== null ? Math.min(100, (waterMl / 3000) * 100) : 0;
  const exercisePct = exerciseMins !== null ? Math.min(100, (exerciseMins / 60) * 100) : 0;
  const stepsPct = steps !== null ? Math.min(100, (steps / 10000) * 100) : 0;

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          Health & Fitness — {dateLabel}
        </h3>
        {!noData && log?.exercise_type && (
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
            {log.exercise_type}
          </span>
        )}
      </div>

      {noData ? (
        <div className="text-center py-6 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No health data logged for this day</p>
          <p className="text-xs mt-1">
            Go to <strong>Health & Fitness</strong> to log your vitals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sleep */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Moon className="w-3.5 h-3.5 text-blue-500" /> Sleep
              </span>
              <span className="font-bold text-foreground">
                {sleepHrs !== null ? `${sleepHrs.toFixed(1)} hrs` : '—'}
                <span className="ml-1 text-muted-foreground font-normal">/ 8h target</span>
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${sleepPct}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" /> Hydration
              </span>
              <span className="font-bold text-foreground">
                {waterMl !== null ? `${waterMl} ml` : '—'}
                <span className="ml-1 text-muted-foreground font-normal">/ 3L target</span>
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
          </div>

          {/* Exercise */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Activity className="w-3.5 h-3.5 text-rose-500" /> Exercise
              </span>
              <span className="font-bold text-foreground">
                {exerciseMins !== null ? `${exerciseMins} mins` : '—'}
                <span className="ml-1 text-muted-foreground font-normal">/ 60min target</span>
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{ width: `${exercisePct}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Footprints className="w-3.5 h-3.5 text-amber-500" /> Steps
              </span>
              <span className="font-bold text-foreground">
                {steps !== null ? steps.toLocaleString('en-IN') : '—'}
                <span className="ml-1 text-muted-foreground font-normal">/ 10K goal</span>
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${stepsPct}%` }}
              />
            </div>
          </div>

          {/* Weight (compact) */}
          {weightKg !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Scale className="w-3.5 h-3.5 text-emerald-500" /> Weight
              </span>
              <span className="text-xs font-bold text-foreground">{weightKg.toFixed(1)} kg</span>
            </div>
          )}

          {/* Notes */}
          {log?.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic border-t border-border pt-2">
              {log.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Journal Page ────────────────────────────────────────────────────────

export const JournalPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const { data: entry, isLoading } = useJournalEntryByDate(selectedDate);
  const { data: scoreMap = {} } = useJournalScoreMap();
  const saveEntry = useSaveJournalEntry();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'good' as 'great' | 'good' | 'neutral' | 'low' | 'bad',
    mood_score: 7, // 1–10 slider value
    achievements: '',
    challenges: '',
    lessons: '',
    tomorrow_goals: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Derived star band from slider
  const starBand = sliderToStar(formData.mood_score);

  useEffect(() => {
    setErrorMsg('');
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        mood: (entry.mood as any) || 'good',
        mood_score: typeof entry.mood_score === 'number' ? entry.mood_score : 7,
        achievements: entry.achievements || '',
        challenges: entry.challenges || '',
        lessons: entry.lessons || '',
        tomorrow_goals: entry.tomorrow_goals || '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        mood: 'good',
        mood_score: 7,
        achievements: '',
        challenges: '',
        lessons: '',
        tomorrow_goals: '',
      });
    }
  }, [entry, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await saveEntry.mutateAsync({
        date: selectedDate,
        ...formData,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saving reflection:', err);
      setErrorMsg(err.message || 'Failed to save. Please check your Supabase tables.');
    }
  };

  const moods: { id: 'great' | 'good' | 'neutral' | 'low' | 'bad'; label: string; emoji: string }[] = [
    { id: 'great', label: 'Great', emoji: '😄' },
    { id: 'good', label: 'Good', emoji: '🙂' },
    { id: 'neutral', label: 'Neutral', emoji: '😐' },
    { id: 'low', label: 'Low', emoji: '😔' },
    { id: 'bad', label: 'Stressed', emoji: '😫' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Digital Diary & Nightly Reflection"
        description="Your private space for daily journaling, scoring your day, and tracking health & mood over time."
        action={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground"
            />
          </div>
        }
      />

      {/* Privacy Banner */}
      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground border border-border">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          <strong>Private & Encrypted:</strong> Journal entries are strictly confidential. AI never reads your diary without your explicit permission.
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Two-column layout: main form + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Journal form ──────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm">

            {/* ① DAILY SCORE SLIDER */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                ① Rate Your Day — Daily Score
              </label>
              <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                {/* Star display */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-6 h-6 transition ${
                          s <= starBand ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${bandBadgeStyle(starBand)}`}>
                    {starBand}/5 — {STAR_LABELS[starBand]}
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={formData.mood_score}
                    onChange={(e) => setFormData({ ...formData, mood_score: Number(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>1 — Terrible</span>
                    <span>5 — Average</span>
                    <span>10 — Perfect</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Slider value <strong>{formData.mood_score}/10</strong> → stored as{' '}
                  <strong>{starBand} star{starBand > 1 ? 's' : ''}</strong> on the calendar heatmap.
                </p>
              </div>
            </div>

            {/* ② MOOD EMOJI SELECTOR */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                ② How was your day mentally?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setFormData({ ...formData, mood: m.id })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      formData.mood === m.id
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entry title */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Journal Entry Title</label>
              <input
                type="text"
                placeholder="e.g. Breakthrough in Economy concepts & productive mock test review"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            {/* Free-form content */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Thoughts, Musings & Reflections
              </label>
              <textarea
                rows={4}
                placeholder="What went well today? What thoughts distracted you? How did you manage energy?"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            {/* 4 Structured fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Today's Biggest Achievement
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared 100 MCQs and understood Balance of Payments"
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Hardest Obstacle / Challenge
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Felt fatigued after lunch; struggled with CSAT reading comprehension"
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Key Lesson Learned
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Need to revise CSAT formulas in morning rather than late evening"
                  value={formData.lessons}
                  onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                  <BookMarked className="w-3.5 h-3.5 text-primary" /> Top 3 Priorities for Tomorrow
                </label>
                <textarea
                  rows={2}
                  placeholder={'1. Ethics Case Studies (9-11am)\n2. Spectrum Modern History Ch 6\n3. Run 5km'}
                  value={formData.tomorrow_goals}
                  onChange={(e) => setFormData({ ...formData, tomorrow_goals: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  ✓ Saved securely to your private diary
                </span>
              )}
              {!savedSuccess && <div />}
              <button
                type="submit"
                disabled={saveEntry.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveEntry.isPending ? 'Saving...' : 'Save Reflection'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Calendar + Health Sidebar ─────── */}
        <div className="space-y-5">
          {/* Calendar Heatmap */}
          <MonthCalendar
            scoreMap={scoreMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Health Snapshot for the day */}
          <HealthSnapshot date={selectedDate} />

          {/* Quick legend for selected date score */}
          {scoreMap[selectedDate] && (
            <div className={`rounded-xl border p-4 ${bandBadgeStyle(scoreMap[selectedDate])}`}>
              <p className="text-xs font-bold flex items-center gap-2">
                {[...Array(scoreMap[selectedDate])].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                Saved score for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}:{' '}
                <span>{scoreMap[selectedDate]}/5 — {STAR_LABELS[scoreMap[selectedDate]]}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
