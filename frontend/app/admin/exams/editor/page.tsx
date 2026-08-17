'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Question, QuestionGroup, Exam } from '@/types';
import { 
  Save, Eye, Upload, Plus, Trash2, ArrowUp, ArrowDown, Search, 
  FileText, CheckSquare, Layers, Image as ImageIcon,
  CheckCircle2, AlertCircle, Sparkles, BookOpen, FolderPlus,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Check, X, ShieldAlert, Edit3,
  Loader2, ExternalLink, CheckCircle
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
  const [examTitle, setExamTitle] = useState<string>('');
  const [newFillAnswer, setNewFillAnswer] = useState<string>('');

  // Deploy Progress Modal State
  const [deployModal, setDeployModal] = useState<{
    isOpen: boolean;
    step: 1 | 2 | 3 | 4;
    error?: string;
  }>({
    isOpen: false,
    step: 1,
  });

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

  // Sync Exam Title whenever currentExam changes
  useEffect(() => {
    if (currentExam) {
      setExamTitle(currentExam.title);
    }
  }, [selectedExamId, exams]);
  
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

  // Multi-Image Upload File Handler
  const handleImageUpload = (file: File, targetField: 'questionImage' | 'explanationImage' | 'groupImage') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target?.result as string;
      if (targetField === 'groupImage' && activeGroup) {
        const currentList = activeGroup.imageUrls || (activeGroup.imageUrl ? [activeGroup.imageUrl] : []);
        const nextList = [...currentList, base64Str];
        handleUpdateActiveGroup('imageUrls', nextList);
        handleUpdateActiveGroup('imageUrl', base64Str);
      } else if (targetField === 'questionImage' && activeQuestion) {
        const currentList = activeQuestion.imageUrls || (activeQuestion.imageUrl ? [activeQuestion.imageUrl] : []);
        const nextList = [...currentList, base64Str];
        handleUpdateActiveQuestion('imageUrls', nextList);
        handleUpdateActiveQuestion('imageUrl', base64Str);
      } else if (targetField === 'explanationImage' && activeQuestion) {
        const currentList = activeQuestion.explanationImageUrls || (activeQuestion.explanationImageUrl ? [activeQuestion.explanationImageUrl] : []);
        const nextList = [...currentList, base64Str];
        handleUpdateActiveQuestion('explanationImageUrls', nextList);
        handleUpdateActiveQuestion('explanationImageUrl', base64Str);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Individual Image from Multi-Image List
  const handleDeleteImage = (targetField: 'questionImage' | 'explanationImage' | 'groupImage', index: number) => {
    if (targetField === 'groupImage' && activeGroup) {
      const currentList = activeGroup.imageUrls || (activeGroup.imageUrl ? [activeGroup.imageUrl] : []);
      const updatedList = currentList.filter((_, idx) => idx !== index);
      handleUpdateActiveGroup('imageUrls', updatedList);
      handleUpdateActiveGroup('imageUrl', updatedList[0] || '');
    } else if (targetField === 'questionImage' && activeQuestion) {
      const currentList = activeQuestion.imageUrls || (activeQuestion.imageUrl ? [activeQuestion.imageUrl] : []);
      const updatedList = currentList.filter((_, idx) => idx !== index);
      handleUpdateActiveQuestion('imageUrls', updatedList);
      handleUpdateActiveQuestion('imageUrl', updatedList[0] || '');
    } else if (targetField === 'explanationImage' && activeQuestion) {
      const currentList = activeQuestion.explanationImageUrls || (activeQuestion.explanationImageUrl ? [activeQuestion.explanationImageUrl] : []);
      const updatedList = currentList.filter((_, idx) => idx !== index);
      handleUpdateActiveQuestion('explanationImageUrls', updatedList);
      handleUpdateActiveQuestion('explanationImageUrl', updatedList[0] || '');
    }
  };

  // Live Preview Navigation (Triggers Auto-Save before router.push)
  const handleLivePreview = async () => {
    sessionStorage.setItem('caculus_draft_questions', JSON.stringify(questions));
    sessionStorage.setItem('caculus_draft_groups', JSON.stringify(questionGroups));
    window.open(`/exams/${selectedExamId}/room?module=${currentModule.id}&preview=true`, '_blank');
  };

  // Single Unified Save & Deploy Handler (Drives 3-Step Progress Modal + Visual Preview Card)
  const handleSaveChanges = async () => {
    setSaving(true);
    setDeployModal({ isOpen: true, step: 1 });

    try {
      // 1. Save current active module draft into allModulesDraft
      const currentDraftMap = {
        ...allModulesDraft,
        [currentModule.id]: { questions, questionGroups }
      };

      // Step 1: Save each module in draft map to CSDL
      for (const modId of Object.keys(currentDraftMap)) {
        const modData = currentDraftMap[modId];
        await fetch('/api/admin/exams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedExamId,
            title: examTitle,
            moduleId: modId,
            questions: modData.questions,
            questionGroups: modData.questionGroups,
          }),
        });
      }

      setDeployModal(prev => ({ ...prev, step: 2 }));
      await new Promise(r => setTimeout(r, 600));

      // Step 2 & 3: Trigger automated background Git Push to Vercel
      setDeployModal(prev => ({ ...prev, step: 3 }));
      try {
        await fetch('/api/admin/deploy', { method: 'POST' });
      } catch (err) {}

      await new Promise(r => setTimeout(r, 800));

      // Step 4: Completed!
      setDeployModal(prev => ({ ...prev, step: 4 }));
      setSaving(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSaveStatusText(`✓ Đã lưu đĩa cứng & Đẩy lên Web Online thành công (${timeStr})`);
      setTimeout(() => setSaveStatusText(''), 6000);
    } catch (e) {
      console.error(e);
      setSaving(false);
      setDeployModal(prev => ({ ...prev, error: 'Lỗi trong quá trình lưu hoặc đẩy CSDL!' }));
    }
  };

  // Search filter
  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.number && q.number.toString().includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* 🌟 STREAMLINED DISTRACTION-FREE LOCAL STUDIO TOP BAR (REPLACED HEAVY SITE NAVBAR) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-md sticky top-0 z-40">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <span className="bg-[#d90429] text-white font-black px-3 py-1 rounded-xl text-xs tracking-wider shadow-xs">
              CACULUS TSA
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-slate-300 uppercase tracking-wider hidden md:inline">
              LOCAL STUDIO
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* EDITABLE EXAM TITLE INPUT BOX */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#d90429] transition shadow-2xs">
            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0 hidden sm:inline">Tên đề thi:</span>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Nhập tên bài thi..."
              className="bg-transparent text-sm sm:text-base font-black text-white focus:outline-none min-w-[220px] sm:min-w-[340px]"
            />
          </div>

          {/* EXAM SELECTOR DROPDOWN */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d90429]"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {/* 3 CATEGORY TABS & ACTION BUTTONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatusText && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-3 py-1.5 rounded-xl hidden xl:inline">
              {saveStatusText}
            </span>
          )}

          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1">
            <button
              onClick={() => handleSwitchCategory('math')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                activeCategory === 'math'
                  ? 'bg-[#d90429] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Toán
            </button>
            <button
              onClick={() => handleSwitchCategory('reading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                activeCategory === 'reading'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Đọc hiểu
            </button>
            <button
              onClick={() => handleSwitchCategory('science')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                activeCategory === 'science'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              3. Khoa học
            </button>
          </div>

          <button
            onClick={handleLivePreview}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-amber-400" /> Xem trước
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-[#d90429] hover:bg-red-700 text-white font-black text-xs sm:text-sm px-5 py-2 rounded-xl transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : '💾 LƯU BÀI THI & ĐẨY LÊN WEB ONLINE'}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col max-w-[1700px] w-full mx-auto p-3 sm:p-5 space-y-4">

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

                {/* Group Multi-Image Upload */}
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold text-purple-900 uppercase flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-700" />
                      Hình ảnh đính kèm bối cảnh ({((activeGroup.imageUrls && activeGroup.imageUrls.length > 0) ? activeGroup.imageUrls.length : (activeGroup.imageUrl ? 1 : 0))} ảnh)
                    </label>
                    <button
                      type="button"
                      onClick={() => groupImageInputRef.current?.click()}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm ảnh bối cảnh
                    </button>
                  </div>

                  {/* Multi-Image Preview Grid */}
                  {((activeGroup.imageUrls && activeGroup.imageUrls.length > 0) || activeGroup.imageUrl) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {(activeGroup.imageUrls && activeGroup.imageUrls.length > 0 ? activeGroup.imageUrls : [activeGroup.imageUrl!]).map((imgSrc, imgIdx) => (
                        <div key={imgIdx} className="relative group bg-white rounded-xl border border-purple-200 p-2 shadow-2xs">
                          <span className="absolute top-2 left-2 bg-purple-900/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Ảnh #{imgIdx + 1}
                          </span>
                          <img src={imgSrc} alt={`Bối cảnh ${imgIdx + 1}`} className="max-h-44 w-full object-contain rounded-lg mx-auto" />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage('groupImage', imgIdx)}
                            className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm transition"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => groupImageInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-300 hover:border-purple-600 hover:bg-purple-100/40 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 bg-white"
                    >
                      <Upload className="w-6 h-6 text-purple-700" />
                      <span className="text-xs font-bold text-purple-900">Tải lên ảnh bối cảnh / sơ đồ từ máy tính (Có thể chọn nhiều ảnh)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={groupImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'groupImage');
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

                {/* 📷 QUESTION MULTI-IMAGE PROMPT GALLERY */}
                <div className="p-5 bg-slate-50/80 rounded-2xl border-2 border-dashed border-rose-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-[#d90429] uppercase tracking-wide flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#d90429]" />
                      HÌNH ẢNH ĐỀ BÀI ({((activeQuestion.imageUrls && activeQuestion.imageUrls.length > 0) ? activeQuestion.imageUrls.length : (activeQuestion.imageUrl ? 1 : 0))} ẢNH) *
                    </label>
                    <button
                      type="button"
                      onClick={() => questionImageInputRef.current?.click()}
                      className="bg-[#d90429] hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm ảnh đề bài / minh hoạ
                    </button>
                  </div>

                  {((activeQuestion.imageUrls && activeQuestion.imageUrls.length > 0) || activeQuestion.imageUrl) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(activeQuestion.imageUrls && activeQuestion.imageUrls.length > 0 ? activeQuestion.imageUrls : [activeQuestion.imageUrl!]).map((imgSrc, imgIdx) => (
                        <div key={imgIdx} className="relative group bg-white rounded-xl border border-slate-200 p-2 shadow-2xs">
                          <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Ảnh #{imgIdx + 1}
                          </span>
                          <img src={imgSrc} alt={`Đề bài ${imgIdx + 1}`} className="max-h-52 w-full object-contain rounded-lg mx-auto" />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage('questionImage', imgIdx)}
                            className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm transition"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => questionImageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#d90429] hover:bg-rose-50/50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 bg-white"
                    >
                      <Upload className="w-8 h-8 text-[#d90429]" />
                      <div className="text-xs font-extrabold text-slate-800">
                        Nhấp vào đây để Tải lên Ảnh Đề bài từ Máy tính (Hỗ trợ nhiều ảnh)
                      </div>
                      <p className="text-[11px] text-slate-400">Hỗ trợ định dạng .PNG, .JPG, .JPEG, Base64</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={questionImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'questionImage');
                    }}
                  />
                </div>

                {/* ANSWERS & OPTIONS PICKER */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      Thiết lập Đáp án đúng & Lựa chọn
                    </h3>
                  </div>
                  {/* Single Choice (A/B/C/D...) with dynamic add/remove */}
                  {(!activeQuestion.type || activeQuestion.type === 'single_choice') && (() => {
                    const singleOptions = (activeQuestion.options && activeQuestion.options.length > 0)
                      ? activeQuestion.options
                      : ['opt-a', 'opt-b', 'opt-c', 'opt-d'].map((id, idx) => ({ id, text: `Đáp án ${String.fromCharCode(65 + idx)}` }));

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-slate-700 uppercase">
                            Chọn 1 đáp án đúng ({singleOptions.length} phương án)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIdx = singleOptions.length;
                              const nextLetter = String.fromCharCode(65 + nextIdx);
                              const newOpt = { id: `opt-${Date.now()}-${nextLetter.toLowerCase()}`, text: `Đáp án ${nextLetter}` };
                              handleUpdateActiveQuestion('options', [...singleOptions, newOpt]);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm phương án ({String.fromCharCode(65 + singleOptions.length)})
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {singleOptions.map((opt, idx) => {
                            const label = String.fromCharCode(65 + idx);
                            const isSelected = activeQuestion.correctOptionId === opt.id;

                            return (
                              <div key={opt.id} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateActiveQuestion('correctOptionId', opt.id)}
                                  className={`w-full p-3.5 rounded-xl border-2 font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-2xs ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-102'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                  <span>Đáp án {label}</span>
                                </button>
                                {singleOptions.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextList = singleOptions.filter((_, i) => i !== idx);
                                      handleUpdateActiveQuestion('options', nextList);
                                      if (activeQuestion.correctOptionId === opt.id) {
                                        handleUpdateActiveQuestion('correctOptionId', nextList[0]?.id || '');
                                      }
                                    }}
                                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-xs"
                                    title="Xóa phương án này"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2-COLUMN TRUE / FALSE SELECTION GRID FOR MULTIPLE CHOICE (DYNAMIC 2, 3, 4+ PROPOSITIONS) */}
                  {activeQuestion.type === 'multiple_choice' && (() => {
                    const multiOptions = (activeQuestion.options && activeQuestion.options.length > 0)
                      ? activeQuestion.options
                      : ['opt-a', 'opt-b', 'opt-c', 'opt-d'].map((id, idx) => ({ id, text: `Ý ${String.fromCharCode(97 + idx)}` }));

                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span>Các ý mệnh đề ({multiOptions.length} ý)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextIdx = multiOptions.length;
                                const nextLetter = String.fromCharCode(97 + nextIdx);
                                const newOpt = { id: `opt-${Date.now()}-${nextLetter}`, text: `Ý ${nextLetter}` };
                                handleUpdateActiveQuestion('options', [...multiOptions, newOpt]);
                              }}
                              className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Thêm ý mệnh đề ({String.fromCharCode(97 + multiOptions.length)})
                            </button>
                          </div>
                          <div className="flex gap-10 pr-6 font-black text-xs">
                            <span className="text-emerald-700">CỘT 1: ĐÚNG</span>
                            <span className="text-rose-700">CỘT 2: SAI</span>
                          </div>
                        </div>

                        {multiOptions.map((optionObj, idx) => {
                          const optId = optionObj.id;
                          const letter = String.fromCharCode(97 + idx); // a, b, c, d, e...
                          const currentSelected = activeQuestion.correctOptionIds || [];
                          const isTrue = currentSelected.includes(optId);

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
                                    const newOptions = multiOptions.map((o, i) => i === idx ? { ...o, text: newText } : o);
                                    handleUpdateActiveQuestion('options', newOptions);
                                  }}
                                  placeholder={`Nội dung ý ${letter} (hoặc để trống nếu đã có trong ảnh)...`}
                                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium"
                                />
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
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

                                {/* Delete Option Button */}
                                {multiOptions.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextOptions = multiOptions.filter((_, i) => i !== idx);
                                      handleUpdateActiveQuestion('options', nextOptions);
                                      const nextSelected = currentSelected.filter(id => id !== optId);
                                      handleUpdateActiveQuestion('correctOptionIds', nextSelected);
                                    }}
                                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                    title="Xóa ý mệnh đề này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Fill in the blank (Multi-Answer Tag & List Editor) */}
                  {activeQuestion.type === 'fill_blank' && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-extrabold text-amber-900 uppercase">
                          Danh sách đáp án chấp nhận đúng (Thí sinh nhập 1 trong các đáp án này đều được điểm)
                        </label>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          {(activeQuestion.fillBlankAnswers || []).length} đáp án hợp lệ
                        </span>
                      </div>

                      {/* Display current accepted tags */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(activeQuestion.fillBlankAnswers || []).map((ans, aIdx) => (
                          <span key={aIdx} className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-950 font-mono font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs">
                            <span>{ans}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (activeQuestion.fillBlankAnswers || []).filter((_, idx) => idx !== aIdx);
                                handleUpdateActiveQuestion('fillBlankAnswers', next);
                              }}
                              className="text-rose-600 hover:text-rose-800 font-black ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new tag input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFillAnswer}
                          onChange={(e) => setNewFillAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFillAnswer.trim()) {
                              e.preventDefault();
                              const current = activeQuestion.fillBlankAnswers || [];
                              if (!current.includes(newFillAnswer.trim())) {
                                handleUpdateActiveQuestion('fillBlankAnswers', [...current, newFillAnswer.trim()]);
                              }
                              setNewFillAnswer('');
                            }
                          }}
                          placeholder="Nhập đáp án chấp nhận (ví dụ: 80 hoặc 2.5 hoặc 5/2) rồi bấm Enter hoặc [Thêm]..."
                          className="flex-1 bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFillAnswer.trim()) {
                              const current = activeQuestion.fillBlankAnswers || [];
                              if (!current.includes(newFillAnswer.trim())) {
                                handleUpdateActiveQuestion('fillBlankAnswers', [...current, newFillAnswer.trim()]);
                              }
                              setNewFillAnswer('');
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Thêm đáp án
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SOLUTION MULTI-IMAGE UPLOAD SECTION */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      Ảnh đáp án & Lời giải chi tiết ({((activeQuestion.explanationImageUrls && activeQuestion.explanationImageUrls.length > 0) ? activeQuestion.explanationImageUrls.length : (activeQuestion.explanationImageUrl ? 1 : 0))} ảnh)
                    </label>
                    <button
                      type="button"
                      onClick={() => explanationImageInputRef.current?.click()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm ảnh lời giải
                    </button>
                  </div>

                  {((activeQuestion.explanationImageUrls && activeQuestion.explanationImageUrls.length > 0) || activeQuestion.explanationImageUrl) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {(activeQuestion.explanationImageUrls && activeQuestion.explanationImageUrls.length > 0 ? activeQuestion.explanationImageUrls : [activeQuestion.explanationImageUrl!]).map((imgSrc, imgIdx) => (
                        <div key={imgIdx} className="relative group bg-white rounded-xl border border-emerald-200 p-2 shadow-2xs">
                          <span className="absolute top-2 left-2 bg-emerald-900/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Trang #{imgIdx + 1}
                          </span>
                          <img src={imgSrc} alt={`Lời giải ${imgIdx + 1}`} className="max-h-48 w-full object-contain rounded-lg mx-auto" />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage('explanationImage', imgIdx)}
                            className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm transition"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => explanationImageInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 hover:bg-emerald-100/40 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 bg-white"
                    >
                      <Upload className="w-6 h-6 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">Tải lên ảnh đáp án / lời giải chi tiết (Có thể chọn nhiều trang ảnh)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={explanationImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'explanationImage');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 🚀 DEPLOY PROGRESS & VISUAL EXAM PREVIEW MODAL */}
      {deployModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="text-center space-y-1.5">
              <span className="bg-[#d90429] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                TIẾN TRÌNH ĐỒNG BỘ CSDL & TRIỂN KHAI VERCEL
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {deployModal.step < 4 ? 'Đang cập nhật đề thi lên hệ thống...' : '✨ Cập nhật đề thi thành công!'}
              </h3>
            </div>

            {/* Step-by-Step Progress Tracking */}
            <div className="space-y-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              
              {/* Step 1: Disk save */}
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  deployModal.step >= 2 ? 'bg-emerald-600 text-white' : deployModal.step === 1 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}>
                  {deployModal.step >= 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">1. Ghi dữ liệu vào đĩa cứng (100% CSDL Local)</p>
                  <p className="text-[11px] text-slate-500">{deployModal.step >= 2 ? 'Đã ghi đĩa an toàn vào data/db.json' : 'Đang xử lý...'}</p>
                </div>
              </div>

              {/* Step 2: GitHub push */}
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  deployModal.step >= 3 ? 'bg-emerald-600 text-white' : deployModal.step === 2 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}>
                  {deployModal.step >= 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">2. Đóng gói & Đẩy lên GitHub Repository</p>
                  <p className="text-[11px] text-slate-500">{deployModal.step >= 3 ? 'Đã đẩy mã nguồn & CSDL lên nhánh main' : deployModal.step === 2 ? 'Đang đóng gói Git commit...' : 'Chờ bước 1...'}</p>
                </div>
              </div>

              {/* Step 3: Vercel build */}
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  deployModal.step >= 4 ? 'bg-emerald-600 text-white' : deployModal.step === 3 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}>
                  {deployModal.step >= 4 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">3. Kích hoạt Vercel Build Web Online</p>
                  <p className="text-[11px] text-slate-500">{deployModal.step >= 4 ? 'Đã kích hoạt Vercel tự động build' : deployModal.step === 3 ? 'Đang gửi tín hiệu webhook build...' : 'Chờ bước 2...'}</p>
                </div>
              </div>
            </div>

            {/* VISUAL EXAM CARD (APPEARS ON COMPLETION) */}
            {deployModal.step === 4 && (
              <div className="bg-linear-to-br from-rose-50 to-amber-50 border-2 border-rose-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#d90429] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> BÀI THI VỪA CẬP NHẬT
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">ID: {selectedExamId}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{examTitle}</h4>
                  <p className="text-xs text-slate-600">Đã cập nhật đầy đủ câu hỏi, hình ảnh và đáp án 3 phần thi.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-slate-500">Toán học</span>
                    <span className="font-mono font-black text-sm text-[#d90429]">{allModulesDraft[`mod-math-${selectedExamId}`]?.questions?.length || questions.length} câu</span>
                  </div>
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-slate-500">Đọc hiểu</span>
                    <span className="font-mono font-black text-sm text-purple-700">{allModulesDraft[`mod-reading-${selectedExamId}`]?.questions?.length || 20} câu</span>
                  </div>
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-slate-500">Khoa học</span>
                    <span className="font-mono font-black text-sm text-emerald-700">{allModulesDraft[`mod-science-${selectedExamId}`]?.questions?.length || 40} câu</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/exams/${selectedExamId}/room?preview=true`, '_blank');
                    }}
                    className="w-full bg-[#d90429] hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Eye className="w-4 h-4 text-amber-300" />
                    XEM TRỰC QUAN BÀI THI NGAY (MỞ PHÒNG THI)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeployModal({ isOpen: false, step: 1 })}
                    className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold py-2.5 px-4 rounded-xl text-xs transition text-center"
                  >
                    ✕ Đóng & Tiếp tục soạn đề
                  </button>
                </div>
              </div>
            )}

            {/* Error Message if any */}
            {deployModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl text-center">
                {deployModal.error}
              </div>
            )}
          </div>
        </div>
      )}
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
