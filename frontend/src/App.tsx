import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { AppShell } from './components/layout/AppShell';

// Fast loading indicator for lazy chunks
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center p-12 min-h-[350px]">
    <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-medium">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Loading module...</span>
    </div>
  </div>
);

// Auth Pages (lazy loaded on demand)
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));

// App Pages (lazy loaded on demand per route)
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PlannerPage = lazy(() => import('./pages/planner/PlannerPage').then((m) => ({ default: m.PlannerPage })));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage })));
const StudyTrackerPage = lazy(() => import('./pages/study/StudyTrackerPage').then((m) => ({ default: m.StudyTrackerPage })));
const PomodoroPage = lazy(() => import('./pages/study/PomodoroPage').then((m) => ({ default: m.PomodoroPage })));
const ExamListPage = lazy(() => import('./pages/exam/ExamListPage').then((m) => ({ default: m.ExamListPage })));
const ExamDetailPage = lazy(() => import('./pages/exam/ExamDetailPage').then((m) => ({ default: m.ExamDetailPage })));
const GoalsPage = lazy(() => import('./pages/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const HabitsPage = lazy(() => import('./pages/habits/HabitsPage').then((m) => ({ default: m.HabitsPage })));
const ScoresPage = lazy(() => import('./pages/scores/ScoresPage').then((m) => ({ default: m.ScoresPage })));
const JournalPage = lazy(() => import('./pages/journal/JournalPage').then((m) => ({ default: m.JournalPage })));
const HealthPage = lazy(() => import('./pages/health/HealthPage').then((m) => ({ default: m.HealthPage })));
const FinancePage = lazy(() => import('./pages/finance/FinancePage').then((m) => ({ default: m.FinancePage })));
const NotesPage = lazy(() => import('./pages/notes/NotesPage').then((m) => ({ default: m.NotesPage })));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const AIAssistantPage = lazy(() => import('./pages/ai/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Protected Route wrapper: instant optimistic check via persisted Zustand store
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Non-blocking background session verification (optimistic UX)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuth(session.user);
      }
    }).catch((err) => {
      console.warn('Session check warning:', err);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuth(session.user);
      } else if (!useAuthStore.getState().isDemoMode) {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Routes wrapped in AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="study" element={<StudyTrackerPage />} />
          <Route path="study/pomodoro" element={<PomodoroPage />} />
          <Route path="exam" element={<ExamListPage />} />
          <Route path="exam/:id" element={<ExamDetailPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="scores" element={<ScoresPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
