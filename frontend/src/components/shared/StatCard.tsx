import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
}) => {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && <div className="text-primary p-2 bg-primary/10 rounded-lg">{icon}</div>}
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            <span className={trendUp ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
