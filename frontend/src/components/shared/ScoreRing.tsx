import React from 'react';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  maxScore = 10,
  size = 140,
  strokeWidth = 12,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score, 0), maxScore);
  const progress = normalizedScore / maxScore;
  const offset = circumference - progress * circumference;

  const getColor = () => {
    if (normalizedScore >= 8) return '#10B981'; // emerald
    if (normalizedScore >= 6) return '#3B82F6'; // blue
    if (normalizedScore >= 4) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <div className="relative flex flex-col items-center justify-center inline-block">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight">{normalizedScore.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">out of {maxScore}</span>
      </div>
    </div>
  );
};
