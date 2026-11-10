import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { ScoreRing } from '../../components/shared/ScoreRing';
import { useScores, useSaveScore } from '../../api/scores';
import { todayISO } from '../../lib/utils';
import {
  Sparkles,
  Save,
  BookOpen,
  CheckSquare,
  Repeat,
  GraduationCap,
  Heart,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface RatingState {
  study_score: number;
  task_score: number;
  habit_score: number;
  exam_score: number;
  personal_score: number;
}

export const ScoresPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const { data: scores = [] } = useScores();
  const saveScore = useSaveScore();

  // Find existing score for selected date
  const existingScore = useMemo(
    () => scores.find((s) => s.date === selectedDate),
    [scores, selectedDate]
  );

  const [ratings, setRatings] = useState<RatingState>({
    study_score: 8.5,
    task_score: 8.0,
    habit_score: 9.0,
    exam_score: 8.0,
    personal_score: 8.0,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync ratings when selected date changes or existing score is found
  useEffect(() => {
    if (existingScore) {
      setRatings({
        study_score: Number(existingScore.study_score ?? 8.5),
        task_score: Number(existingScore.task_score ?? 8.0),
        habit_score: Number(existingScore.habit_score ?? 9.0),
        exam_score: Number(existingScore.exam_score ?? 8.0),
        personal_score: Number(existingScore.personal_score ?? 8.0),
      });
    } else {
      setRatings({
        study_score: 8.5,
        task_score: 8.0,
        habit_score: 9.0,
        exam_score: 8.0,
        personal_score: 8.0,
      });
    }
  }, [existingScore, selectedDate]);

  // Live calculation of weighted composite score
  const liveTotalScore = useMemo(() => {
    const raw =
      ratings.study_score * 0.3 +
      ratings.task_score * 0.25 +
      ratings.habit_score * 0.2 +
      ratings.exam_score * 0.15 +
      ratings.personal_score * 0.1;
    return Math.round(raw * 10) / 10;
  }, [ratings]);

  const handleSliderChange = (key: keyof RatingState, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    await saveScore.mutateAsync({
      date: selectedDate,
      study_score: ratings.study_score,
      task_score: ratings.task_score,
      habit_score: ratings.habit_score,
      exam_score: ratings.exam_score,
      personal_score: ratings.personal_score,
      score: liveTotalScore,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setRatings({
      study_score: 8.0,
      task_score: 7.5,
      habit_score: 8.5,
      exam_score: 8.0,
      personal_score: 8.0,
    });
    setSavedSuccess(false);
  };

  const components: {
    key: keyof RatingState;
    name: string;
    weight: string;
    weightFactor: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'study_score',
      name: 'Study & Focus Hours',
      weight: '30%',
      weightFactor: 0.3,
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
      color: 'bg-indigo-500',
    },
    {
      key: 'task_score',
      name: 'Task & Todo Completion',
      weight: '25%',
      weightFactor: 0.25,
      icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
      color: 'bg-emerald-500',
    },
    {
      key: 'habit_score',
      name: 'Habit Consistency',
      weight: '20%',
      weightFactor: 0.2,
      icon: <Repeat className="w-4 h-4 text-amber-500" />,
      color: 'bg-amber-500',
    },
    {
      key: 'exam_score',
      name: 'Exam Prep & Revisions',
      weight: '15%',
      weightFactor: 0.15,
      icon: <GraduationCap className="w-4 h-4 text-blue-500" />,
      color: 'bg-blue-500',
    },
    {
      key: 'personal_score',
      name: 'Health & Well-being',
      weight: '10%',
      weightFactor: 0.1,
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      color: 'bg-rose-500',
    },
  ];

  // Chart data sorted chronologically
  const chartData = useMemo(() => {
    return [...scores]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((s) => ({
        date: new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        score: Number(s.score),
      }));
  }, [scores]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Productivity Rating"
        description="Rate your academic, habit, and health outcomes. Adjust sliders to evaluate your composite daily index."
        action={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground"
            />
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-card border border-border text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground transition"
              title="Reset sliders"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saveScore.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saveScore.isPending ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        }
      />

      {/* Main Score & Interactive Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dial Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Calculated Score for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <ScoreRing score={liveTotalScore} maxScore={10} size={180} strokeWidth={16} />

          <p className="text-xs text-muted-foreground mt-5 max-w-xs font-medium">
            {liveTotalScore >= 8.5
              ? '🌟 Outstanding! You operated in the peak productivity bracket.'
              : liveTotalScore >= 7.0
              ? '👍 Solid progress across your core academic and lifestyle habits.'
              : liveTotalScore >= 5.0
              ? '⚡ Average day — room for focus and recovery tonight.'
              : '🌱 Low momentum — rest early and start strong tomorrow.'}
          </p>

          <div className="mt-6 pt-4 border-t border-border w-full flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status:</span>
            {savedSuccess ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                ✓ Saved to database!
              </span>
            ) : existingScore ? (
              <span className="text-primary font-semibold">Saved previously</span>
            ) : (
              <span className="text-amber-500 font-semibold">Unsaved edits</span>
            )}
          </div>
        </div>

        {/* Interactive Sliders Breakdown */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-foreground">Score Factor Ratings</h3>
              <p className="text-xs text-muted-foreground">
                Move sliders (0–10) to reflect how you performed today. Composite score recalculates automatically.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold px-2.5 py-1 bg-muted/60 rounded-lg">
              Composite 10.0
            </span>
          </div>

          <div className="space-y-5">
            {components.map((comp) => {
              const val = ratings[comp.key];
              return (
                <div key={comp.key} className="space-y-1.5 p-3 rounded-xl bg-background border border-border">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {comp.icon}
                      <span>{comp.name}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({comp.weight} weight)
                      </span>
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      {val.toFixed(1)}{' '}
                      <span className="text-[11px] text-muted-foreground font-normal">/ 10</span>
                    </span>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={val}
                    onChange={(e) => handleSliderChange(comp.key, Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                  />

                  {/* Progress visualization */}
                  <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${comp.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Formula:</strong> Score = (Study × 0.30) + (Tasks × 0.25) + (Habits × 0.20) + (Exams × 0.15) + (Health × 0.10). Click <strong>Save Rating</strong> to lock your daily score.
            </span>
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground">Historical Productivity Trend</h3>
          <span className="text-xs text-muted-foreground font-medium">Last 7–30 Days</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
