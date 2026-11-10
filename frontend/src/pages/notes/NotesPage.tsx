import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useNotes, useCreateNote, useDeleteNote, useUpdateNote } from '../../api/notes';
import { FileText, Plus, Search, Pin, Trash2, Tag } from 'lucide-react';

export const NotesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: notes = [], isLoading } = useNotes(searchQuery);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tagsString: '',
    is_pinned: false,
  });

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = newNote.tagsString
        ? newNote.tagsString.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await createNote.mutateAsync({
        title: newNote.title,
        content: newNote.content,
        tags,
        is_pinned: newNote.is_pinned,
      });
      setNewNote({ title: '', content: '', tagsString: '', is_pinned: false });
      setShowAddModal(false);
    } catch (err) {
      console.warn('Note creation handled:', err);
      setShowAddModal(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Notes & Quick Memory Vault"
        description="Searchable syllabus notes, landmark judgments, formula sheets, and key concept digests."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Note
          </button>
        }
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search notes by keywords, tags, or concepts (e.g. Fundamental Rights, Keynesian)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No notes found"
          description="Create your first revision digest, formula sheet, or mind map."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create Note
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition group ${
                note.is_pinned ? 'border-primary/50 bg-primary/[0.02]' : 'border-border hover:border-primary/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-foreground line-clamp-1">{note.title}</h3>
                  <button
                    onClick={() => updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned })}
                    className={`p-1 rounded-md transition ${
                      note.is_pinned ? 'text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Pin className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags && note.tags.length > 0 ? (
                    note.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  )}
                </div>

                <button
                  onClick={() => deleteNote.mutate(note.id)}
                  className="p-1 text-muted-foreground hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Create Note</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summary of Article 32 & 226 Writs"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Content / Digest</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Polity, Supreme Court, Writs"
                  value={newNote.tagsString}
                  onChange={(e) => setNewNote({ ...newNote, tagsString: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={newNote.is_pinned}
                  onChange={(e) => setNewNote({ ...newNote, is_pinned: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                <label htmlFor="pinNote" className="text-xs font-semibold text-foreground cursor-pointer">
                  Pin to top of knowledge base
                </label>
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
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
