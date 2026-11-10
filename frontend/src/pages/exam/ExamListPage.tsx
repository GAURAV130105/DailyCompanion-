import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import { useExamProfiles, useCreateExamProfile, useDeleteExamProfile } from '../../api/exams';
import { GraduationCap, Plus, ArrowRight, Calendar, Award, Trash2 } from 'lucide-react';
import type { ExamProfile } from '../../types';

export const ExamListPage: React.FC = () => {
  const { data: exams = [], isLoading } = useExamProfiles();
  const createExam = useCreateExamProfile();
  const deleteExam = useDeleteExamProfile();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newExam, setNewExam] = useState({
    exam_type: 'UPSC' as ExamProfile['exam_type'],
    exam_name: '',
    target_date: '',
    attempt_number: 1,
    notes: '',
  });

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExam.mutateAsync({
        exam_type: newExam.exam_type,
        exam_name: newExam.exam_name || `${newExam.exam_type} Target Examination`,
        target_date: newExam.target_date || null,
        attempt_number: Number(newExam.attempt_number),
        notes: newExam.notes,
        is_active: true,
      });
      setNewExam({ exam_type: 'UPSC', exam_name: '', target_date: '', attempt_number: 1, notes: '' });
      setShowAddModal(false);
    } catch (err) {
      console.warn('Exam creation handled:', err);
      setShowAddModal(false);
    }
  };

  const handleDeleteExam = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis will permanently delete this target examination and all its subjects, chapters, topics, mock tests, and mistakes.`
      )
    ) {
      await deleteExam.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitive Examination Profiles"
        description="Select your target examinations, construct verified subject-wise syllabi, and track mock test benchmarks."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Target Examination
          </button>
        }
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="No target examination configured"
          description="Support for UPSC, NDA, CDS, AFCAT, SSC, Banking, State PCS, and Custom examinations. Add your first exam to begin syllabus tracking."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Configure Exam Profile
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-wider">
                    {exam.exam_type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Attempt #{exam.attempt_number}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteExam(e, exam.id, exam.exam_name)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Examination Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-foreground mb-1">{exam.exam_name}</h3>
                {exam.notes && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{exam.notes}</p>}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                  <Calendar className="w-4 h-4" />
                  <span>Target Date: {exam.target_date || 'Not specified'}</span>
                </div>
              </div>

              <Link
                to={`/exam/${exam.id}`}
                className="mt-6 w-full py-2.5 px-4 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                Open Syllabus & Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Add Target Examination</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Exam Category</label>
                <select
                  value={newExam.exam_type}
                  onChange={(e) => setNewExam({ ...newExam, exam_type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="UPSC">UPSC Civil Services</option>
                  <option value="NDA">NDA (National Defence Academy)</option>
                  <option value="CDS">CDS (Combined Defence Services)</option>
                  <option value="AFCAT">AFCAT (Air Force)</option>
                  <option value="SSC">SSC (CGL, CHSL, CPO)</option>
                  <option value="Banking">Banking (IBPS, SBI, RBI)</option>
                  <option value="State">State PCS / State Exams</option>
                  <option value="Custom">Other Custom Examination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Exam Title / Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC CSE 2026 Prelims & Mains"
                  value={newExam.exam_name}
                  onChange={(e) => setNewExam({ ...newExam, exam_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newExam.target_date}
                    onChange={(e) => setNewExam({ ...newExam, target_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Attempt #</label>
                  <input
                    type="number"
                    min={1}
                    value={newExam.attempt_number}
                    onChange={(e) => setNewExam({ ...newExam, attempt_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Preparation Strategy / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Optional subject: Sociology. Focus on GS-2 and Ethics in Phase 1."
                  value={newExam.notes}
                  onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
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
                  disabled={createExam.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                >
                  Create Exam Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
