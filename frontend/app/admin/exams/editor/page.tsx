'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Question, QuestionGroup, Exam } from '@/types';
import { 
  Save, Eye, Upload, Plus, Trash2, ArrowUp, ArrowDown, Search, 
  FileText, CheckSquare, Layers, Image as ImageIcon,
  CheckCircle2, AlertCircle, Sparkles, BookOpen, FolderPlus,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Check, X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function ExamAuthoringEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  // State
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam-demo-01');
  const [activeCategory, setActiveCategory] = useState<'math' | 'reading' | 'science'>('math');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  
  // Active item selection
  const [activeSelection, setActiveSelection] = useState<{ type: 'question' | 'group'; id: string } | null>(null);

  // UI Workspace State: Collapsible Left Panel for maximum canvas area
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Explanation Generation State
  const [generatingAiExplanation, setGeneratingAiExplanation] = useState(false);

  // File Upload Input Refs
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const groupImageInputRef = useRef<HTMLInputElement>(null);

  // Load Exams
  useEffect(() => {
    fetch('/api/admin/exams')
      .then(res => res.json())
      .then(data => {
        if (data.exams && data.exams.length > 0) {
          setExams(data.exams);
          if (queryId && data.exams.some((e: any) => e.id === queryId)) {
            setSelectedExamId(queryId);
          } else {
            setSelectedExamId(data.exams[0].id);
          }
        }
      });
  }, [queryId]);

  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];
  
  const currentModule = currentExam?.modules?.find(m => m.category === activeCategory) || {
    id: `mod-${activeCategory}-${selectedExamId}`,
    examId: selectedExamId,
    title: activeCategory === 'math' ? '1. Tư duy Toán học' : activeCategory === 'reading' ? '2. Tư duy Đọc hiểu' : '3. Tư duy Khoa học & GQVĐ',
    category: activeCategory,
    durationMinutes: activeCategory === 'reading' ? 30 : 60,
    openTime: '00:00 01/01/2026',
    closeTime: '23:59 31/12/2027',
    totalQuestions: activeCategory === 'reading' ? 20 : 40,
  };

  // Load questions & groups for active module
  useEffect(() => {
    if (!currentModule?.id) return;

    fetch(`/api/student/exams?moduleId=${currentModule.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setQuestionGroups(data.questionGroups || []);
          setActiveSelection({ type: 'question', id: data.questions[0].id });
        } else {
          // Default Sample Image-Based Questions
          const sampleQuestions: Question[] = [
            {
              id: `q-${activeCategory}-1`,
              moduleId: currentModule.id,
              number: 1,
              type: 'single_choice',
              text: 'Câu hỏi dạng ảnh 1',
              imageUrl: '',
              options: [
                { id: 'opt-a', text: 'Đáp án A' },
                { id: 'opt-b', text: 'Đáp án B' },
                { id: 'opt-c', text: 'Đáp án C' },
                { id: 'opt-d', text: 'Đáp án D' }
              ],
              correctOptionId: 'opt-a',
              explanation: 'Lời giải chi tiết cho câu hỏi 1. Ta có: $\\lim_{x \\to 2} f(x) = 4$.',
              explanationImageUrl: '',
            },
            {
              id: `q-${activeCategory}-2`,
              moduleId: currentModule.id,
              number: 2,
              type: 'multiple_choice',
              text: 'Câu hỏi dạng ảnh 2 (Đúng/Sai)',
              imageUrl: '',
              options: [
                { id: 'opt-2a', text: 'Ý a' },
                { id: 'opt-2b', text: 'Ý b' },
                { id: 'opt-2c', text: 'Ý c' },
                { id: 'opt-2d', text: 'Ý d' }
              ],
              correctOptionIds: ['opt-2a', 'opt-2b'],
              explanation: 'Phân tích các ý đúng sai dựa vào đồ thị.',
              explanationImageUrl: '',
            },
          ];

          setQuestions(sampleQuestions);
          setQuestionGroups([]);
          setActiveSelection({ type: 'question', id: sampleQuestions[0].id });
        }
        setIsDirty(false);
      })
      .catch(e => {
        console.error('Error fetching questions:', e);
        setIsDirty(false);
      });
  }, [activeCategory, selectedExamId, currentModule?.id]);

  const activeQuestion = activeSelection?.type === 'question' 
    ? questions.find(q => q.id === activeSelection.id) || questions[0]
    : null;

  const activeGroup = activeSelection?.type === 'group'
    ? questionGroups.find(g => g.id === activeSelection.id)
    : null;

  // AI EXPLANATION GENERATOR (GEMINI 2.5 FLASH)
  const handleGenerateAiExplanation = async () => {
    if (!activeQuestion) return;
    setGeneratingAiExplanation(true);

    try {
      const activeGroupPassage = activeQuestion.groupId 
        ? questionGroups.find(g => g.id === activeQuestion.groupId)?.passage
        : undefined;

      const res = await fetch('/api/admin/generate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: activeQuestion.text || `Câu hỏi số ${activeQuestion.number}`,
          options: activeQuestion.options,
          passage: activeGroupPassage,
          category: activeCategory,
          correctOptionId: activeQuestion.correctOptionId,
        }),
      });

      const data = await res.json();
      if (data.success && data.explanation) {
        handleUpdateActiveQuestion('explanation', data.explanation);
      } else {
        alert(data.error || 'Không thể tự động tạo lời giải bằng AI.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ Gemini AI');
    } finally {
      setGeneratingAiExplanation(false);
    }
  };

  // Base64 Image Upload Handlers
  const handleImageUpload = (file: File, targetField: 'imageUrl' | 'explanationImageUrl' | 'groupImageUrl') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (targetField === 'imageUrl' && activeQuestion) {
        handleUpdateActiveQuestion('imageUrl', base64Url);
      } else if (targetField === 'explanationImageUrl' && activeQuestion) {
        handleUpdateActiveQuestion('explanationImageUrl', base64Url);
      } else if (targetField === 'groupImageUrl' && activeGroup) {
        handleUpdateGroup('imageUrl', base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  // Question Mutators
  const handleUpdateActiveQuestion = (field: keyof Question, value: any) => {
    if (!activeQuestion) return;
    setQuestions(prev => prev.map(q => q.id === activeQuestion.id ? { ...q, [field]: value } : q));
    setIsDirty(true);
  };

  const handleOptionTextChange = (optId: string, newText: string) => {
    if (!activeQuestion) return;
    const updatedOpts = activeQuestion.options.map(o => o.id === optId ? { ...o, text: newText } : o);
    handleUpdateActiveQuestion('options', updatedOpts);
  };

  const handleAddQuestion = (targetGroupId?: string) => {
    const newNum = questions.length + 1;
    const newQId = `q-new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newQ: Question = {
      id: newQId,
      moduleId: currentModule.id,
      groupId: targetGroupId,
      number: newNum,
      type: 'single_choice',
      text: `Câu hỏi số ${newNum}`,
      imageUrl: '',
      options: [
        { id: 'opt-a', text: 'Đáp án A' },
        { id: 'opt-b', text: 'Đáp án B' },
        { id: 'opt-c', text: 'Đáp án C' },
        { id: 'opt-d', text: 'Đáp án D' },
      ],
      correctOptionId: 'opt-a',
      explanation: 'Lời giải chi tiết câu hỏi...',
      explanationImageUrl: '',
    };

    setQuestions(prev => [...prev, newQ]);

    if (targetGroupId) {
      setQuestionGroups(prev => prev.map(g => {
        if (g.id === targetGroupId) {
          const currentIds = g.questionIds || [];
          return { ...g, questionIds: [...currentIds, newQId] };
        }
        return g;
      }));
    }

    setActiveSelection({ type: 'question', id: newQId });
    setIsDirty(true);
  };

  const handleAddQuestionGroup = () => {
    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newGroup: QuestionGroup = {
      id: newGroupId,
      moduleId: currentModule.id,
      title: `Nhóm bối cảnh ${questionGroups.length + 1}`,
      passage: `[Bối cảnh Đọc hiểu / Khoa học dạng bài đọc hoặc hình ảnh]`,
      imageUrl: '',
      questionIds: [],
    };
    setQuestionGroups(prev => [...prev, newGroup]);
    setActiveSelection({ type: 'group', id: newGroupId });
    setIsDirty(true);
  };

  const handleUpdateGroup = (field: keyof QuestionGroup, value: any) => {
    if (!activeGroup) return;
    setQuestionGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, [field]: value } : g));
    setIsDirty(true);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Mỗi phần thi phải chứa ít nhất 1 câu hỏi.');
      return;
    }
    const filtered = questions.filter(q => q.id !== id);
    const renumbered = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(renumbered);
    setQuestionGroups(prev => prev.map(g => ({ ...g, questionIds: g.questionIds.filter(qId => qId !== id) })));
    setActiveSelection({ type: 'question', id: renumbered[0].id });
    setIsDirty(true);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextList = [...questions];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    const renumbered = nextList.map((q, i) => ({ ...q, number: i + 1 }));
    setQuestions(renumbered);
    setIsDirty(true);
  };

  // Persistence
  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedExamId,
          moduleId: currentModule.id,
          questions,
          questionGroups,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Không thể lưu dữ liệu.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  // Live Draft Preview (Auto-saves to CSDL first!)
  const handleLivePreview = async () => {
    try {
      // 1. Auto-save all changes to CSDL server storage first so no work is lost
      if (isDirty) {
        await handleSaveChanges();
      }
      sessionStorage.setItem('caculus_draft_questions', JSON.stringify(questions));
      sessionStorage.setItem('caculus_draft_groups', JSON.stringify(questionGroups));
      router.push(`/exams/${selectedExamId}/room?module=${currentModule.id}&preview=true`);
    } catch (e) {
      console.error(e);
      alert('Lỗi khởi tạo chế độ xem trước.');
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(q.number).includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* ULTRA-COMPACT TOP TOOLBAR (OPTIMIZED WORKSPACE) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          <div className="flex items-center gap-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-slate-800 text-white font-bold text-xs sm:text-sm border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#d90429]"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>

            {isDirty ? (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Chưa lưu CSDL
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu đồng bộ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                ✓ Đã lưu CSDL thành công!
              </span>
            )}

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex-1 sm:flex-initial bg-[#d90429] hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>

            <button
              onClick={handleLivePreview}
              className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Eye className="w-4 h-4" />
              Xem trước bài thi
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 relative">
        
        {/* COLLAPSIBLE LEFT SIDEBAR (DANH SÁCH CÂU HỎI & PHẦN THI) */}
        <div className={`transition-all duration-300 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0 ${
          isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-80 lg:w-96'
        }`}>
          {/* Sidebar Toggle Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-5 bg-[#d90429] rounded-full inline-block"></span>
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phần thi & Câu hỏi
                </span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition mx-auto"
              title={isSidebarCollapsed ? 'Mở rộng bảng câu hỏi' : 'Thu gọn bảng câu hỏi'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 text-[#d90429]" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              {/* Category Sub-tabs */}
              <div className="p-2 bg-slate-100 border-b border-slate-200 flex gap-1">
                <button
                  onClick={() => setActiveCategory('math')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    activeCategory === 'math' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🔵 Toán (40)
                </button>
                <button
                  onClick={() => setActiveCategory('reading')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    activeCategory === 'reading' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🟣 Đọc (20)
                </button>
                <button
                  onClick={() => setActiveCategory('science')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    activeCategory === 'science' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🟢 KH (20)
                </button>
              </div>

              {/* Action Toolbar & Search */}
              <div className="p-3 border-b border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">
                    Tổng: {questions.length} câu
                  </span>
                  <div className="flex gap-1">
                    {activeCategory !== 'math' && (
                      <button
                        onClick={handleAddQuestionGroup}
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs px-2 py-1 rounded-lg border border-purple-200 flex items-center gap-1"
                      >
                        <FolderPlus className="w-3.5 h-3.5" /> +Bối cảnh
                      </button>
                    )}
                    <button
                      onClick={() => handleAddQuestion()}
                      className="bg-rose-50 text-[#d90429] hover:bg-rose-100 font-bold text-xs px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> +Thêm câu
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Lọc số câu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#d90429]"
                  />
                </div>
              </div>

              {/* Questions List Items */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[620px]">
                {/* Question Groups (Bối cảnh) */}
                {questionGroups.map((g, gIdx) => {
                  const isGroupActive = activeSelection?.type === 'group' && activeSelection.id === g.id;

                  return (
                    <div
                      key={`group-${g.id}-${gIdx}`}
                      onClick={() => setActiveSelection({ type: 'group', id: g.id })}
                      className={`p-2.5 rounded-xl border transition cursor-pointer space-y-1 ${
                        isGroupActive ? 'border-purple-600 bg-purple-50/60 shadow-2xs' : 'border-purple-200 bg-purple-50/20 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-purple-700" />
                          <span className="font-extrabold text-xs text-purple-900 truncate max-w-[160px]">
                            {g.title || `Bối cảnh ${gIdx + 1}`}
                          </span>
                        </div>
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {g.questionIds.length} câu
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Individual Question Item Cards */}
                {filteredQuestions.map((q, idx) => {
                  const isQActive = activeSelection?.type === 'question' && activeSelection.id === q.id;
                  const typeLabel = q.type === 'multiple_choice' ? 'Đúng/Sai' : q.type === 'fill_blank' ? 'Điền từ' : '1 Đáp án';

                  return (
                    <div
                      key={`q-${q.id}-${idx}`}
                      onClick={() => setActiveSelection({ type: 'question', id: q.id })}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 group ${
                        isQActive
                          ? 'border-[#d90429] bg-rose-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="bg-slate-900 text-white font-extrabold text-xs w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                          {q.number || idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            Câu {q.number || idx + 1} {q.imageUrl ? '📷 [Ảnh]' : ''}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            q.type === 'multiple_choice' ? 'bg-purple-100 text-purple-700' : q.type === 'fill_blank' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {typeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'up'); }}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'down'); }}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                          className="p-1 text-slate-400 hover:text-[#d90429]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT MAIN EDITOR CANVAS (TO ĐẸP, RÕ RÀNG, TỐI ƯU KHÔNG GIAN) */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[720px]">
          
          {/* GROUP BỐI CẢNH EDITOR (ĐỌC HIỂU & KHOA HỌC) */}
          {activeSelection?.type === 'group' && activeGroup && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="bg-purple-100 text-purple-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    BỐI CẢNH / ĐOẠN VĂN ĐỌC HIỂU & KHOA HỌC
                  </span>
                  <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">{activeGroup.title}</h2>
                </div>

                <button
                  onClick={() => handleAddQuestion(activeGroup.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-98"
                >
                  <Plus className="w-4 h-4" /> + Thêm câu hỏi thuộc bối cảnh này
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Tiêu đề bối cảnh *</label>
                <input
                  type="text"
                  value={activeGroup.title || ''}
                  onChange={(e) => handleUpdateGroup('title', e.target.value)}
                  placeholder="Ví dụ: Nhóm bối cảnh 1: Động lực học & Phản ứng Ammonia"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Nội dung bài đọc / Bối cảnh văn bản (Hoặc nhập ghi chú)
                </label>
                <textarea
                  rows={5}
                  value={activeGroup.passage || ''}
                  onChange={(e) => handleUpdateGroup('passage', e.target.value)}
                  placeholder="Nhập nội dung đoạn văn hoặc ghi chú bối cảnh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed font-serif"
                />
              </div>

              {/* 📷 BỐI CẢNH DẠNG ẢNH / SƠ ĐỒ KHOA HỌC */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-700" />
                    Đính kèm Hình ảnh Bối cảnh / Sơ đồ Thí nghiệm (Nếu bối cảnh là Ảnh)
                  </label>
                  {activeGroup.imageUrl && (
                    <button
                      onClick={() => handleUpdateGroup('imageUrl', '')}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Xóa ảnh bối cảnh
                    </button>
                  )}
                </div>

                {activeGroup.imageUrl ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 max-h-64 overflow-auto flex items-center justify-center">
                    <img
                      src={activeGroup.imageUrl}
                      alt="Ảnh bối cảnh"
                      className="max-h-60 w-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => groupImageInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 hover:border-purple-600 hover:bg-purple-100/50 rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-2 bg-white"
                  >
                    <Upload className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-900">Tải lên Ảnh Bối cảnh / Sơ đồ Bài đọc từ Máy tính</span>
                    <input
                      type="file"
                      ref={groupImageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'groupImageUrl');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 📋 DANH SÁCH CÂU HỎI CON THUỘC BỐI CẢNH */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Danh sách các câu hỏi thuộc Bối cảnh này ({(activeGroup.questionIds || []).length} câu)
                  </span>
                  <button
                    onClick={() => handleAddQuestion(activeGroup.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm câu hỏi
                  </button>
                </div>

                <div className="space-y-2">
                  {questions.filter(q => q.groupId === activeGroup.id).map(childQ => (
                    <div
                      key={childQ.id}
                      onClick={() => setActiveSelection({ type: 'question', id: childQ.id })}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-400 transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-1 rounded-md">
                          Câu {childQ.number}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {childQ.text}
                        </span>
                      </div>
                      <span className="text-xs text-purple-700 font-bold hover:underline">Chỉnh sửa câu này →</span>
                    </div>
                  ))}

                  {questions.filter(q => q.groupId === activeGroup.id).length === 0 && (
                    <div className="text-xs text-slate-400 italic text-center py-4">
                      Chưa có câu hỏi nào thuộc bối cảnh này. Nhấn nút "+ Thêm câu hỏi thuộc bối cảnh này" để tạo mới!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* MAIN QUESTION EDITOR (ĐỀ BÀI DẠNG ẢNH LÀM TRUNG TÂM) */}
          {activeSelection?.type === 'question' && activeQuestion && (
            <div className="space-y-6">
              
              {/* Question Header & Type Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-[#d90429] text-white font-black text-lg px-4 py-1.5 rounded-xl shadow-xs">
                    Câu {activeQuestion.number}
                  </span>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-lg">Trình soạn thảo Đề bài dạng Ảnh</h2>
                    <p className="text-xs text-slate-500">Đề bài & Các phương án A/B/C/D đã hiển thị trực tiếp trong hình ảnh</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Dạng câu hỏi:</span>
                  <select
                    value={activeQuestion.type || 'single_choice'}
                    onChange={(e) => handleUpdateActiveQuestion('type', e.target.value)}
                    className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#d90429]"
                  >
                    <option value="single_choice">Trắc nghiệm (1 đáp án A/B/C/D)</option>
                    <option value="multiple_choice">Nhiều đáp án (Chọn Đúng/Sai từng ý)</option>
                    <option value="fill_blank">Điền đáp án ngắn (Fill-in-the-blank)</option>
                  </select>
                </div>
              </div>

              {/* 📷 SECTION 1: MAIN QUESTION PROMPT IMAGE (ẢNH ĐỀ BÀI LÀM TRUNG TÂM) */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border-2 border-dashed border-rose-200 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-[#d90429] uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#d90429]" />
                    ĐÍNH KÈM HÌNH ẢNH ĐỀ BÀI (BAO GỒM NỘI DUNG CÂU HỎI & CÁC PHƯƠNG ÁN) *
                  </label>
                  {activeQuestion.imageUrl && (
                    <button
                      onClick={() => handleUpdateActiveQuestion('imageUrl', '')}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Xóa ảnh đề bài
                    </button>
                  )}
                </div>

                {/* Question Image Preview */}
                {activeQuestion.imageUrl ? (
                  <div className="space-y-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 max-h-96 overflow-auto flex items-center justify-center">
                      <img
                        src={activeQuestion.imageUrl}
                        alt="Đề bài dạng ảnh"
                        className="max-h-80 w-auto object-contain rounded-lg shadow-2xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">URL ảnh:</span>
                      <input
                        type="text"
                        value={activeQuestion.imageUrl}
                        onChange={(e) => handleUpdateActiveQuestion('imageUrl', e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => questionImageInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#d90429] hover:bg-rose-50/50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 bg-white"
                  >
                    <Upload className="w-8 h-8 text-[#d90429]" />
                    <div className="text-xs font-extrabold text-slate-800">
                      Nhấp vào đây để Tải lên Ảnh Đề bài từ Máy tính
                    </div>
                    <p className="text-[11px] text-slate-400">Hỗ trợ định dạng .PNG, .JPG, .JPEG, Base64</p>
                    <input
                      type="file"
                      ref={questionImageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'imageUrl');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: ANSWERS & OPTIONS PICKER */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    Thiết lập Đáp án đúng & Lựa chọn
                  </h3>
                  <span className="text-xs text-slate-500">
                    {activeQuestion.type === 'multiple_choice' ? 'Tích chọn các ý ĐÚNG' : activeQuestion.type === 'fill_blank' ? 'Nhập chuỗi đáp án ngắn chấp nhận' : 'Chọn 1 đáp án ĐÚNG duy nhất'}
                  </span>
                </div>

                {/* Single Choice (A/B/C/D) */}
                {(!activeQuestion.type || activeQuestion.type === 'single_choice') && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['opt-a', 'opt-b', 'opt-c', 'opt-d'].map((optId, idx) => {
                      const label = String.fromCharCode(65 + idx); // A, B, C, D
                      const isSelected = activeQuestion.correctOptionId === optId;

                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={() => handleUpdateActiveQuestion('correctOptionId', optId)}
                          className={`p-3.5 rounded-xl border-2 font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-102'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          <span>Đáp án {label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multiple Choice (True/False per Statement) */}
                {activeQuestion.type === 'multiple_choice' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['opt-2a', 'opt-2b', 'opt-2c', 'opt-2d'].map((optId, idx) => {
                      const label = `Ý ${String.fromCharCode(97 + idx)}`; // a, b, c, d
                      const currentSelected = activeQuestion.correctOptionIds || [];
                      const isSelected = currentSelected.includes(optId);

                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={() => {
                            const nextSelected = isSelected
                              ? currentSelected.filter(id => id !== optId)
                              : [...currentSelected, optId];
                            handleUpdateActiveQuestion('correctOptionIds', nextSelected);
                          }}
                          className={`p-3 rounded-xl border-2 font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-purple-600 border-purple-700 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                          <span>{label} (ĐÚNG)</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the blank */}
                {activeQuestion.type === 'fill_blank' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Các đáp án ngắn chấp nhận đúng (phân cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={(activeQuestion.fillBlankAnswers || []).join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value.split(',').map(s => s.trim());
                        handleUpdateActiveQuestion('fillBlankAnswers', vals);
                      }}
                      placeholder="Ví dụ: 80, 80.0, t=80"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* 📖 SECTION 3: LỜI GIẢI CHI TIẾT & UPLOAD ẢNH ĐÁP ÁN */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#d90429]" />
                    Lời giải chi tiết (Hỗ trợ KaTeX LaTeX Text & Up Ảnh Đáp án)
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateAiExplanation}
                    disabled={generatingAiExplanation}
                    className="bg-[#d90429] hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {generatingAiExplanation ? 'AI đang viết lời giải...' : '✨ AI tạo lời giải (Gemini 2.5 Flash)'}
                  </button>
                </div>

                {/* Explanation KaTeX Textarea */}
                <textarea
                  rows={4}
                  value={activeQuestion.explanation || ''}
                  onChange={(e) => handleUpdateActiveQuestion('explanation', e.target.value)}
                  placeholder="Nhập bước giải chi tiết hoặc công thức KaTeX ($...$)...."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-[#d90429]"
                />

                {/* Live Explanation KaTeX Render Preview */}
                {activeQuestion.explanation && (
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider block">
                      Xem trước Lời giải KaTeX:
                    </span>
                    <div className="text-slate-900 font-medium bg-white p-3 rounded-lg border border-indigo-100">
                      <MathText content={activeQuestion.explanation} />
                    </div>
                  </div>
                )}

                {/* 🖼️ EXPLANATION IMAGE UPLOAD TOOL (UP ẢNH ĐÁP ÁN) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      Đính kèm Hình ảnh Lời giải / Sơ đồ Đáp án chi tiết
                    </label>
                    {activeQuestion.explanationImageUrl && (
                      <button
                        onClick={() => handleUpdateActiveQuestion('explanationImageUrl', '')}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Xóa ảnh lời giải
                      </button>
                    )}
                  </div>

                  {activeQuestion.explanationImageUrl ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 max-h-64 overflow-auto flex items-center justify-center">
                        <img
                          src={activeQuestion.explanationImageUrl}
                          alt="Ảnh lời giải chi tiết"
                          className="max-h-60 w-auto object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => explanationImageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-2 bg-white"
                    >
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">Tải lên Ảnh Lời giải / Đáp án chi tiết từ Máy tính</span>
                      <input
                        type="file"
                        ref={explanationImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'explanationImageUrl');
                        }}
                      />
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function ExamAuthoringEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold text-sm">Đang tải Trình soạn thảo Chi tiết...</div>}>
      <ExamAuthoringEditorContent />
    </Suspense>
  );
}
