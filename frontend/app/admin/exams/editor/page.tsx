'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Question, QuestionGroup, Exam } from '@/types';
import { 
  Save, Eye, Upload, Plus, Trash2, ArrowUp, ArrowDown, Search, 
  FileText, CheckSquare, Layers, Image as ImageIcon,
  CheckCircle2, AlertCircle, Sparkles, BookOpen, FolderPlus,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Check, X, ShieldAlert
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
  
  // CENTRAL MULTI-MODULE DRAFT MAP (Stores questions & groups for ALL 3 modules simultaneously)
  const [allModulesDraft, setAllModulesDraft] = useState<Record<string, { questions: Question[]; questionGroups: QuestionGroup[] }>>({});

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  
  // Active item selection
  const [activeSelection, setActiveSelection] = useState<{ type: 'question' | 'group'; id: string } | null>(null);

  // UI Workspace State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState<string>('');

  // File Upload Input Refs
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const groupImageInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load Exams & Restore Drafts from LocalStorage
  useEffect(() => {
    fetch('/api/admin/exams', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.exams && data.exams.length > 0) {
          setExams(data.exams);
          const targetId = (queryId && data.exams.some((e: any) => e.id === queryId)) ? queryId : data.exams[0].id;
          setSelectedExamId(targetId);

          // Restore local backup if present
          try {
            const savedLocal = localStorage.getItem(`caculus_draft_${targetId}`);
            if (savedLocal) {
              const parsed = JSON.parse(savedLocal);
              if (parsed && typeof parsed === 'object') {
                setAllModulesDraft(parsed);
              }
            }
          } catch (e) {}
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

  // 2. Synchronize questions & groups whenever activeCategory or selectedExamId changes
  useEffect(() => {
    if (!currentModule?.id) return;

    const modId = currentModule.id;

    // Check if memory draft already has questions for this module
    if (allModulesDraft[modId] && allModulesDraft[modId].questions && allModulesDraft[modId].questions.length > 0) {
      setQuestions(allModulesDraft[modId].questions);
      setQuestionGroups(allModulesDraft[modId].questionGroups || []);
      setActiveSelection({ type: 'question', id: allModulesDraft[modId].questions[0].id });
      return;
    }

    // Fetch from CSDL if memory draft is empty
    fetch(`/api/student/exams?moduleId=${modId}&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        let loadedQ = data.questions || [];
        let loadedG = data.questionGroups || [];

        if (loadedQ.length === 0) {
          loadedQ = [
            {
              id: `q-${activeCategory}-1`,
              moduleId: modId,
              number: 1,
              type: 'single_choice',
              text: '[TEST]',
              imageUrl: '',
              options: [
                { id: 'opt-a', text: 'TEST A' },
                { id: 'opt-b', text: 'TEST B' },
                { id: 'opt-c', text: 'TEST C' },
                { id: 'opt-d', text: 'TEST D' }
              ],
              correctOptionId: 'opt-a',
              explanation: '',
              explanationImageUrl: '',
              correctionNote: ''
            }
          ];
        }

        setQuestions(loadedQ);
        setQuestionGroups(loadedG);
        setActiveSelection({ type: 'question', id: loadedQ[0].id });

        // Update central draft map
        setAllModulesDraft(prev => ({
          ...prev,
          [modId]: { questions: loadedQ, questionGroups: loadedG }
        }));
      });
  }, [selectedExamId, activeCategory, currentModule.id]);

  // Helper to update questions state & sync to central draft map + localStorage
  const updateQuestionsAndDraft = (newQuestions: Question[], newGroups?: QuestionGroup[]) => {
    const targetGroups = newGroups !== undefined ? newGroups : questionGroups;
    setQuestions(newQuestions);
    if (newGroups !== undefined) setQuestionGroups(newGroups);

    if (currentModule?.id) {
      const updatedMap = {
        ...allModulesDraft,
        [currentModule.id]: { questions: newQuestions, questionGroups: targetGroups }
      };
      setAllModulesDraft(updatedMap);
      try {
        localStorage.setItem(`caculus_draft_${selectedExamId}`, JSON.stringify(updatedMap));
      } catch (e) {}
    }
  };

  // Helper to update questionGroups state & sync to central draft map + localStorage
  const updateGroupsAndDraft = (newGroups: QuestionGroup[]) => {
    setQuestionGroups(newGroups);
    if (currentModule?.id) {
      const updatedMap = {
        ...allModulesDraft,
        [currentModule.id]: { questions, questionGroups: newGroups }
      };
      setAllModulesDraft(updatedMap);
      try {
        localStorage.setItem(`caculus_draft_${selectedExamId}`, JSON.stringify(updatedMap));
      } catch (e) {}
    }
  };

  // Handle Tab Switch (Auto-save current module edits before switching category)
  const handleSwitchCategory = (newCat: 'math' | 'reading' | 'science') => {
    if (currentModule?.id) {
      // Sync active state into central draft map first
      setAllModulesDraft(prev => ({
        ...prev,
        [currentModule.id]: { questions, questionGroups }
      }));
    }
    setActiveCategory(newCat);
  };

  // Active item objects
  const activeQuestion = activeSelection?.type === 'question' ? questions.find(q => q.id === activeSelection.id) : null;
  const activeGroup = activeSelection?.type === 'group' ? questionGroups.find(g => g.id === activeSelection.id) : null;

  // Add Question
  const handleAddQuestion = (groupId?: string) => {
    const nextNum = questions.length + 1;
    const newQ: Question = {
      id: `q-${activeCategory}-${Date.now()}`,
      moduleId: currentModule.id,
      groupId: groupId || undefined,
      number: nextNum,
      type: 'single_choice',
      text: `Câu hỏi ${nextNum}`,
      imageUrl: '',
      options: [
        { id: 'opt-a', text: 'Đáp án A' },
        { id: 'opt-b', text: 'Đáp án B' },
        { id: 'opt-c', text: 'Đáp án C' },
        { id: 'opt-d', text: 'Đáp án D' }
      ],
      correctOptionId: 'opt-a',
      explanation: '',
      explanationImageUrl: '',
      correctionNote: ''
    };

    let updatedGroups = questionGroups;
    if (groupId) {
      updatedGroups = questionGroups.map(g => g.id === groupId ? { ...g, questionIds: [...g.questionIds, newQ.id] } : g);
    }

    const updatedQ = [...questions, newQ];
    updateQuestionsAndDraft(updatedQ, updatedGroups);
    setActiveSelection({ type: 'question', id: newQ.id });
  };

  // Add Group
  const handleAddGroup = () => {
    const newG: QuestionGroup = {
      id: `group-${activeCategory}-${Date.now()}`,
      moduleId: currentModule.id,
      title: `Bối cảnh / Đọc hiểu mới ${questionGroups.length + 1}`,
      passage: 'Nhập nội dung bối cảnh / đoạn văn đọc hiểu...',
      imageUrl: '',
      questionIds: []
    };

    const updatedGroups = [...questionGroups, newG];
    updateGroupsAndDraft(updatedGroups);
    setActiveSelection({ type: 'group', id: newG.id });
  };

  // Move Question Up/Down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Renumber
    const renumbered = updated.map((q, i) => ({ ...q, number: i + 1 }));
    updateQuestionsAndDraft(renumbered);
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    const updatedQ = questions.filter(q => q.id !== qId);
    const renumbered = updatedQ.map((q, i) => ({ ...q, number: i + 1 }));
    
    const updatedGroups = questionGroups.map(g => ({
      ...g,
      questionIds: g.questionIds.filter(id => id !== qId)
    }));

    updateQuestionsAndDraft(renumbered, updatedGroups);
    if (activeSelection?.id === qId) {
      setActiveSelection(renumbered.length > 0 ? { type: 'question', id: renumbered[0].id } : null);
    }
  };

  // Update Active Question Property
  const handleUpdateActiveQuestion = (field: keyof Question, value: any) => {
    if (!activeQuestion) return;

    const updated = questions.map(q => {
      if (q.id === activeQuestion.id) {
        return { ...q, [field]: value };
      }
      return q;
    });

    updateQuestionsAndDraft(updated);
  };

  // Update Active Group Property
  const handleUpdateActiveGroup = (field: keyof QuestionGroup, value: any) => {
    if (!activeGroup) return;

    const updated = questionGroups.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, [field]: value };
      }
      return g;
    });

    updateGroupsAndDraft(updated);
  };

  // Handle Image Upload File Handler
  const handleImageUpload = (file: File, targetField: 'imageUrl' | 'explanationImageUrl' | 'groupImageUrl') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target?.result as string;
      if (targetField === 'groupImageUrl') {
        handleUpdateActiveGroup('imageUrl', base64Str);
      } else {
        handleUpdateActiveQuestion(targetField, base64Str);
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Preview Navigation (Triggers Auto-Save before router.push)
  const handleLivePreview = async () => {
    await handleSaveChanges();
    sessionStorage.setItem('caculus_draft_questions', JSON.stringify(questions));
    sessionStorage.setItem('caculus_draft_groups', JSON.stringify(questionGroups));
    router.push(`/exams/${selectedExamId}/room?module=${currentModule.id}&preview=true`);
  };

  // Save All Changes to CSDL (Persists all modules)
  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveStatusText('Đang lưu & đồng bộ CSDL...');

    try {
      // 1. Save current active module draft into allModulesDraft
      const currentDraftMap = {
        ...allModulesDraft,
        [currentModule.id]: { questions, questionGroups }
      };

      // Save each module in draft map to CSDL
      for (const modId of Object.keys(currentDraftMap)) {
        const modData = currentDraftMap[modId];
        await fetch('/api/admin/exams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedExamId,
            moduleId: modId,
            questions: modData.questions,
            questionGroups: modData.questionGroups,
          }),
        });
      }

      setSaving(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSaveStatusText(`✓ Đã lưu & đồng bộ CSDL thành công (${timeStr})`);
      setTimeout(() => setSaveStatusText(''), 4000);
    } catch (e) {
      console.error(e);
      setSaving(false);
      setSaveStatusText('Lỗi lưu CSDL!');
    }
  };

  // Search filter
  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.number && q.number.toString().includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      <Navbar />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col max-w-[1700px] w-full mx-auto p-3 sm:p-5 space-y-4">
        
        {/* TOP BAR: EXAM PICKER & ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#d90429] bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                KHÔNG GIAN SOẠN ĐỀ CHUẨN HOÁ TSA
              </span>
              <div className="flex items-center gap-3 mt-1">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 font-black text-slate-900 rounded-xl px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#d90429]"
                >
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3 CATEGORY TABS (TOÁN - ĐỌC HIỂU - KHOA HỌC) */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
              <button
                onClick={() => handleSwitchCategory('math')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeCategory === 'math'
                    ? 'bg-[#d90429] text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Tư duy Toán học
              </button>
              <button
                onClick={() => handleSwitchCategory('reading')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeCategory === 'reading'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Tư duy Đọc hiểu
              </button>
              <button
                onClick={() => handleSwitchCategory('science')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeCategory === 'science'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. Tư duy Khoa học & GQVĐ
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatusText && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl">
                {saveStatusText}
              </span>
            )}

            <button
              onClick={handleLivePreview}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="w-4 h-4 text-amber-400" /> Xem trước bài thi
            </button>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-[#d90429] hover:bg-red-700 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu CSDL...' : 'Lưu tất cả bài thi'}
            </button>

            <button
              onClick={() => {
                alert("🚀 HƯỚNG DẪN ĐẨY ĐỀ LÊN WEB ONLINE:\n\nSau khi bấm 'Lưu tất cả bài thi' ở Local, bạn chỉ cần ra Màn hình chính Desktop và kích kép chuột vào Shortcut:\n\n👉 'ĐẨY ĐỀ LÊN WEB ONLINE.bat'\n\nHệ thống sẽ tự động cập nhật Web Thi trên Vercel cho Học sinh trong vài giây!");
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Upload className="w-4 h-4 text-purple-200" /> Đẩy Đề Lên Web Online
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTENT AREA (COLLAPSIBLE SIDEBAR + CANVAS) */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          
          {/* LEFT SIDEBAR: QUESTION LIST (COLLAPSIBLE FOR MAXIMUM EDITING SPACE) */}
          <div className={`transition-all duration-300 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${
            isSidebarCollapsed ? 'w-14 shrink-0' : 'w-full md:w-80 lg:w-96 shrink-0'
          }`}>
            
            {/* Sidebar Collapse Toggle Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#d90429]" />
                  <span className="font-extrabold text-xs text-slate-900 uppercase">Danh sách câu ({questions.length})</span>
                </div>
              )}

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition mx-auto"
                title={isSidebarCollapsed ? 'Mở rộng danh sách câu hỏi' : 'Thu gọn danh sách'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            {!isSidebarCollapsed && (
              <>
                {/* Search & Quick Actions */}
                <div className="p-3 space-y-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm câu hỏi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#d90429]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleAddQuestion()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Thêm câu
                    </button>
                    {(activeCategory === 'reading' || activeCategory === 'science') && (
                      <button
                        onClick={handleAddGroup}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <FolderPlus className="w-3.5 h-3.5" /> Bối cảnh
                      </button>
                    )}
                  </div>
                </div>

                {/* Items List (Groups + Questions) */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[620px]">
                  {/* Groups */}
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
                    const typeLabel = q.type === 'multiple_choice' ? 'Đúng/Sai (2 cột)' : q.type === 'fill_blank' ? 'Điền từ' : '1 Đáp án';

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
            
            {/* GROUP BỐI CẢNH EDITOR */}
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
                    className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm câu thuộc bối cảnh này
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase">Tiêu đề Bối cảnh / Đọc hiểu</label>
                  <input
                    type="text"
                    value={activeGroup.title || ''}
                    onChange={(e) => handleUpdateActiveGroup('title', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase">Đoạn văn bối cảnh (Hỗ trợ KaTeX LaTeX)</label>
                  <textarea
                    rows={6}
                    value={activeGroup.passage || ''}
                    onChange={(e) => handleUpdateActiveGroup('passage', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm font-serif text-slate-900 leading-relaxed"
                  />
                </div>

                {/* Group Image Upload */}
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                  <label className="block text-xs font-extrabold text-purple-900 uppercase">Hình ảnh đính kèm bối cảnh (Sơ đồ / Biểu đồ / Bảng dữ liệu)</label>
                  {activeGroup.imageUrl ? (
                    <div className="space-y-2">
                      <img src={activeGroup.imageUrl} alt="Group Diagram" className="max-h-60 w-auto rounded-xl border border-purple-200" />
                      <button onClick={() => handleUpdateActiveGroup('imageUrl', '')} className="text-xs text-rose-600 font-bold hover:underline">
                        Xóa ảnh bối cảnh
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => groupImageInputRef.current?.click()}
                      className="bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-purple-700" /> Tải lên ảnh bối cảnh từ máy tính
                    </button>
                  )}
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
              </div>
            )}

            {/* SINGLE QUESTION EDITOR */}
            {activeSelection?.type === 'question' && activeQuestion && (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#d90429] text-white font-black text-base w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs">
                      {activeQuestion.number}
                    </span>
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-lg">Chỉnh sửa Câu {activeQuestion.number}</h2>
                      <span className="text-xs text-slate-500">ID: {activeQuestion.id}</span>
                    </div>
                  </div>

                  {/* Question Type Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Loại câu:</label>
                    <select
                      value={activeQuestion.type || 'single_choice'}
                      onChange={(e) => handleUpdateActiveQuestion('type', e.target.value as any)}
                      className="bg-slate-50 border border-slate-300 font-bold text-xs text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d90429]"
                    >
                      <option value="single_choice">Trắc nghiệm (Chọn 1 đáp án A/B/C/D)</option>
                      <option value="multiple_choice">Đúng / Sai (Bảng chọn 2 cột ĐÚNG - SAI)</option>
                      <option value="fill_blank">Điền đáp án ngắn</option>
                    </select>
                  </div>
                </div>

                {/* 📌 ERRATA CORRECTION NOTE INPUT BOX */}
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2">
                  <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    📌 GHI CHÚ ĐÍNH CHÍNH NẾU CẦN (HIỂN THỊ CẢNH BÁO NỔI BẬT CHO THÍ SINH LÚC LÀM BÀI)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đính chính câu 2: Điều kiện bổ sung là x > 0."
                    value={activeQuestion.correctionNote || ''}
                    onChange={(e) => handleUpdateActiveQuestion('correctionNote', e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                {/* 📷 MAIN QUESTION PROMPT IMAGE */}
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

                  {activeQuestion.imageUrl ? (
                    <div className="space-y-3">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 max-h-96 overflow-auto flex items-center justify-center">
                        <img
                          src={activeQuestion.imageUrl}
                          alt="Đề bài dạng ảnh"
                          className="max-h-80 w-auto object-contain rounded-lg shadow-2xs"
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

                {/* ANSWERS & OPTIONS PICKER */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      Thiết lập Đáp án đúng & Lựa chọn
                    </h3>
                  </div>

                  {/* Single Choice (A/B/C/D) */}
                  {(!activeQuestion.type || activeQuestion.type === 'single_choice') && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['opt-a', 'opt-b', 'opt-c', 'opt-d'].map((optId, idx) => {
                        const label = String.fromCharCode(65 + idx);
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

                  {/* 2-COLUMN TRUE / FALSE SELECTION GRID FOR MULTIPLE CHOICE (ĐÚNG - SAI 2 CỘT) */}
                  {activeQuestion.type === 'multiple_choice' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center justify-between border-b border-slate-200 pb-2">
                        <span>Các ý mệnh đề (a, b, c, d)</span>
                        <div className="flex gap-10 pr-6 font-black text-xs">
                          <span className="text-emerald-700">CỘT 1: ĐÚNG</span>
                          <span className="text-rose-700">CỘT 2: SAI</span>
                        </div>
                      </div>

                      {['opt-a', 'opt-b', 'opt-c', 'opt-d'].map((optId, idx) => {
                        const letter = String.fromCharCode(97 + idx); // a, b, c, d
                        const currentSelected = activeQuestion.correctOptionIds || [];
                        const isTrue = currentSelected.includes(optId);
                        const optionObj = activeQuestion.options?.find(o => o.id === optId) || { id: optId, text: `Ý ${letter}` };

                        return (
                          <div key={optId} className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <input
                                type="text"
                                value={optionObj.text}
                                onChange={(e) => {
                                  const newText = e.target.value;
                                  const newOptions = (activeQuestion.options || []).map(o => o.id === optId ? { ...o, text: newText } : o);
                                  handleUpdateActiveQuestion('options', newOptions);
                                }}
                                placeholder={`Nội dung ý ${letter}...`}
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium"
                              />
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Column 1: ĐÚNG */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSelected = Array.from(new Set([...currentSelected, optId]));
                                  handleUpdateActiveQuestion('correctOptionIds', nextSelected);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                                  isTrue
                                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-emerald-50'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> ĐÚNG
                              </button>

                              {/* Column 2: SAI */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSelected = currentSelected.filter(id => id !== optId);
                                  handleUpdateActiveQuestion('correctOptionIds', nextSelected);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                                  !isTrue
                                    ? 'bg-rose-600 border-rose-700 text-white shadow-xs'
                                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-rose-50'
                                }`}
                              >
                                <X className="w-3.5 h-3.5 stroke-[3]" /> SAI
                              </button>
                            </div>
                          </div>
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

                {/* SOLUTION IMAGE UPLOAD SECTION */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold text-emerald-900 uppercase">
                      Ảnh đáp án & Lời giải chi tiết (Admin tải lên)
                    </label>
                    {activeQuestion.explanationImageUrl && (
                      <button onClick={() => handleUpdateActiveQuestion('explanationImageUrl', '')} className="text-xs text-rose-600 font-bold hover:underline">
                        Xóa ảnh lời giải
                      </button>
                    )}
                  </div>

                  {activeQuestion.explanationImageUrl ? (
                    <div className="space-y-2">
                      <img src={activeQuestion.explanationImageUrl} alt="Solution Diagram" className="max-h-60 w-auto rounded-xl border border-emerald-200" />
                    </div>
                  ) : (
                    <button
                      onClick={() => explanationImageInputRef.current?.click()}
                      className="bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-emerald-700" /> Tải lên ảnh lời giải chi tiết từ máy tính
                    </button>
                  )}
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExamAuthoringEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d90429]"></div>
      </div>
    }>
      <ExamAuthoringEditorContent />
    </Suspense>
  );
}
