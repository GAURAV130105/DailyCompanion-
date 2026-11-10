import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useNotifications, useMarkAllNotificationsRead } from '../../api/ai';

export const Topbar: React.FC = () => {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground">
          Welcome back, <strong className="text-foreground">{user?.full_name || user?.email || 'Student'}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs ${n.is_read ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'}`}
                    >
                      <p className="font-semibold text-foreground">{n.title}</p>
                      <p className="text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-3 ml-2 border-l border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
            {user?.first_name ? user.first_name[0] : 'S'}
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              clearAuth();
              window.location.href = '/login';
            }}
            title="Log out"
            className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
