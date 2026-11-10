import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../stores/authStore';
import { Info, Sparkles } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { isDemoMode } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar />

        {isDemoMode && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center justify-between text-xs text-primary font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                <strong>Demo Mode Active:</strong> You are exploring with instant sample data. Submissions save locally in real-time.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
              Run supabase_schema.sql in Supabase to enable cloud sync
            </span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
