import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useCreatePomodoroSession } from '../../api/study';
import { Play, Pause, RotateCcw, SkipForward, Settings, Sparkles, CheckCircle2 } from 'lucide-react';

export const PomodoroPage: React.FC = () => {
  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [cyclesPlanned, setCyclesPlanned] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  const createPomodoro = useCreatePomodoroSession();

  useEffect(() => {
    let timer: any = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      // Switch mode
      if (mode === 'work') {
        if (currentCycle >= cyclesPlanned) {
          setIsActive(false);
          createPomodoro.mutate({
            work_mins: workMins,
            break_mins: breakMins,
            cycles_planned: cyclesPlanned,
            cycles_done: cyclesPlanned,
            is_active: false,
          });
        } else {
          setMode('break');
          setTimeLeft(breakMins * 60);
        }
      } else {
        setCurrentCycle((c) => c + 1);
        setMode('work');
        setTimeLeft(workMins * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, mode, currentCycle, cyclesPlanned, workMins, breakMins]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(workMins * 60);
    setCurrentCycle(1);
  };

  const skipInterval = () => {
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(breakMins * 60);
    } else {
      setCurrentCycle((c) => c + 1);
      setMode('work');
      setTimeLeft(workMins * 60);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalDuration = (mode === 'work' ? workMins : breakMins) * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Pomodoro Focus Engine"
        description="Structured focus sprints with scientific recovery intervals to avoid mental burnout."
      />

      {/* Main Timer Display */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Cycle indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Cycle {currentCycle} of {cyclesPlanned}
          </span>
          <div className="flex gap-1.5 ml-2">
            {Array.from({ length: cyclesPlanned }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i < currentCycle ? 'bg-primary' : 'bg-muted border border-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mode badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${
            mode === 'work' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'
          }`}
        >
          {mode === 'work' ? '🧠 Deep Work Session' : '☕ Recovery Break'}
        </span>

        {/* Timer number */}
        <div className="text-7xl md:text-8xl font-black font-mono tracking-tight text-foreground my-4">
          {timeFormatted}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-muted/60 h-2.5 rounded-full overflow-hidden my-6">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              mode === 'work' ? 'bg-primary' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-2xl transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-4 font-bold text-base rounded-2xl shadow-xl flex items-center gap-2.5 transition ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isActive ? 'Pause Interval' : 'Start Focus'}
          </button>

          <button
            onClick={skipInterval}
            title="Skip Interval"
            className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-2xl transition"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl">
          <label className="block text-xs font-bold text-foreground uppercase mb-1">Work Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={15}
              max={90}
              value={workMins}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWorkMins(val);
                if (mode === 'work' && !isActive) setTimeLeft(val * 60);
              }}
              className="w-20 px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">minutes</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl">
          <label className="block text-xs font-bold text-foreground uppercase mb-1">Break Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2}
              max={30}
              value={breakMins}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBreakMins(val);
                if (mode === 'break' && !isActive) setTimeLeft(val * 60);
              }}
              className="w-20 px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">minutes</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl">
          <label className="block text-xs font-bold text-foreground uppercase mb-1">Cycles Planned</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10}
              value={cyclesPlanned}
              onChange={(e) => setCyclesPlanned(Number(e.target.value))}
              className="w-20 px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">cycles per set</span>
          </div>
        </div>
      </div>
    </div>
  );
};
