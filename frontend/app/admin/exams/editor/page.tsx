'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Question, QuestionGroup, Exam } from '@/types';
import { 
  Save, Eye, Upload, Plus, Trash2, ArrowUp, ArrowDown, Search, 
  FileText, CheckSquare, HelpCircle, Layers, Image as ImageIcon,
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, BookOpen, FolderPlus, Calculator, Code
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExamAuthoringEditorPage() {
  const router = useRouter();

  // State
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam-2k9-1');
  const [activeCategory, setActiveCategory] = useState<'math' | 'reading' | 'science'>('math');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  
  // Active item selection
  const [activeSelection, setActiveSelection] = useState<{ type: 'question' | 'group'; id: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live KaTeX Math Preview Toggle
  const [showMathPreview, setShowMathPreview] = useState(true);

  // AI Explanation Generation State
  const [generatingAiExplanation, setGeneratingAiExplanation] = useState(false);

  // TRI-TAB DROPZONE IMPORT MODAL STATE
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'math' | 'reading' | 'science'>('math');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Load Exams
  useEffect(() => {
    fetch('/api/admin/exams')
      .then(res => res.json())
      .then(data => {
        if (data.exams && data.exams.length > 0) {
          setExams(data.exams);
        }
      });
  }, []);

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

  // Load questions & groups for active module from Database API (with sample fallback)
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
          // Sample fallback if module is pristine
          const sampleGroups: QuestionGroup[] = activeCategory !== 'math' ? [
            {
              id: `group-${activeCategory}-1`,
              moduleId: currentModule.id,
              title: `Bối cảnh ${activeCategory === 'reading' ? 'Đọc hiểu 1' : 'Khoa học 1'}`,
              passage: `[Bối cảnh Đọc hiểu / Thí nghiệm Khoa học]
Trong phản ứng tổng hợp Ammonia: $N_2(k) + 3H_2(k) \\rightleftharpoons 2NH_3(k)$, $\\Delta H < 0$.
Giá trị hằng số cân bằng $K_c = \\frac{[NH_3]^2}{[N_2][H_2]^3}$ biến thiên theo nhiệt độ T.`,
              imageUrl: '',
              imageSize: 'medium',
              questionIds: [`q-${activeCategory}-1`, `q-${activeCategory}-2`],
            }
          ] : [];

          const sampleQuestions: Question[] = [
            {
              id: `q-${activeCategory}-1`,
              moduleId: currentModule.id,
              groupId: activeCategory !== 'math' ? `group-${activeCategory}-1` : undefined,
              number: 1,
              type: 'single_choice',
              text: activeCategory === 'math' 
                ? 'Cho hàm số $f(x) = \\frac{x^2 - 4}{x - 2}$. Tính giới hạn $\\lim_{x \\to 2} f(x)$ và xác định giá trị để hàm số liên tục trên $\\mathbb{R}$.'
                : 'Trong phương trình cân bằng $N_2(k) + 3H_2(k) \\rightleftharpoons 2NH_3(k)$, yếu tố nào làm biến thiên $\\Delta H$?',
              options: [
                { id: 'opt-a', text: 'Giới hạn bằng 4, hàm số liên tục tại x = 2' },
                { id: 'opt-b', text: 'Giới hạn bằng 2, $f(2) = 4$' },
                { id: 'opt-c', text: 'Tăng áp suất làm dịch chuyển cân bằng sang phải' },
                { id: 'opt-d', text: 'Nhiệt độ T tăng làm hằng số $K_c$ giảm' }
              ],
              correctOptionId: 'opt-a',
              explanation: 'Biến đổi $\\frac{x^2 - 4}{x - 2} = x + 2$. Khi $x \\to 2$, giới hạn là $2 + 2 = 4$.',
              imageSize: 'medium',
            },
            {
              id: `q-${activeCategory}-2`,
              moduleId: currentModule.id,
              groupId: activeCategory !== 'math' ? `group-${activeCategory}-1` : undefined,
              number: 2,
              type: 'multiple_choice',
              text: 'Cho tích phân $I = \\int_0^1 (2x + 1) dx$. Những phát biểu nào sau đây ĐÚNG?',
              options: [
                { id: 'opt-2a', text: 'Nguyên hàm của $2x + 1$ là $F(x) = x^2 + x$' },
                { id: 'opt-2b', text: 'Giá trị tích phân $I = 2$' },
                { id: 'opt-2c', text: 'Giá trị tích phân $I = 1$' },
                { id: 'opt-2d', text: 'Nếu đổi biến $u = 2x+1$ thì $du = 2dx$' }
              ],
              correctOptionIds: ['opt-2a', 'opt-2b', 'opt-2d'],
              explanation: '$F(1) - F(0) = (1 + 1) - 0 = 2$. Do đó A, B, D đúng.',
            },
            {
              id: `q-${activeCategory}-3`,
              moduleId: currentModule.id,
              number: 3,
              type: 'fill_blank',
              text: 'Biết điện trở $R(T) = \\frac{1000}{1 + 0.05T} \\le 200 \\,\\Omega$. Nhiệt độ tối thiểu $T$ (°C) là bao nhiêu?',
              options: [],
              fillBlankAnswers: ['80', '80.0', 't=80'],
              explanation: '$1000 / (1 + 0.05T) \\le 200 \\Rightarrow 1 + 0.05T \\ge 5 \\Rightarrow T \\ge 80$.',
            }
          ];

          setQuestions(sampleQuestions);
          setQuestionGroups(sampleGroups);
          setActiveSelection({ type: 'question', id: sampleQuestions[0].id });
        }
        setIsDirty(false);
      })
      .catch(e => {
        console.error('Error fetching active module questions:', e);
        setIsDirty(false);
      });
  }, [activeCategory, selectedExamId, currentModule?.id]);

  const activeQuestion = activeSelection?.type === 'question' 
    ? questions.find(q => q.id === activeSelection.id) || questions[0]
    : null;

  const activeGroup = activeSelection?.type === 'group'
    ? questionGroups.find(g => g.id === activeSelection.id)
    : null;

  // TRI-TAB GEMINI 2.5 FLASH PDF PARSER UPLOAD
  const handleFileUpload = async (file: File, targetCategory: 'math' | 'reading' | 'science' = importTab) => {
    setParsingFile(true);
    setImportStatus('✨ Đang gửi tập tin PDF tới Gemini 2.5 Flash API để phân tích...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('moduleId', `mod-${targetCategory}-${selectedExamId}`);
      formData.append('category', targetCategory);

      const res = await fetch('/api/admin/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        setActiveCategory(targetCategory);
        setQuestions(data.questions);
        if (data.questionGroups) setQuestionGroups(data.questionGroups);
        setActiveSelection({ type: 'question', id: data.questions[0].id });
        setIsDirty(true);

        const statusMsg = data.aiPowered
          ? `✨ Gemini 2.5 Flash đã bóc tách thành công ${data.questions.length} câu hỏi phần ${targetCategory.toUpperCase()}!`
          : `Đã bóc tách thành công ${data.questions.length} câu hỏi theo cấu trúc!`;
        setImportStatus(statusMsg);
        setTimeout(() => setShowImportModal(false), 2000);
      } else {
        setImportStatus(data.error || 'Không tìm thấy cấu trúc câu hỏi hợp lệ.');
      }
    } catch (e) {
      console.error(e);
      setImportStatus('Không thể kết nối máy chủ Gemini 2.5 Flash PDF Parser.');
    } finally {
      setParsingFile(false);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], importTab);
    }
  };

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
          questionText: activeQuestion.text,
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
        alert(data.error || 'Không thể tạo lời giải bằng Gemini API');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ Gemini AI');
    } finally {
      setGeneratingAiExplanation(false);
    }
  };

  // Base64 Image Select
  const handleImageFileSelect = (file: File, target: 'question' | 'group') => {
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      if (target === 'question' && activeQuestion) {
        handleUpdateActiveQuestion('imageUrl', base64Url);
      } else if (target === 'group' && activeGroup) {
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

  const handleAddQuestion = (groupId?: string) => {
    const newNum = questions.length + 1;
    const newQ: Question = {
      id: `q-new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      moduleId: currentModule.id,
      groupId,
      number: newNum,
      type: 'single_choice',
      text: `Câu hỏi số ${newNum}: Cho phương trình $f(x) = ...$`,
      options: [
        { id: 'opt-a', text: 'Phương án A: $x = 1$' },
        { id: 'opt-b', text: 'Phương án B: $x = 2$' },
        { id: 'opt-c', text: 'Phương án C: $x = 3$' },
        { id: 'opt-d', text: 'Phương án D: $x = 4$' },
      ],
      correctOptionId: 'opt-a',
      explanation: 'Lời giải chi tiết bằng công thức KaTeX.',
      imageSize: 'medium',
    };

    setQuestions(prev => [...prev, newQ]);
    if (groupId) {
      setQuestionGroups(prev => prev.map(g => g.id === groupId ? { ...g, questionIds: [...g.questionIds, newQ.id] } : g));
    }
    setActiveSelection({ type: 'question', id: newQ.id });
    setIsDirty(true);
  };

  const handleAddQuestionGroup = () => {
    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newGroup: QuestionGroup = {
      id: newGroupId,
      moduleId: currentModule.id,
      title: `Nhóm bối cảnh ${questionGroups.length + 1}`,
      passage: `[Đoạn văn Đọc hiểu / Thí nghiệm Khoa học]\nCho đồ thị năng lượng phản ứng $N_2 + 3H_2 \\rightleftharpoons 2NH_3$...`,
      imageSize: 'medium',
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

  // Live Draft Preview
  const handleLivePreview = () => {
    try {
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

      {/* TOP TOOLBAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-crimson text-white font-black text-xs px-2.5 py-1 rounded-md tracking-wider">
                AUTHORING WORKSPACE v4.0 (Gemini 2.5 Flash AI)
              </span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-slate-800 text-white font-bold text-sm border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-crimson"
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {isDirty ? (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Chưa lưu vào CSDL
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu đồng bộ
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                ✓ Đã lưu CSDL thành công!
              </span>
            )}

            <button
              onClick={() => setShowMathPreview(!showMathPreview)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                showMathPreview ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Calculator className="w-4 h-4" /> Live Math Preview {showMathPreview ? 'BẬT' : 'TẮT'}
            </button>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex-1 sm:flex-initial bg-crimson hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi (Save Changes)'}
            </button>

            <button
              onClick={handleLivePreview}
              className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Xem trước như thí sinh (Live Test Preview)
            </button>
          </div>
        </div>
      </header>

      {/* 3 MANDATORY TSA SECTIONS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center overflow-x-auto">
          <div className="flex gap-2 py-3">
            <button
              onClick={() => setActiveCategory('math')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                activeCategory === 'math'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              1. Tư duy Toán học (40 câu)
            </button>

            <button
              onClick={() => setActiveCategory('reading')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                activeCategory === 'reading'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Tư duy Đọc hiểu (20 câu)
            </button>

            <button
              onClick={() => setActiveCategory('science')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                activeCategory === 'science'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              3. Tư duy Khoa học & GQVĐ (40 câu)
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            AI Tri-Tab PDF Parser (Gemini 2.5 Flash)
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Danh sách câu hỏi & Nhóm bối cảnh
              </h3>
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
                  className="bg-rose-50 text-crimson hover:bg-rose-100 font-bold text-xs px-2 py-1 rounded-lg border border-rose-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> +Câu
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm câu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-crimson"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[650px]">
            {/* Question Groups */}
            {questionGroups.map((g, gIdx) => {
              const isGroupActive = activeSelection?.type === 'group' && activeSelection.id === g.id;

              return (
                <div
                  key={`group-${g.id}-${gIdx}`}
                  className={`p-3 rounded-2xl border-2 transition space-y-2 ${
                    isGroupActive ? 'border-purple-600 bg-purple-50/40 shadow-xs' : 'border-purple-200 bg-purple-50/10 hover:border-purple-300'
                  }`}
                >
                  <div
                    onClick={() => setActiveSelection({ type: 'group', id: g.id })}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span className="font-extrabold text-xs text-purple-900">
                        {g.title || `Bối cảnh ${gIdx + 1}`}
                      </span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {g.questionIds.length} câu con
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-2 italic font-serif">
                    <MathText content={g.passage} />
                  </div>
                </div>
              );
            })}

            {/* Questions */}
            {filteredQuestions.map((q, idx) => {
              const isQActive = activeSelection?.type === 'question' && activeSelection.id === q.id;
              const typeLabel = q.type === 'multiple_choice' ? 'Nhiều đ/án' : q.type === 'fill_blank' ? 'Điền từ' : '1 Đáp án';

              return (
                <div
                  key={`q-${q.id}-${idx}`}
                  onClick={() => setActiveSelection({ type: 'question', id: q.id })}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-2 relative group ${
                    isQActive
                      ? 'border-crimson bg-rose-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white font-extrabold text-xs w-6 h-6 rounded-md flex items-center justify-center">
                        {q.number || idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        q.type === 'multiple_choice'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : q.type === 'fill_blank'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {typeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'up'); }}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'down'); }}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                        className="p-1 text-slate-400 hover:text-crimson"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                    <MathText content={q.text} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: RICH KATEX EDITOR & GEMINI AI EXPLANATION */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 overflow-y-auto max-h-[750px]">
          
          {/* GROUP EDITOR */}
          {activeSelection?.type === 'group' && activeGroup && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="bg-purple-100 text-purple-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  BỐI CẢNH / ĐOẠN VĂN ĐỌC HIỂU (KATEX MATH ENABLED)
                </span>
                <h2 className="font-extrabold text-slate-900 text-xl mt-2">{activeGroup.title}</h2>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Tiêu đề bối cảnh
                </label>
                <input
                  type="text"
                  value={activeGroup.title || ''}
                  onChange={(e) => handleUpdateGroup('title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Nội dung bối cảnh / Đoạn văn (Hỗ trợ KaTeX & LaTeX Formulas: $E=mc^2$) *
                </label>
                <textarea
                  rows={6}
                  value={activeGroup.passage || ''}
                  onChange={(e) => handleUpdateGroup('passage', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-serif text-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
                />
              </div>

              {showMathPreview && activeGroup.passage && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    Hiển thị công thức Toán/Khoa học KaTeX xem trước:
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 text-sm">
                    <MathText content={activeGroup.passage} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUESTION EDITOR */}
          {activeSelection?.type === 'question' && activeQuestion && (
            <>
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-crimson text-white font-black text-base px-3.5 py-1.5 rounded-xl shadow-xs">
                    Câu {activeQuestion.number}
                  </span>
                  <div className="space-y-0.5">
                    <h2 className="font-extrabold text-slate-900 text-lg">Trình soạn thảo KaTeX & Đáp án</h2>
                    <p className="text-xs text-slate-500">Hỗ trợ LaTeX formulas ($...$), công thức Hóa học & Bảng Markdown</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Dạng câu hỏi:</span>
                  <select
                    value={activeQuestion.type || 'single_choice'}
                    onChange={(e) => handleUpdateActiveQuestion('type', e.target.value)}
                    className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-crimson"
                  >
                    <option value="single_choice">Trắc nghiệm (1 đáp án A/B/C/D)</option>
                    <option value="multiple_choice">Chọn nhiều đáp án đúng</option>
                    <option value="fill_blank">Điền từ / Số / Phân số (Fill-in-the-blank)</option>
                  </select>
                </div>
              </div>

              {/* Question Prompt Editor */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex justify-between items-center">
                  <span>{"Nội dung đề bài (Hỗ trợ LaTeX: $\\frac{a}{b}$, $\\sqrt{x}$, $\\Delta H$) *"}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{"Ví dụ: $f(x) = \\lim_{x \\to 2} \\frac{x^2-4}{x-2}$"}</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập đề bài..."
                  value={activeQuestion.text}
                  onChange={(e) => handleUpdateActiveQuestion('text', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-900 focus:outline-none focus:border-crimson transition"
                />

                {showMathPreview && activeQuestion.text && (
                  <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-crimson text-[11px] uppercase tracking-wider block">
                      Xem trước hiển thị đề bài KaTeX:
                    </span>
                    <div className="text-slate-900 font-medium bg-white p-2.5 rounded-lg border border-rose-100">
                      <MathText content={activeQuestion.text} />
                    </div>
                  </div>
                )}
              </div>

              {/* Question Image & Diagram Attachment Tool */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-crimson" />
                    Đính kèm hình ảnh câu hỏi / Sơ đồ khoa học
                  </label>
                  {activeQuestion.imageUrl && (
                    <button
                      onClick={() => handleUpdateActiveQuestion('imageUrl', '')}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Dán URL hình ảnh (ví dụ: https://... hoặc /uploads/diagram.png)"
                    value={activeQuestion.imageUrl || ''}
                    onChange={(e) => handleUpdateActiveQuestion('imageUrl', e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-crimson"
                  />
                  <label className="bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs px-3 py-2 rounded-xl text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5 text-crimson" /> Tải từ máy tính
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageFileSelect(e.target.files[0], 'question')}
                    />
                  </label>
                </div>

                {activeQuestion.imageUrl && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Kích thước hiển thị:</span>
                      <div className="flex gap-1.5">
                        {(['small', 'medium', 'large', 'full'] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => handleUpdateActiveQuestion('imageSize', sz)}
                            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase transition ${
                              (activeQuestion.imageSize || 'medium') === sz
                                ? 'bg-crimson text-white'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {sz === 'small' ? 'Nhỏ' : sz === 'medium' ? 'Vừa' : sz === 'large' ? 'Lớn' : 'Full'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden">
                      <img
                        src={activeQuestion.imageUrl}
                        alt="Question Preview"
                        className={`object-contain max-h-64 rounded-lg ${
                          activeQuestion.imageSize === 'small' ? 'w-1/3' : activeQuestion.imageSize === 'large' ? 'w-3/4' : activeQuestion.imageSize === 'full' ? 'w-full' : 'w-1/2'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Options Editor */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Phương án A/B/C/D & KaTeX Formulas
                </h4>

                {(activeQuestion.type === 'single_choice' || !activeQuestion.type) && (
                  <div className="space-y-3">
                    {activeQuestion.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = activeQuestion.correctOptionId === opt.id;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleUpdateActiveQuestion('correctOptionId', opt.id)}
                              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition ${
                                isCorrect
                                  ? 'bg-crimson text-white ring-2 ring-rose-500 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                              }`}
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                              className={`flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-crimson ${
                                isCorrect ? 'border-crimson bg-rose-50/30' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          {showMathPreview && opt.text && (
                            <div className="pl-11 text-xs text-slate-700">
                              <MathText content={opt.text} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeQuestion.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {activeQuestion.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const currentSelected = activeQuestion.correctOptionIds || [];
                      const isCorrect = currentSelected.includes(opt.id);

                      const toggleMultiple = () => {
                        let nextIds: string[];
                        if (isCorrect) {
                          nextIds = currentSelected.filter(id => id !== opt.id);
                        } else {
                          nextIds = [...currentSelected, opt.id];
                        }
                        handleUpdateActiveQuestion('correctOptionIds', nextIds);
                      };

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleMultiple}
                              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition ${
                                isCorrect
                                  ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                              }`}
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                              className={`flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-500 ${
                                isCorrect ? 'border-purple-400 bg-purple-50/30' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          {showMathPreview && opt.text && (
                            <div className="pl-11 text-xs text-slate-700">
                              <MathText content={opt.text} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeQuestion.type === 'fill_blank' && (
                  <div className="space-y-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                    <label className="block text-xs font-bold text-amber-900 uppercase">
                      Danh sách kết quả đúng chấp nhận (Phân tách bằng dấu phẩy):
                    </label>
                    <input
                      type="text"
                      placeholder="80, 80.0, 80.00, t=80"
                      value={(activeQuestion.fillBlankAnswers || []).join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleUpdateActiveQuestion('fillBlankAnswers', vals);
                      }}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* REQUIREMENT 3: AI EXPLANATION GENERATOR WITH GEMINI BUTTON */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Lời giải chi tiết (Explanation)
                  </label>
                  
                  <button
                    onClick={handleGenerateAiExplanation}
                    disabled={generatingAiExplanation}
                    className="bg-crimson hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    {generatingAiExplanation ? 'Gemini 2.5 Flash đang suy luận...' : '✨ AI tạo lời giải (Gemini 2.5 Flash)'}
                  </button>
                </div>

                <textarea
                  rows={4}
                  placeholder="Giải thích từng bước cho học sinh (Hỗ trợ công thức KaTeX $...$)..."
                  value={activeQuestion.explanation || ''}
                  onChange={(e) => handleUpdateActiveQuestion('explanation', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-crimson transition leading-relaxed"
                />
                
                {showMathPreview && activeQuestion.explanation && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider block">
                      Xem trước Lời giải KaTeX:
                    </span>
                    <div className="text-slate-800 font-serif bg-white p-2.5 rounded-lg border border-slate-200">
                      <MathText content={activeQuestion.explanation} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* REQUIREMENT 1: TRI-TAB DROPZONE IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Tri-Tab PDF Parser (Gemini 2.5 Flash)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {/* 3 Dedicated Section Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => setImportTab('math')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  importTab === 'math' ? 'bg-crimson text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Toán học
              </button>
              <button
                onClick={() => setImportTab('reading')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  importTab === 'reading' ? 'bg-crimson text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Đọc hiểu
              </button>
              <button
                onClick={() => setImportTab('science')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  importTab === 'science' ? 'bg-crimson text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Khoa học & GQVĐ
              </button>
            </div>

            {/* Dedicated Dropzone per Tab */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDropFile}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                isDraggingFile ? 'border-crimson bg-rose-50' : 'border-slate-300 hover:border-crimson hover:bg-slate-50'
              }`}
            >
              <Upload className="w-10 h-10 text-crimson animate-bounce" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Kéo thả tập tin PDF cho phần: {importTab === 'math' ? '1. Tư duy Toán học' : importTab === 'reading' ? '2. Tư duy Đọc hiểu' : '3. Tư duy Khoa học & GQVĐ'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">Tự động nhận diện công thức KaTeX & hình ảnh sơ đồ bằng Gemini 2.5 Flash</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx,.md,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], importTab);
                }}
              />
            </div>

            {importStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                importStatus.includes('thành công') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
