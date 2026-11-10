import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Timer,
  GraduationCap,
  Target,
  Repeat,
  Wallet,
  BookMarked,
  Sparkles,
  Heart,
  FileText,
  BarChart3,
  Bot,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}

const navSections: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Planning & Focus',
    items: [
      { name: 'Daily Planner', to: '/planner', icon: <CalendarDays className="w-4 h-4" /> },
      { name: 'Task Manager', to: '/tasks', icon: <CheckSquare className="w-4 h-4" /> },
      { name: 'Study Tracker', to: '/study', icon: <BookOpen className="w-4 h-4" /> },
      { name: 'Pomodoro Timer', to: '/study/pomodoro', icon: <Timer className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Exam Preparation',
    items: [
      { name: 'Target Exams', to: '/exam', icon: <GraduationCap className="w-4 h-4" /> },
      { name: 'Goals & Milestones', to: '/goals', icon: <Target className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Lifestyle & Self',
    items: [
      { name: 'Habit Tracker', to: '/habits', icon: <Repeat className="w-4 h-4" /> },
      { name: 'Daily Score', to: '/scores', icon: <Sparkles className="w-4 h-4" /> },
      { name: 'Digital Diary', to: '/journal', icon: <BookMarked className="w-4 h-4" /> },
      { name: 'Health & Fitness', to: '/health', icon: <Heart className="w-4 h-4" /> },
      { name: 'Finance Manager', to: '/finance', icon: <Wallet className="w-4 h-4" /> },
      { name: 'Knowledge Notes', to: '/notes', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Insights & AI',
    items: [
      { name: 'Analytics & Reports', to: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { name: 'AI Study Assistant', to: '/ai-assistant', icon: <Bot className="w-4 h-4" /> },
      { name: 'Settings', to: '/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-sm">
              OS
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">Student Life OS</span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Productivity Core</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {sec.title && (
                <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {sec.title}
                </p>
              )}
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="p-3 bg-muted/50 rounded-lg text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-semibold text-foreground">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
