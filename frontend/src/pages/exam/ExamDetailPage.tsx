import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import {
  useExamProfile,
  useExamProgress,
  useSubjects,
  useDeleteExamProfile,
  useCreateSubject,
  useDeleteSubject,
  useCreateChapter,
  useDeleteChapter,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  useMockTests,
  useCreateMockTest,
  useDeleteMockTest,
  useMistakes,
  useCreateMistake,
  useDeleteMistake,
  useRevisions,
  useCompleteRevision,
} from '../../api/exams';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Award,
  Trash2,
} from 'lucide-react';
import type { Topic } from '../../types';

export const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'mocks' | 'mistakes' | 'revision'>('syllabus');

  const { data: exam, isLoading: loadingExam } = useExamProfile(id || '');
  const { data: progress } = useExamProgress(id || '');
  const { data: loadedSubjects = [] } = useSubjects(id || '');
  const { data: mockTests = [] } = useMockTests(id);
  const { data: mistakes = [] } = useMistakes();
  const { data: revisions = [] } = useRevisions();

  const navigate = useNavigate();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const createMock = useCreateMockTest();
  const deleteMock = useDeleteMockTest();
  const createMistake = useCreateMistake();
  const deleteMistake = useDeleteMistake();
  const deleteExam = useDeleteExamProfile();
  const completeRevision = useCompleteRevision();

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [showMistakeModal, setShowMistakeModal] = useState(false);

  // Modal forms
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [targetChapterId, setTargetChapterId] = useState('');

  const [newSubject, setNewSubject] = useState({ name: '', weightage: 20, color: '#3B82F6' });
  const [newChapter, setNewChapter] = useState({ name: '', estimated_hours: 10 });
  const [newTopic, setNewTopic] = useState({ name: '', estimated_hours: 2, difficulty: 'medium' as const });
  const [newMock, setNewMock] = useState({
    test_name: '',
    test_date: new Date().toISOString().split('T')[0],
    total_marks: 200,
    obtained_marks: 110,
    total_questions: 100,
    attempted: 85,
    correct: 65,
    incorrect: 20,
  });
  const [newMistake, setNewMistake] = useState({
    question_text: '',
    correct_answer: '',
    user_answer: '',
    explanation: '',
    subject_id: '',
  });

  if (loadingExam) return <LoadingSkeleton rows={4} />;
  if (!exam) return <div className="p-8 text-center text-foreground">Exam profile not found.</div>;

  const subjects = loadedSubjects.length > 0 ? loadedSubjects : (exam.subjects || []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSubject.mutateAsync({
        exam_profile: exam.id,
        exam_profile_id: exam.id,
        name: newSubject.name,
        weightage: Number(newSubject.weightage),
        color: newSubject.color,
        order: subjects.length + 1,
      });
      setNewSubject({ name: '', weightage: 20, color: '#3B82F6' });
      setShowSubjectModal(false);
    } catch (err) {
      console.warn('Subject creation handled:', err);
      setShowSubjectModal(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChapter.mutateAsync({
        subject: targetSubjectId,
        subject_id: targetSubjectId,
        name: newChapter.name,
        estimated_hours: Number(newChapter.estimated_hours),
        order: 1,
      });
      setNewChapter({ name: '', estimated_hours: 10 });
      setShowChapterModal(false);
    } catch (err) {
      console.warn('Chapter creation handled:', err);
      setShowChapterModal(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTopic.mutateAsync({
        chapter: targetChapterId,
        chapter_id: targetChapterId,
        name: newTopic.name,
        estimated_hours: Number(newTopic.estimated_hours),
        difficulty: newTopic.difficulty,
        status: 'pending',
      });
      setNewTopic({ name: '', estimated_hours: 2, difficulty: 'medium' });
      setShowTopicModal(false);
    } catch (err) {
      console.warn('Topic creation handled:', err);
      setShowTopicModal(false);
    }
  };

  const handleAddMock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMock.mutateAsync({
        exam_profile: exam.id,
        exam_profile_id: exam.id,
        test_name: newMock.test_name,
        test_date: newMock.test_date,
        total_marks: Number(newMock.total_marks),
        obtained_marks: Number(newMock.obtained_marks),
        total_questions: Number(newMock.total_questions),
        attempted: Number(newMock.attempted),
        correct: Number(newMock.correct),
        incorrect: Number(newMock.incorrect),
      });
      setShowMockModal(false);
    } catch (err) {
      console.warn('Mock test creation handled:', err);
      setShowMockModal(false);
    }
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    const subId = newMistake.subject_id || subjects[0]?.id;
    if (!subId) return;
    await createMistake.mutateAsync({
      subject: subId,
      question_text: newMistake.question_text,
      correct_answer: newMistake.correct_answer,
      user_answer: newMistake.user_answer,
      explanation: newMistake.explanation,
      reviewed: false,
    });
    setNewMistake({ question_text: '', correct_answer: '', user_answer: '', explanation: '', subject_id: '' });
    setShowMistakeModal(false);
  };

  const handleDeleteExam = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the examination "${exam.exam_name}"?\n\nThis will permanently delete this target examination and all its subjects, chapters, topics, mock tests, and mistakes.`
      )
    ) {
      await deleteExam.mutateAsync(exam.id);
      navigate('/exam');
    }
  };

  const statusBadge = (status: Topic['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Done</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600">In Progress</span>;
      case 'needs_revision':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">Revise</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">Pending</span>;
    }
  };

  const cycleStatus = (current: Topic['status']): Topic['status'] => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    if (current === 'completed') return 'needs_revision';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Back link & Title */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/exam" className="hover:text-primary flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Examinations
        </Link>
        <span>/</span>
        <span className="text-foreground">{exam.exam_name}</span>
      </div>

      <PageHeader
        title={exam.exam_name}
        description={`Target Date: ${exam.target_date || 'Ongoing'} • Attempt #${exam.attempt_number} • Category: ${exam.exam_type}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subject
            </button>
            <button
              onClick={() => setShowMockModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition"
            >
              <Plus className="w-3.5 h-3.5" /> Record Mock Test
            </button>
            <button
              onClick={handleDeleteExam}
              disabled={deleteExam.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold rounded-lg transition"
              title="Delete this entire examination profile"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Exam
            </button>
          </div>
        }
      />

      {/* Syllabus Progress Bar */}
      {progress && (
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Syllabus Coverage
            </span>
            <span className="text-sm font-black text-primary">{progress.percent}%</span>
          </div>
          <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground font-medium">
            <span>Total Topics: <strong className="text-foreground">{progress.total_topics}</strong></span>
            <span>Completed: <strong className="text-emerald-500">{progress.completed}</strong></span>
            <span>In Progress: <strong className="text-blue-500">{progress.in_progress}</strong></span>
            <span>Pending: <strong className="text-muted-foreground">{progress.pending}</strong></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'syllabus', label: 'Syllabus Tracker', icon: <Layers className="w-4 h-4" /> },
          { id: 'mocks', label: `Mock Tests (${mockTests.length})`, icon: <FileCheck className="w-4 h-4" /> },
          { id: 'mistakes', label: `Mistake Notebook (${mistakes.length})`, icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'revision', label: `Revisions (${revisions.length})`, icon: <Clock className="w-4 h-4" /> },
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

      {/* Tab 1: Syllabus Tree */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          {subjects.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-8 h-8" />}
              title="No subjects added yet"
              description="Build your verified subject tree (e.g. History, Polity, Geography, Quantitative Aptitude) to begin chapter-wise tracking."
              action={
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Subject
                </button>
              }
            />
          ) : (
            <div className="space-y-6">
              {subjects.map((sub) => {
                const chapters = sub.chapters || [];
                return (
                  <div key={sub.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: sub.color || '#3B82F6' }}
                        />
                        <h3 className="font-bold text-base text-foreground">{sub.name}</h3>
                        <span className="text-xs text-muted-foreground font-medium">
                          Weightage: {sub.weightage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTargetSubjectId(sub.id);
                            setShowChapterModal(true);
                          }}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Chapter
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete subject "${sub.name}" and all its chapters?`)) {
                              await deleteSubject.mutateAsync(sub.id);
                            }
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Chapters List */}
                    {chapters.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4">No chapters added to {sub.name} yet.</p>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {chapters.map((ch) => {
                          const topics = ch.topics || [];
                          return (
                            <div key={ch.id} className="pl-4 border-l-2 border-muted space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                                  📖 Chapter: {ch.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setTargetChapterId(ch.id);
                                      setShowTopicModal(true);
                                    }}
                                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add Topic
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Delete chapter "${ch.name}" and all its topics?`)) {
                                        await deleteChapter.mutateAsync(ch.id);
                                      }
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Topics */}
                              {topics.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground">No topics yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {topics.map((top) => (
                                    <div
                                      key={top.id}
                                      className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition"
                                    >
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() =>
                                            updateTopic.mutate({
                                              id: top.id,
                                              status: cycleStatus(top.status),
                                            })
                                          }
                                          title="Click to advance status"
                                          className="cursor-pointer"
                                        >
                                          {statusBadge(top.status)}
                                        </button>
                                        <span className="text-xs font-medium text-foreground">{top.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-muted-foreground">
                                          {top.estimated_hours} hrs • {top.difficulty}
                                        </span>
                                        <button
                                          onClick={async () => {
                                            if (window.confirm(`Delete topic "${top.name}"?`)) {
                                              await deleteTopic.mutateAsync(top.id);
                                            }
                                          }}
                                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                                          title="Delete Topic"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mock Tests */}
      {activeTab === 'mocks' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">Recorded Mock Tests</h3>
            <button
              onClick={() => setShowMockModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3 h-3" /> Add Test Result
            </button>
          </div>

          {mockTests.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="w-8 h-8" />}
              title="No mock test scores logged"
              description="Record test attempts to measure accuracy, speed, negative marking penalty, and percentile trends."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Test Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">Attempted</th>
                    <th className="p-3">Correct / Wrong</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockTests.map((m) => {
                    const accuracy = m.attempted > 0 ? ((m.correct / m.attempted) * 100).toFixed(1) : 0;
                    return (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="p-3 font-semibold text-foreground">{m.test_name}</td>
                        <td className="p-3 text-muted-foreground">{m.test_date}</td>
                        <td className="p-3 font-bold text-primary">
                          {m.obtained_marks} / {m.total_marks}
                        </td>
                        <td className="p-3">{m.attempted} / {m.total_questions}</td>
                        <td className="p-3 text-emerald-500 font-medium">
                          {m.correct} <span className="text-muted-foreground">/</span>{' '}
                          <span className="text-rose-500">{m.incorrect}</span>
                        </td>
                        <td className="p-3 font-bold text-foreground">{accuracy}%</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete mock test "${m.test_name}"?`)) {
                                await deleteMock.mutateAsync(m.id);
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                            title="Delete Mock Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mistake Notebook */}
      {activeTab === 'mistakes' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">Mistake & Analysis Notebook</h3>
            <button
              onClick={() => setShowMistakeModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3 h-3" /> Log Mistake
            </button>
          </div>

          {mistakes.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8" />}
              title="Mistake notebook is clean"
              description="Log tricky questions or wrong answers from mock tests so you never repeat the same mistake twice."
            />
          ) : (
            <div className="space-y-3">
              {mistakes.map((mk) => (
                <div key={mk.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                      Incorrectly Answered
                    </span>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this mistake log entry?')) {
                          await deleteMistake.mutateAsync(mk.id);
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                      title="Delete Mistake Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-xs text-foreground mt-1">{mk.question_text}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-600">
                      <strong>Your Answer:</strong> {mk.user_answer || 'Skipped / Wrong'}
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600">
                      <strong>Correct Answer:</strong> {mk.correct_answer}
                    </div>
                  </div>
                  {mk.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 Reason: {mk.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Revision Manager */}
      {activeTab === 'revision' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Spaced Repetition Revision Schedule</h3>
          {revisions.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title="No revisions currently due"
              description="As topics are completed, automated spaced repetition schedules (Day 1, Day 3, Day 7, Day 30) will appear here."
            />
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => completeRevision.mutate(rev.id)}
                      className="p-1 rounded-full text-muted-foreground hover:text-emerald-500"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {rev.topic_name || `Topic #${rev.topic}`}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Revision #{rev.revision_number} • Due: {rev.scheduled_date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeRevision.mutate(rev.id)}
                    className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
                  >
                    Mark Reviewed
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Add Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Polity & Governance"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Exam Weightage (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newSubject.weightage}
                  onChange={(e) => setNewSubject({ ...newSubject, weightage: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Add Chapter</h3>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preamble & Salient Features"
                  value={newChapter.name}
                  onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Add Topic</h3>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kesavananda Bharati Landmark Judgment"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock Test Modal */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Record Mock Test Result</h3>
            <form onSubmit={handleAddMock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vision IAS Full Length Mock 1"
                  value={newMock.test_name}
                  onChange={(e) => setNewMock({ ...newMock, test_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={newMock.total_marks}
                    onChange={(e) => setNewMock({ ...newMock, total_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    value={newMock.obtained_marks}
                    onChange={(e) => setNewMock({ ...newMock, obtained_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Correct Questions</label>
                  <input
                    type="number"
                    value={newMock.correct}
                    onChange={(e) => setNewMock({ ...newMock, correct: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Incorrect Questions</label>
                  <input
                    type="number"
                    value={newMock.incorrect}
                    onChange={(e) => setNewMock({ ...newMock, incorrect: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMockModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mistake Modal */}
      {showMistakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Log Mistake</h3>
            <form onSubmit={handleAddMistake} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Question Text</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Paste or write the question that went wrong..."
                  value={newMistake.question_text}
                  onChange={(e) => setNewMistake({ ...newMistake, question_text: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Correct Answer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Option (C) - Only Statement 2 is correct"
                  value={newMistake.correct_answer}
                  onChange={(e) => setNewMistake({ ...newMistake, correct_answer: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Explanation / Rule</label>
                <textarea
                  rows={2}
                  placeholder="Why is it correct? What did you misread?"
                  value={newMistake.explanation}
                  onChange={(e) => setNewMistake({ ...newMistake, explanation: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMistakeModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Save to Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
