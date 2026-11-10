import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/4"></div>
      <div className="h-4 bg-muted rounded-md w-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 bg-muted/60 rounded-xl"></div>
        ))}
      </div>
      <div className="h-64 bg-muted/40 rounded-xl mt-6"></div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/40 my-6">
      {icon && <div className="text-muted-foreground p-3 bg-muted rounded-full mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  error?: any;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-rose-500/20 bg-rose-500/5 my-6">
      <div className="text-rose-500 p-3 bg-rose-500/10 rounded-full mb-4">⚠️</div>
      <h3 className="text-base font-semibold text-foreground">Something went wrong</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">
        {error?.message || 'Failed to load data. Please check your connection and try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
