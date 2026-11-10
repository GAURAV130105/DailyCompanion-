import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useCurrentUser, useUpdateProfile } from '../../api/auth';
import { useUIStore } from '../../stores/uiStore';
import { Settings, User, Moon, Sun, Bell, Sliders, Save, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useUIStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'weights' | 'notifications'>('profile');

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    daily_study_goal_minutes: user?.daily_study_goal_minutes || 240,
    pomodoro_work_duration: user?.pomodoro_work_duration || 25,
    pomodoro_short_break: user?.pomodoro_short_break || 5,
  });

  const [weights, setWeights] = useState({
    study: 30,
    tasks: 25,
    habits: 20,
    exam: 15,
    health: 10,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Account & System Settings"
        description="Configure study targets, theme preferences, productivity score weights, and notification frequencies."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { id: 'profile', label: 'Student Profile', icon: <User className="w-4 h-4" /> },
          { id: 'appearance', label: 'Appearance & Theme', icon: <Sun className="w-4 h-4" /> },
          { id: 'weights', label: 'Score Weights', icon: <Sliders className="w-4 h-4" /> },
          { id: 'notifications', label: 'Reminders', icon: <Bell className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-foreground">Academic Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Daily Study Target (Minutes)</label>
              <input
                type="number"
                min={60}
                max={720}
                value={formData.daily_study_goal_minutes}
                onChange={(e) => setFormData({ ...formData, daily_study_goal_minutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Default: 240 mins (4 hours)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Pomodoro Work Sprint (Minutes)</label>
              <input
                type="number"
                min={15}
                max={90}
                value={formData.pomodoro_work_duration}
                onChange={(e) => setFormData({ ...formData, pomodoro_work_duration: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Pomodoro Break (Minutes)</label>
              <input
                type="number"
                min={3}
                max={30}
                value={formData.pomodoro_short_break}
                onChange={(e) => setFormData({ ...formData, pomodoro_short_break: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {savedSuccess && <span className="text-xs font-semibold text-emerald-500">✓ Settings updated!</span>}
            {!savedSuccess && <div />}
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Profile Settings
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-foreground">Theme & Interface Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-6 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-3 ${
                theme === 'light' ? 'border-primary bg-primary/5 text-primary font-bold shadow-md' : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              <Sun className="w-8 h-8" />
              <span className="text-sm">Clean Light Theme</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-6 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-3 ${
                theme === 'dark' ? 'border-primary bg-primary/5 text-primary font-bold shadow-md' : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              <Moon className="w-8 h-8" />
              <span className="text-sm">Night Dark Theme</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Productivity Weights */}
      {activeTab === 'weights' && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-foreground">Custom Score Formula Weights</h3>
          <p className="text-xs text-muted-foreground">
            Adjust the percentage contribution of each dimension to your daily 10.0 productivity rating.
          </p>

          <div className="space-y-4">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-foreground uppercase">
                  <span>{key} Weight</span>
                  <span>{val}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={val}
                  onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { title: 'Spaced Repetition Due Alerts', desc: 'Daily morning notification when syllabus topics need review' },
              { title: 'Overdue Task Reminders', desc: 'Alert when deadlines are approaching' },
              { title: 'Nightly Reflection Prompt', desc: 'Reminder to write in digital diary at 9:30 PM' },
              { title: 'Mock Test Schedule Reminder', desc: 'Weekly alert for full-length test attempts' },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{n.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
