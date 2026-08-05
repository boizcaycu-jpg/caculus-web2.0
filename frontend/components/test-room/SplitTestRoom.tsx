'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, QuestionGroup, ExamModule, UserAnswer } from '@/types';
import MathText from '@/components/ui/MathText';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, ShieldAlert, ArrowLeft, Eye, Layers, FileText, Sparkles, Check, X, Coffee } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplitTestRoomProps {
  examId: string;
  module: ExamModule;
  questions: Question[];
  questionGroups?: QuestionGroup[];
  studentName: string;
  studentId: string;
}

export default function SplitTestRoom({
  examId,
  module,
  questions: initialQuestions,
  questionGroups: initialGroups = [],
  studentName,
  studentId,
}: SplitTestRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>(initialGroups);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [globalSeconds, setGlobalSeconds] = useState(module.durationMinutes * 60);

  // Out-Web Warning Popup Modal State (Counter Removed as requested)
  const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 30-Second Rest Break State between sequential modules
  const [showRestBreakModal, setShowRestBreakModal] = useState(false);
  const [restBreakSeconds, setRestBreakSeconds] = useState(30);
  const [restBreakNextModuleId, setRestBreakNextModuleId] = useState<string>('');
  const [restBreakNextTitle, setRestBreakNextTitle] = useState<string>('');

  // Synchronize state whenever module or initialQuestions props change
  useEffect(() => {
    setQuestions(initialQuestions);
    setQuestionGroups(initialGroups);
    setCurrentIndex(0);
    setUserAnswers({});
    setQuestionSeconds(0);
    setGlobalSeconds(module.durationMinutes * 60);
  }, [module.id, initialQuestions, initialGroups]);

  // Load preview draft state
  useEffect(() => {
    if (isPreview) {
      try {
        const draftQStr = sessionStorage.getItem('caculus_draft_questions');
        const draftGStr = sessionStorage.getItem('caculus_draft_groups');

        if (draftQStr) {
          const parsedQ = JSON.parse(draftQStr);
          if (Array.isArray(parsedQ) && parsedQ.length > 0) {
            setQuestions(parsedQ);
          }
        }
        if (draftGStr) {
          const parsedG = JSON.parse(draftGStr);
          if (Array.isArray(parsedG)) {
            setQuestionGroups(parsedG);
          }
        }
      } catch (e) {
        console.error('Failed to load draft preview state:', e);
      }
    }
  }, [isPreview]);

  const currentQuestion = questions[currentIndex] || questions[0];
  const qType = currentQuestion?.type || 'single_choice';

  const currentGroup = questionGroups.find(g => 
    g.id === currentQuestion?.groupId || 
    g.questionIds?.includes(currentQuestion?.id || '')
  );

  const activePassageText = currentGroup?.passage || currentQuestion?.passage;
  const activePassageImage = currentGroup?.imageUrl || (currentQuestion?.passage ? currentQuestion?.imageUrl : undefined);
  const activePassageImageSize = currentGroup?.imageSize || currentQuestion?.imageSize || 'medium';

  // Global Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setGlobalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isPreview) handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPreview]);

  // Individual Question Timer
  useEffect(() => {
    setQuestionSeconds(0);
    const qTimer = setInterval(() => {
      setQuestionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(qTimer);
  }, [currentIndex]);

  // 30-Second Rest Break Countdown Timer
  useEffect(() => {
    if (!showRestBreakModal) return;

    const breakTimer = setInterval(() => {
      setRestBreakSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(breakTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breakTimer);
  }, [showRestBreakModal]);

  // Out-Web Anti-cheat detector (shows modal warning popup when focus is lost)
  useEffect(() => {
    if (isPreview) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAntiCheatEvent('tab_switch', 'Thí sinh rời khỏi màn hình/chuyển tab');
        setShowAntiCheatModal(true);
      }
    };

    const handleWindowBlur = () => {
      logAntiCheatEvent('window_blur', 'Thí sinh mất tập trung cửa sổ làm bài');
      setShowAntiCheatModal(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isPreview]);

  const logAntiCheatEvent = (eventType: 'tab_switch' | 'window_blur' | 'fullscreen_exit', details?: string) => {
    try {
      fetch('/api/student/anticheat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentId,
          userName: studentName,
          studentId,
          examId,
          moduleId: module.id,
          eventType,
          details,
        }),
      });
    } catch (e) {
      console.error('Anti-cheat log error:', e);
    }
  };

  const handleSingleSelect = (optId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optId,
    }));
  };

  const handleMultipleSelect = (optId: string) => {
    const currentList: string[] = Array.isArray(userAnswers[currentQuestion.id])
      ? userAnswers[currentQuestion.id]
      : [];

    const updated = currentList.includes(optId)
      ? currentList.filter((id) => id !== optId)
      : [...currentList, optId];

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }));
  };

  const handleFillBlankChange = (val: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const handleSubmit = async (isAuto = false) => {
    if (isSubmitting) return;

    if (!isAuto && answeredCount < questions.length) {
      const confirmSubmit = confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp phần thi này không?`);
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    const answersList: UserAnswer[] = Object.entries(userAnswers).map(([qId, val]) => ({
      questionId: qId,
      selectedOptionId: typeof val === 'string' ? val : undefined,
      selectedOptionIds: Array.isArray(val) ? val : undefined,
      fillBlankValue: typeof val === 'string' && qType === 'fill_blank' ? val : undefined,
      timeSpentSeconds: 30,
    }));

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          moduleId: module.id,
          answers: answersList,
          antiCheatViolationCount: 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Fetch Exam Modules to determine Sequential Rest Break Flow (Math -> Reading -> Science)
        const examRes = await fetch(`/api/student/exams?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
        const foundExam = (examRes.exams || []).find((e: any) => e.id === examId);

        if (foundExam && foundExam.modules) {
          const mathMod = foundExam.modules.find((m: any) => m.category === 'math');
          const readingMod = foundExam.modules.find((m: any) => m.category === 'reading');
          const scienceMod = foundExam.modules.find((m: any) => m.category === 'science');

          if (module.category === 'math' && readingMod) {
            setRestBreakNextModuleId(readingMod.id);
            setRestBreakNextTitle('Phần 2: Tư duy Đọc hiểu (30 Phút)');
            setShowRestBreakModal(true);
            setIsSubmitting(false);
            return;
          } else if (module.category === 'reading' && scienceMod) {
            setRestBreakNextModuleId(scienceMod.id);
            setRestBreakNextTitle('Phần 3: Tư duy Khoa học & GQVĐ (60 Phút)');
            setShowRestBreakModal(true);
            setIsSubmitting(false);
            return;
          }
        }

        // All 3 parts completed -> Navigate to Final Total Results
        router.push(`/results/${data.submission.id}`);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi nộp bài');
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ để nộp bài');
      setIsSubmitting(false);
    }
  };

  const handleStartNextModuleFromRestBreak = () => {
    setShowRestBreakModal(false);
    router.push(`/exams/${examId}/room?module=${restBreakNextModuleId}`);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatQuestionTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).filter(k => {
    const v = userAnswers[k];
    if (Array.isArray(v)) return v.length > 0;
    return !!v && String(v).trim() !== '';
  }).length;
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);

  const getImageSizeClass = (size?: string) => {
    switch (size) {
      case 'small': return 'max-w-xs mx-auto';
      case 'medium': return 'max-w-md mx-auto';
      case 'large': return 'max-w-2xl mx-auto';
      case 'full': default: return 'w-full max-w-full';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-900">
      
      {/* Draft Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-extrabold flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-amber-600">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-950 animate-bounce" />
            <span>CHẾ ĐỘ XEM TRƯỚC PREVIEW (Chưa ghi nhận điểm chính thức)</span>
          </div>
          <button
            onClick={() => router.push(`/admin/exams/editor?id=${examId}`)}
            className="bg-amber-950 text-white hover:bg-black font-extrabold px-3 py-1 rounded-md transition flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Trình soạn thảo Admin
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#d90429] text-white font-black text-2xl tracking-tighter px-3 py-0.5 rounded-lg shadow-xs">
              TSA
            </span>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg hidden sm:inline">
              Kíp thi {module.title.replace(/^\d+\.\s*/, '')} {isPreview ? '[PREVIEW]' : '- CHUẨN HOÁ'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Máy chủ khảo thí trực tuyến CACULUS
          </span>
        </div>
      </header>

      {/* Main Split Screen Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] w-full mx-auto p-3 sm:p-6 gap-6">
        
        {/* LEFT PANEL: QUESTION PROMPT & ANSWERS */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-6">
            
            {/* Persistent Passage Context Container */}
            {activePassageText && (
              <div className="bg-purple-50/50 border border-purple-200 p-5 sm:p-6 rounded-2xl text-slate-800 text-sm leading-relaxed space-y-4 shadow-2xs sticky top-0 z-10 max-h-96 overflow-y-auto">
                <div className="font-extrabold text-xs uppercase tracking-wider text-purple-900 flex items-center justify-between border-b border-purple-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" />
                    {currentGroup?.title || 'Bối cảnh / Đoạn văn đọc hiểu'}
                  </span>
                </div>

                <div className="font-serif text-slate-900 text-base sm:text-lg leading-relaxed">
                  <MathText content={activePassageText} />
                </div>

                {activePassageImage && (
                  <div className={`pt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 ${getImageSizeClass(activePassageImageSize)}`}>
                    <img src={activePassageImage} alt="Diagram" className="w-full h-auto rounded-lg object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Question Heading & Prompt */}
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4">
                <span className="bg-[#d90429] text-white font-black px-4 py-2 rounded-2xl text-lg sm:text-xl min-w-[3.5rem] text-center border border-red-700 shadow-sm shrink-0">
                  {currentQuestion?.number || currentIndex + 1}
                </span>
                <div className="space-y-2 pt-1 flex-1">
                  <div className="flex items-center gap-2">
                    {qType === 'multiple_choice' && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-lg border border-purple-200">
                        Nhiều đáp án (Chọn Đúng/Sai từng ý)
                      </span>
                    )}
                    {qType === 'fill_blank' && (
                      <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">
                        Điền đáp án (Số / Phân số / Chuỗi ngắn)
                      </span>
                    )}
                    {qType === 'single_choice' && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-lg border border-blue-200">
                        Trắc nghiệm (Chọn 1 đáp án A/B/C/D)
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    <MathText content={currentQuestion?.text} />
                  </h2>
                </div>
              </div>

              {/* 📷 QUESTION IMAGE PROMPT */}
              {currentQuestion?.imageUrl && !activePassageImage && (
                <div className="pt-2">
                  <div className="rounded-2xl border-2 border-slate-200 p-3 bg-slate-50 overflow-hidden shadow-xs">
                    <img
                      src={currentQuestion.imageUrl}
                      alt={`Minh họa câu ${currentQuestion.number}`}
                      className="w-full h-auto rounded-xl object-contain max-h-[480px] mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Single Choice Options (A/B/C/D) */}
              {qType === 'single_choice' && (
                <div className="space-y-3.5 pt-3">
                  {currentQuestion?.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = userAnswers[currentQuestion.id] === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSingleSelect(opt.id)}
                        className={`w-full text-left p-5 sm:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-[#d90429] bg-rose-50/70 shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[#d90429] text-white shadow-xs'
                              : 'bg-rose-50 text-[#d90429] border border-rose-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-800 flex-1">
                          <MathText content={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice Options (True/False) */}
              {qType === 'multiple_choice' && (
                <div className="space-y-3.5 pt-3">
                  {currentQuestion?.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const selectedList: string[] = Array.isArray(userAnswers[currentQuestion.id])
                      ? userAnswers[currentQuestion.id]
                      : [];
                    const isSelected = selectedList.includes(opt.id);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleMultipleSelect(opt.id)}
                        className={`w-full text-left p-5 sm:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-800 flex-1">
                          <MathText content={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the Blank Input */}
              {qType === 'fill_blank' && (
                <div className="space-y-3 pt-3">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 space-y-3">
                    <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                      Nhập kết quả làm bài của thí sinh:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 80 hoặc 2.5 hoặc 5/2"
                      value={userAnswers[currentQuestion.id] || ''}
                      onChange={(e) => handleFillBlankChange(e.target.value)}
                      className="w-full bg-white border border-amber-400 rounded-xl px-5 py-4 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* EXPLANATION SECTION (ONLY VISIBLE IN ADMIN PREVIEW MODE) */}
              {(isPreview && (currentQuestion?.explanation || currentQuestion?.explanationImageUrl)) && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-[#d90429] flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Lời giải chi tiết & Đáp án (ADMIN PREVIEW)
                      </span>
                    </div>

                    {currentQuestion?.explanation && (
                      <div className="text-sm font-medium text-slate-800 leading-relaxed font-serif">
                        <MathText content={currentQuestion.explanation} />
                      </div>
                    )}

                    {currentQuestion?.explanationImageUrl && (
                      <div className="pt-2">
                        <img
                          src={currentQuestion.explanationImageUrl}
                          alt="Ảnh lời giải chi tiết"
                          className="max-h-80 w-auto object-contain rounded-xl border border-slate-200 shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Left Panel Fixed Bottom Toolbar */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevQuestion}
                disabled={currentIndex === 0}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-extrabold px-5 py-3 rounded-xl text-sm flex items-center gap-1 transition shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" /> Câu trước
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="bg-slate-900 hover:bg-black disabled:opacity-40 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center gap-1 transition shadow-md"
              >
                Câu tiếp <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm">
              <span>Thời gian làm câu hiện tại:</span>
              <span className="bg-white border border-slate-300 font-mono font-black text-slate-900 px-3.5 py-1.5 rounded-lg shadow-2xs">
                {formatQuestionTime(questionSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: QUESTION STATE GRID & SUBMIT */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col gap-5 shrink-0">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
              Thông tin thí sinh & Thời gian
            </h3>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Họ và tên:</span>
                <span className="font-extrabold text-slate-900">{studentName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Mã dự thi:</span>
                <span className="font-mono font-bold text-slate-800">{studentId}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Thời gian còn lại</span>
                <span className={`font-mono font-black text-2xl ${globalSeconds < 300 ? 'text-[#d90429] animate-pulse' : 'text-slate-900'}`}>
                  {formatTime(globalSeconds)}
                </span>
              </div>

              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="bg-[#d90429] hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl text-sm transition shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          </div>

          {/* Question Grid Map */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex-1 overflow-y-auto max-h-[420px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase">Danh sách câu hỏi ({questions.length} câu)</h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Đã làm: {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-black text-xs transition flex items-center justify-center border-2 ${
                      isCurrent
                        ? 'border-[#d90429] bg-rose-50 text-[#d90429] shadow-xs'
                        : isAnswered
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {q.number || idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 🚨 OUT-WEB WARNING POPUP MODAL (COUNTER REMOVED AS REQUESTED) */}
      {showAntiCheatModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-4 border-rose-600 max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-rose-700 uppercase tracking-tight">
                CẢNH BÁO VI PHẠM NỘI QUY THI!
              </h3>
              <p className="text-sm text-slate-700 font-bold leading-relaxed">
                Hệ thống giám sát phát hiện bạn vừa rời khỏi màn hình làm bài thi.
              </p>
              <p className="text-xs text-rose-600 font-medium">
                Vui lòng không chuyển tab hoặc mở ứng dụng khác trong quá trình làm bài.
              </p>
            </div>

            <button
              onClick={() => setShowAntiCheatModal(false)}
              className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-4 rounded-2xl text-base transition shadow-md"
            >
              Tôi đã hiểu & Quay lại làm bài ngay
            </button>
          </div>
        </div>
      )}

      {/* 🌿 30-SECOND REST BREAK SCREEN BETWEEN SEQUENTIAL MODULES */}
      {showRestBreakModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Coffee className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
                NHẬN ĐIỂM SỐ & NGHỈ NGƠI TỰ ĐỘNG
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Đã hoàn thành phần thi!
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Hệ thống đã tính điểm và ghi nhớ kết quả phần thi này của bạn vào CSDL. Hãy nghỉ ngơi 30 giây để chuẩn bị tốt nhất cho phần thi tiếp theo.
              </p>
            </div>

            {/* 30s Countdown Timer Display */}
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-1 shadow-md">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Thời gian nghỉ thư giãn</div>
              <div className="font-mono text-4xl font-black text-amber-400">
                00:{restBreakSeconds.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Primary Action Button to Start Next Module */}
            <button
              onClick={handleStartNextModuleFromRestBreak}
              className="w-full bg-[#d90429] hover:bg-red-700 text-white font-black py-4 rounded-2xl text-base transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <span>🚀 BẮT ĐẦU: {restBreakNextTitle}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
