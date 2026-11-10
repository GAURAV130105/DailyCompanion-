import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask, useUpdateTask } from '../../api/tasks';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Trash2,
  ListFilter,
  LayoutGrid,
  List,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Task } from '../../types';

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: tasks = [], isLoading } = useTasks(statusFilter !== 'all' ? { status: statusFilter } : undefined);
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    estimated_minutes: 45,
    due_date: '',
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'todo',
        estimated_minutes: Number(newTask.estimated_minutes),
        due_date: newTask.due_date ? newTask.due_date : null,
      });
      setNewTask({ title: '', description: '', priority: 'medium', estimated_minutes: 45, due_date: '' });
      setShowAddModal(false);
    } catch (err: any) {
      console.warn('Task save handled:', err);
      setShowAddModal(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const priorityColors = {
    low: 'text-slate-500 bg-slate-500/10',
    medium: 'text-blue-500 bg-blue-500/10',
    high: 'text-amber-500 bg-amber-500/10',
    urgent: 'text-rose-500 bg-rose-500/10',
  };

  const columns: Array<{ id: Task['status']; title: string }> = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task & To-Do Management"
        description="Organize your academic syllabus milestones, assignment deadlines, and daily revision checklists."
        action={
          <div className="flex items-center gap-2.5">
            <div className="flex bg-card border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Task
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {['all', 'todo', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition ${
              statusFilter === st
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="No tasks found"
          description="Create actionable to-dos and track completion progress across all your subjects."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create Task
            </button>
          }
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => completeTask.mutate(task.id)}
                  className={`p-1 rounded-full transition ${
                    task.status === 'completed'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.estimated_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_minutes}m
                      </span>
                    )}
                    {task.due_date && <span>Due: {task.due_date}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => deleteTask.mutate(task.id)}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-muted"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <h4 className="font-bold text-sm text-foreground">{col.title}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-card border border-border rounded-full text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-card border border-border p-3.5 rounded-lg shadow-sm hover:border-primary/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${priorityColors[t.priority]}`}>
                          {t.priority}
                        </span>
                        <button
                          onClick={() => deleteTask.mutate(t.id)}
                          className="text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h5 className="font-semibold text-xs text-foreground mt-2">{t.title}</h5>
                      {t.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{t.estimated_minutes ? `${t.estimated_minutes} min` : 'No est'}</span>
                        <div className="flex gap-1">
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => updateTask.mutate({ id: t.id, status: 'in_progress' })}
                              className="px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground"
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => completeTask.mutate(t.id)}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Create Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Economic Survey Chapter on Agriculture"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Key sub-topics or reference page numbers..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    value={newTask.estimated_minutes}
                    onChange={(e) => setNewTask({ ...newTask, estimated_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
