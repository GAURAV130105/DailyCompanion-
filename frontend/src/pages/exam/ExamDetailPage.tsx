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
  useUpdateChapter,
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
  useCreateRevision,
  useCompleteRevision,
  useDeleteRevision,
} from '../../api/exams';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  Check,
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
  Sparkles,
  RotateCcw,
  Calendar,
  Filter,
} from 'lucide-react';
import type { Topic, Chapter, RevisionSchedule } from '../../types';

export const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'mocks' | 'mistakes' | 'revision'>('syllabus');

  const { data: exam, isLoading: loadingExam } = useExamProfile(id || '');
  const { data: progress } = useExamProgress(id || '');
  const { data: loadedSubjects = [] } = useSubjects(id || '');
  const { data: mockTests = [] } = useMockTests(id);
  const { data: mistakes = [] } = useMistakes();
  const { data: revisions = [] } = useRevisions(id);

  const navigate = useNavigate();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const createMock = useCreateMockTest();
  const deleteMock = useDeleteMockTest();
  const createMistake = useCreateMistake();
  const deleteMistake = useDeleteMistake();
  const deleteExam = useDeleteExamProfile();
  const createRevision = useCreateRevision();
  const completeRevision = useCompleteRevision();
  const deleteRevision = useDeleteRevision();

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [showManualRevisionModal, setShowManualRevisionModal] = useState(false);

  // Modal forms
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [targetChapterId, setTargetChapterId] = useState('');
  const [newChapterSubjectName, setNewChapterSubjectName] = useState('');

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
  const [manualRevision, setManualRevision] = useState({
    name: '',
    subject_name: '',
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    interval_days: 1,
  });

  // UI state
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [revisionFilter, setRevisionFilter] = useState<'all' | 'due' | 'completed'>('due');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  if (loadingExam) return <LoadingSkeleton rows={4} />;
  if (!exam) return <div className="p-8 text-center text-foreground">Exam profile not found.</div>;

  const subjects = loadedSubjects.length > 0 ? loadedSubjects : (exam.subjects || []);

  const toggleChapterExpanded = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const showToast = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4500);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSubject.mutateAsync({
        exam_profile: exam.id,
        exam_profile_id: exam.id,
        name: newSubject.name.trim(),
        weightage: Number(newSubject.weightage),
        color: newSubject.color,
        order: subjects.length + 1,
      });
      setNewSubject({ name: '', weightage: 20, color: '#3B82F6' });
      setShowSubjectModal(false);
      showToast(`Subject "${newSubject.name}" created successfully.`);
    } catch (err) {
      console.warn('Subject creation handled:', err);
      setShowSubjectModal(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let actualSubjectId = targetSubjectId;

      // If no subject exists or user chosen to create a new subject inline
      if (!actualSubjectId || actualSubjectId === 'NEW_SUBJECT') {
        const subName = newChapterSubjectName.trim() || 'General Syllabus';
        const createdSub = await createSubject.mutateAsync({
          exam_profile: exam.id,
          exam_profile_id: exam.id,
          name: subName,
          weightage: 20,
          color: '#3B82F6',
          order: subjects.length + 1,
        });
        actualSubjectId = createdSub.id;
      }

      await createChapter.mutateAsync({
        subject: actualSubjectId,
        subject_id: actualSubjectId,
        name: newChapter.name.trim(),
        estimated_hours: Number(newChapter.estimated_hours) || 1,
        order: 1,
        is_completed: false,
        status: 'pending',
      });

      const addedName = newChapter.name.trim();
      setNewChapter({ name: '', estimated_hours: 10 });
      setNewChapterSubjectName('');
      setShowChapterModal(false);
      showToast(`Chapter "${addedName}" added successfully. You can now tick it to transfer to revision!`);
    } catch (err) {
      console.warn('Chapter creation handled:', err);
      setShowChapterModal(false);
    }
  };

  const handleToggleChapterCompletion = async (ch: Chapter, subName?: string) => {
    const isCurrentlyDone = ch.is_completed || ch.status === 'completed';
    const willBeCompleted = !isCurrentlyDone;
    const newStatus = willBeCompleted ? 'completed' : 'pending';

    try {
      // 1. Update Chapter state
      await updateChapter.mutateAsync({
        id: ch.id,
        subject: ch.subject_id || ch.subject,
        is_completed: willBeCompleted,
        status: newStatus,
        completed_at: willBeCompleted ? new Date().toISOString() : null,
      });

      if (willBeCompleted) {
        // 2. Automatically transfer to Revision Section!
        const existingRev = revisions.find(
          (r) => r.topic === ch.id || (r as any).chapter_id === ch.id
        );

        if (!existingRev) {
          const scheduledDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          await createRevision.mutateAsync({
            exam_profile_id: exam.id,
            exam_profile: exam.id,
            topic: ch.id,
            topic_name: ch.name,
            subject_name: subName || 'Syllabus',
            item_type: 'chapter',
            scheduled_date: scheduledDate,
            interval_days: 1,
            revision_number: 1,
            completed: false,
          });
        }
        showToast(`✓ Chapter "${ch.name}" completed and transferred to Revision Schedule (Day 1 due tomorrow)!`);
      } else {
        // If unticked, remove pending revision schedule for this chapter
        const existingRev = revisions.find(
          (r) => (r.topic === ch.id || (r as any).chapter_id === ch.id) && !r.completed
        );
        if (existingRev) {
          await deleteRevision.mutateAsync(existingRev.id);
        }
        showToast(`"${ch.name}" marked pending and removed from active revisions.`);
      }
    } catch (err) {
      console.warn('Failed to toggle chapter completion:', err);
    }
  };

  const handleToggleTopicCompletion = async (top: Topic, ch: Chapter, subName?: string) => {
    const isCurrentlyDone = top.is_completed || top.status === 'completed';
    const willBeCompleted = !isCurrentlyDone;
    const newStatus = willBeCompleted ? 'completed' : 'pending';

    try {
      await updateTopic.mutateAsync({
        id: top.id,
        chapter: top.chapter_id || top.chapter,
        is_completed: willBeCompleted,
        status: newStatus,
        completed_at: willBeCompleted ? new Date().toISOString() : null,
      });

      if (willBeCompleted) {
        const existingRev = revisions.find((r) => r.topic === top.id);
        if (!existingRev) {
          const scheduledDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          await createRevision.mutateAsync({
            exam_profile_id: exam.id,
            exam_profile: exam.id,
            topic: top.id,
            topic_name: top.name,
            subject_name: subName || 'Syllabus',
            item_type: 'topic',
            scheduled_date: scheduledDate,
            interval_days: 1,
            revision_number: 1,
            completed: false,
          });
        }
        showToast(`✓ Topic "${top.name}" completed and added to Revision Schedule!`);
      } else {
        const existingRev = revisions.find((r) => r.topic === top.id && !r.completed);
        if (existingRev) {
          await deleteRevision.mutateAsync(existingRev.id);
        }
        showToast(`Topic "${top.name}" marked pending.`);
      }
    } catch (err) {
      console.warn('Failed to toggle topic completion:', err);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTopic.mutateAsync({
        chapter: targetChapterId,
        chapter_id: targetChapterId,
        name: newTopic.name.trim(),
        estimated_hours: Number(newTopic.estimated_hours),
        difficulty: newTopic.difficulty,
        status: 'pending',
        is_completed: false,
      });
      setNewTopic({ name: '', estimated_hours: 2, difficulty: 'medium' });
      setShowTopicModal(false);
      showToast(`Topic added to chapter successfully.`);
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

  const handleAdvanceRevision = async (rev: RevisionSchedule) => {
    await completeRevision.mutateAsync(rev.id);

    // Spaced repetition progression: 1 -> 3 -> 7 -> 14 -> 30 days
    if (rev.revision_number < 5) {
      const intervals = [1, 3, 7, 14, 30];
      const nextIdx = Math.min(rev.revision_number, intervals.length - 1);
      const nextInterval = intervals[nextIdx];
      const nextDate = new Date(Date.now() + nextInterval * 86400000).toISOString().split('T')[0];

      await createRevision.mutateAsync({
        exam_profile_id: exam.id,
        exam_profile: exam.id,
        topic: rev.topic,
        topic_name: rev.topic_name,
        subject_name: rev.subject_name,
        item_type: rev.item_type || 'chapter',
        scheduled_date: nextDate,
        interval_days: nextInterval,
        revision_number: rev.revision_number + 1,
        completed: false,
      });

      showToast(`Revision marked complete! Advanced to Revision #${rev.revision_number + 1} (${nextInterval} days interval).`);
    } else {
      showToast('Mastery achieved! Final revision stage completed.');
    }
  };

  const handleAddManualRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRevision.name.trim()) return;
    try {
      await createRevision.mutateAsync({
        exam_profile_id: exam.id,
        exam_profile: exam.id,
        topic: `custom-${Date.now()}`,
        topic_name: manualRevision.name.trim(),
        subject_name: manualRevision.subject_name.trim() || 'General Syllabus',
        item_type: 'chapter',
        scheduled_date: manualRevision.scheduled_date,
        interval_days: Number(manualRevision.interval_days) || 1,
        revision_number: 1,
        completed: false,
      });
      setManualRevision({
        name: '',
        subject_name: '',
        scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        interval_days: 1,
      });
      setShowManualRevisionModal(false);
      showToast('Manual revision task added to schedule.');
    } catch (err) {
      console.warn('Failed to add manual revision:', err);
    }
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

  const dueRevisions = revisions.filter((r) => !r.completed);
  const completedRevisions = revisions.filter((r) => r.completed);
  const filteredRevisions =
    revisionFilter === 'due'
      ? dueRevisions
      : revisionFilter === 'completed'
      ? completedRevisions
      : revisions;

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-card border border-emerald-500/40 text-foreground rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold">{notificationMessage}</p>
          <button
            onClick={() => setActiveTab('revision')}
            className="text-[11px] font-bold text-primary hover:underline px-2 py-1 rounded bg-primary/10 ml-2"
          >
            View Revision Tab →
          </button>
        </div>
      )}

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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTargetSubjectId(subjects[0]?.id || '');
                setShowChapterModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
              title="Add a new chapter to syllabus"
            >
              <Plus className="w-3.5 h-3.5" /> Add Chapter
            </button>
            <button
              onClick={() => setShowSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition"
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
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground font-medium flex-wrap">
            <span>
              Total Syllabus Items: <strong className="text-foreground">{progress.total_topics}</strong>
            </span>
            <span>
              Completed: <strong className="text-emerald-500">{progress.completed}</strong>
            </span>
            <span>
              Pending: <strong className="text-muted-foreground">{progress.pending}</strong>
            </span>
            <span>
              Active Revisions: <strong className="text-blue-500">{dueRevisions.length}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'syllabus', label: 'Syllabus Tracker', icon: <Layers className="w-4 h-4" /> },
          { id: 'revision', label: `Revision Section (${dueRevisions.length} Due)`, icon: <Clock className="w-4 h-4" /> },
          { id: 'mocks', label: `Mock Tests (${mockTests.length})`, icon: <FileCheck className="w-4 h-4" /> },
          { id: 'mistakes', label: `Mistake Notebook (${mistakes.length})`, icon: <AlertTriangle className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 ${
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
              title="No subjects or chapters added yet"
              description="Start building your syllabus tree (e.g. Indian Polity, Modern History, Geography) and add chapters with one-click completion."
              action={
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setTargetSubjectId('');
                      setShowChapterModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Chapter
                  </button>
                  <button
                    onClick={() => setShowSubjectModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Subject
                  </button>
                </div>
              }
            />
          ) : (
            <div className="space-y-6">
              {subjects.map((sub) => {
                const chapters = sub.chapters || [];
                const completedChaptersCount = chapters.filter(
                  (c) => c.is_completed || c.status === 'completed'
                ).length;

                return (
                  <div key={sub.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    {/* Subject Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || '#3B82F6' }}
                        />
                        <h3 className="font-bold text-base text-foreground">{sub.name}</h3>
                        <span className="text-xs text-muted-foreground font-medium">
                          Weightage: {sub.weightage}%
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-semibold text-foreground">
                          {completedChaptersCount}/{chapters.length} Chapters Done
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTargetSubjectId(sub.id);
                            setShowChapterModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Chapter
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete subject "${sub.name}" and all its chapters?`)) {
                              await deleteSubject.mutateAsync(sub.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Chapters List */}
                    {chapters.length === 0 ? (
                      <div className="py-6 text-center bg-muted/20 border border-dashed border-border rounded-xl mt-4">
                        <p className="text-xs text-muted-foreground mb-3">No chapters added to {sub.name} yet.</p>
                        <button
                          onClick={() => {
                            setTargetSubjectId(sub.id);
                            setShowChapterModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> Add Chapter to {sub.name}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {chapters.map((ch) => {
                          const topics = ch.topics || [];
                          const isDone = ch.is_completed || ch.status === 'completed';

                          return (
                            <div
                              key={ch.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                                  : 'bg-background border-border hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Chapter Completion Tick Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChapterCompletion(ch, sub.name)}
                                    className={`p-1.5 rounded-lg transition flex items-center justify-center shrink-0 cursor-pointer ${
                                      isDone
                                        ? 'text-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25'
                                        : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
                                    }`}
                                    title={
                                      isDone
                                        ? 'Completed! Click to un-tick'
                                        : 'Click to tick as Completed (Transfers to Revision Section)'
                                    }
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-xs font-bold transition ${
                                          isDone
                                            ? 'text-muted-foreground line-through opacity-85'
                                            : 'text-foreground'
                                        }`}
                                      >
                                        📖 {ch.name}
                                      </span>

                                      {isDone ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                          <Check className="w-2.5 h-2.5" /> Completed & Transferred to Revision
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                                          Pending
                                        </span>
                                      )}

                                      <span className="text-[11px] text-muted-foreground font-medium">
                                        {ch.estimated_hours} hrs
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Chapter Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {topics.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleChapterExpanded(ch.id)}
                                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded bg-muted/60"
                                    >
                                      {expandedChapters[ch.id] ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                      <span>{topics.length} topics</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetChapterId(ch.id);
                                      setShowTopicModal(true);
                                    }}
                                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add Topic
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Delete chapter "${ch.name}"?`)) {
                                        await deleteChapter.mutateAsync(ch.id);
                                      }
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Subtopics List (Collapsible) */}
                              {topics.length > 0 && expandedChapters[ch.id] && (
                                <div className="mt-3 pl-8 pt-3 border-t border-border/60 space-y-2">
                                  {topics.map((top) => {
                                    const topicDone = top.is_completed || top.status === 'completed';
                                    return (
                                      <div
                                        key={top.id}
                                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                                          topicDone
                                            ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                                            : 'bg-background border-border hover:border-primary/40'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleTopicCompletion(top, ch, sub.name)}
                                            className="text-muted-foreground hover:text-emerald-500 cursor-pointer"
                                            title="Click to tick topic completed"
                                          >
                                            {topicDone ? (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                              <Circle className="w-4 h-4" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateTopic.mutate({
                                                id: top.id,
                                                status: cycleStatus(top.status),
                                              })
                                            }
                                            title="Click to cycle status"
                                          >
                                            {statusBadge(top.status)}
                                          </button>
                                          <span
                                            className={`font-medium ${
                                              topicDone ? 'line-through text-muted-foreground' : 'text-foreground'
                                            }`}
                                          >
                                            {top.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[11px] text-muted-foreground">
                                            {top.estimated_hours}h • {top.difficulty}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (window.confirm(`Delete topic "${top.name}"?`)) {
                                                await deleteTopic.mutateAsync(top.id);
                                              }
                                            }}
                                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                                            title="Delete Topic"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Revision Section */}
      {activeTab === 'revision' && (
        <div className="space-y-6">
          {/* Spaced Repetition Methodology Banner */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Spaced Repetition Revision System
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When you tick chapters completed in the syllabus, they automatically enter this spaced revision schedule based on the Ebbinghaus Forgetting Curve.
                </p>
              </div>
              <button
                onClick={() => setShowManualRevisionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Manual Revision
              </button>
            </div>

            {/* Intervals progression badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-border text-center">
              {[
                { rev: 'Rev #1', days: '1 Day', label: 'Initial Recall' },
                { rev: 'Rev #2', days: '3 Days', label: 'Consolidation' },
                { rev: 'Rev #3', days: '7 Days', label: 'Retention' },
                { rev: 'Rev #4', days: '14 Days', label: 'Long-term' },
                { rev: 'Rev #5', days: '30 Days', label: 'Exam Mastery' },
              ].map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{step.rev}</span>
                  <p className="text-xs font-black text-foreground mt-0.5">{step.days}</p>
                  <p className="text-[10px] text-muted-foreground">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRevisionFilter('due')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                revisionFilter === 'due'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Due & Scheduled ({dueRevisions.length})
            </button>
            <button
              onClick={() => setRevisionFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                revisionFilter === 'completed'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Completed / Reviewed ({completedRevisions.length})
            </button>
            <button
              onClick={() => setRevisionFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                revisionFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All Revisions ({revisions.length})
            </button>
          </div>

          {/* Revision Items */}
          {filteredRevisions.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title={revisionFilter === 'due' ? 'No revisions currently due' : 'No revisions found'}
              description={
                revisionFilter === 'due'
                  ? 'Go to the Syllabus Tracker tab and tick any chapter or topic as completed to automatically transfer it here for spaced revision.'
                  : 'Completed revisions will appear here once you mark chapters reviewed.'
              }
              action={
                <button
                  onClick={() => setActiveTab('syllabus')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  <Layers className="w-3.5 h-3.5" /> Go to Syllabus Tracker
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredRevisions.map((rev) => {
                const isOverdue = !rev.completed && new Date(rev.scheduled_date) < new Date(new Date().toDateString());
                const isDueToday =
                  !rev.completed &&
                  new Date(rev.scheduled_date).toDateString() === new Date().toDateString();

                return (
                  <div
                    key={rev.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition ${
                      rev.completed
                        ? 'bg-muted/20 border-border opacity-80'
                        : isOverdue
                        ? 'bg-rose-500/[0.04] border-rose-500/30'
                        : isDueToday
                        ? 'bg-amber-500/[0.04] border-amber-500/30'
                        : 'bg-background border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleAdvanceRevision(rev)}
                        className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
                          rev.completed
                            ? 'text-emerald-500 hover:text-emerald-600'
                            : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={rev.completed ? 'Reviewed' : 'Click to complete & advance spaced interval'}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${rev.completed ? 'fill-emerald-500/20' : ''}`} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary">
                            {rev.item_type === 'topic' ? '📝 Topic' : '📖 Chapter'}
                          </span>
                          {rev.subject_name && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {rev.subject_name}
                            </span>
                          )}
                          <h4
                            className={`text-xs font-bold ${
                              rev.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {rev.topic_name || `Item #${rev.topic}`}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                          <span>
                            Stage: <strong>Revision #{rev.revision_number}</strong> ({rev.interval_days}-day interval)
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3" /> Due Date: {rev.scheduled_date}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">
                              Overdue
                            </span>
                          )}
                          {isDueToday && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                              Due Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!rev.completed ? (
                        <button
                          onClick={() => handleAdvanceRevision(rev)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Reviewed & Advance
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 rounded-lg">
                          Reviewed
                        </span>
                      )}

                      <button
                        onClick={async () => {
                          if (window.confirm('Remove this item from revision schedule?')) {
                            await deleteRevision.mutateAsync(rev.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                        title="Delete from schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mock Tests */}
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

      {/* Tab 4: Mistake Notebook */}
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
            <p className="text-xs text-muted-foreground">
              Chapters can be ticked as completed in the syllabus to automatically transfer to your Spaced Repetition Revision Schedule.
            </p>
            <form onSubmit={handleAddChapter} className="space-y-4">
              {/* Target Subject Selector */}
              {subjects.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Subject</label>
                  <select
                    value={targetSubjectId || subjects[0]?.id}
                    onChange={(e) => setTargetSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="NEW_SUBJECT">+ Create New Subject...</option>
                  </select>
                </div>
              ) : null}

              {/* If no subjects exist or user selected to create new subject */}
              {(subjects.length === 0 || targetSubjectId === 'NEW_SUBJECT') && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Subject Name <span className="text-muted-foreground">(to group this chapter)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Polity / Quantitative Aptitude"
                    value={newChapterSubjectName}
                    onChange={(e) => setNewChapterSubjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preamble & Constitutional Features"
                  value={newChapter.name}
                  onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Estimated Hours to Complete</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newChapter.estimated_hours}
                  onChange={(e) => setNewChapter({ ...newChapter, estimated_hours: Number(e.target.value) })}
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
                  disabled={!newChapter.name.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg disabled:opacity-50"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={newTopic.estimated_hours}
                    onChange={(e) => setNewTopic({ ...newTopic, estimated_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Difficulty</label>
                  <select
                    value={newTopic.difficulty}
                    onChange={(e) => setNewTopic({ ...newTopic, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
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

      {/* Manual Revision Modal */}
      {showManualRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Schedule Revision Task</h3>
            <form onSubmit={handleAddManualRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Chapter / Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern History: 1857 Revolt Timeline"
                  value={manualRevision.name}
                  onChange={(e) => setManualRevision({ ...manualRevision, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Modern History"
                  value={manualRevision.subject_name}
                  onChange={(e) => setManualRevision({ ...manualRevision, subject_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={manualRevision.scheduled_date}
                    onChange={(e) => setManualRevision({ ...manualRevision, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Interval Days</label>
                  <input
                    type="number"
                    min={1}
                    value={manualRevision.interval_days}
                    onChange={(e) => setManualRevision({ ...manualRevision, interval_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualRevisionModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  Schedule Revision
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
