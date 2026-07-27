'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, QuestionGroup, ExamModule, UserAnswer } from '@/types';
import MathText from '@/components/ui/MathText';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, ShieldAlert, ArrowLeft, Eye, Layers, FileText } from 'lucide-react';
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

  const [antiCheatViolations, setAntiCheatViolations] = useState(0);
  const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Anti-cheat detector
  useEffect(() => {
    if (isPreview) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAntiCheatViolations((prev) => {
          const count = prev + 1;
          logAntiCheatEvent('tab_switch', `Thí sinh chuyển tab (Lần ${count})`);
          return count;
        });
        setShowAntiCheatModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPreview]);

  const logAntiCheatEvent = async (eventType: string, details: string) => {
    try {
      await fetch('/api/student/anticheat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  const handleSingleSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleMultipleSelect = (optionId: string) => {
    if (!currentQuestion) return;
    const currentList: string[] = Array.isArray(userAnswers[currentQuestion.id])
      ? userAnswers[currentQuestion.id]
      : [];

    let updated: string[];
    if (currentList.includes(optionId)) {
      updated = currentList.filter(id => id !== optionId);
    } else {
      updated = [...currentList, optionId];
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }));
  };

  const handleFillBlankChange = (val: string) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAutoSubmit = () => {
    executeSubmission();
  };

  const executeSubmission = async () => {
    if (isPreview) {
      alert('Đang trong chế độ xem trước (Draft Preview). Bài làm không được lưu vào CSDL.');
      setShowSubmitModal(false);
      return;
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
          antiCheatViolationCount: antiCheatViolations,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* Draft Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-amber-600">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-950 animate-bounce" />
            <span>CHẾ ĐỘ XEM TRƯỚC DRAFT PREVIEW (Bài thi chưa ghi vào CSDL chính thức)</span>
          </div>
          <button
            onClick={() => router.push('/admin/exams/editor')}
            className="bg-amber-950 text-white hover:bg-black font-bold px-3 py-1 rounded-md transition flex items-center gap-1 text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Trình soạn thảo Admin
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-crimson font-black text-2xl tracking-tighter">TSA</span>
            <span className="font-bold text-slate-800 text-base hidden sm:inline">
              Kíp thi {module.title.replace(/^\d+\.\s*/, '')} {isPreview ? '[DRAFT PREVIEW]' : '- NỘI BỘ'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Máy chủ trực tuyến
          </span>
          {antiCheatViolations > 0 && !isPreview && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              Cảnh báo tab: {antiCheatViolations}
            </span>
          )}
        </div>
      </header>

      {/* Main Split Screen Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] w-full mx-auto p-3 sm:p-6 gap-6">
        
        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Persistent Passage Context Container */}
            {activePassageText && (
              <div className="bg-slate-50 border border-slate-300 p-5 rounded-2xl text-slate-800 text-sm leading-relaxed space-y-4 shadow-xs sticky top-0 z-10 max-h-96 overflow-y-auto">
                <div className="font-extrabold text-xs uppercase tracking-wider text-crimson flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {currentGroup?.title || 'Bối cảnh / Đoạn văn đọc hiểu (KaTeX Math Enabled)'}
                  </span>
                </div>

                <div className="font-serif text-slate-900 text-sm sm:text-base leading-relaxed">
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
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4">
                <span className="bg-slate-900 text-white font-black px-3.5 py-1.5 rounded-xl text-base min-w-[3rem] text-center border border-slate-800 shadow-xs">
                  {currentQuestion?.number || currentIndex + 1}
                </span>
                <div className="space-y-2 pt-1 flex-1">
                  <div className="flex items-center gap-2">
                    {qType === 'multiple_choice' && (
                      <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-purple-200">
                        Chọn nhiều đáp án đúng
                      </span>
                    )}
                    {qType === 'fill_blank' && (
                      <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                        Điền đáp án (Số / Phân số / Chuỗi)
                      </span>
                    )}
                    {qType === 'single_choice' && (
                      <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-blue-200">
                        Chọn 1 đáp án đúng
                      </span>
                    )}
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    <MathText content={currentQuestion?.text} />
                  </h2>
                </div>
              </div>

              {/* Question Image */}
              {currentQuestion?.imageUrl && !activePassageImage && (
                <div className="pl-0 sm:pl-16 pt-2">
                  <div className={`rounded-xl border border-slate-200 p-2 bg-slate-50 overflow-hidden ${getImageSizeClass(currentQuestion.imageSize)}`}>
                    <img
                      src={currentQuestion.imageUrl}
                      alt={`Minh họa câu ${currentQuestion.number}`}
                      className="w-full h-auto rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Single Choice Options */}
              {qType === 'single_choice' && (
                <div className="pl-0 sm:pl-16 space-y-3 pt-2">
                  {currentQuestion?.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = userAnswers[currentQuestion.id] === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSingleSelect(opt.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-crimson bg-rose-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-crimson text-white shadow-xs'
                              : 'bg-rose-50 text-crimson border border-rose-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-medium text-slate-800 flex-1">
                          <MathText content={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice Options */}
              {qType === 'multiple_choice' && (
                <div className="pl-0 sm:pl-16 space-y-3 pt-2">
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
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-medium text-slate-800 flex-1">
                          <MathText content={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the Blank Input */}
              {qType === 'fill_blank' && (
                <div className="pl-0 sm:pl-16 space-y-3 pt-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Nhập kết quả của thí sinh:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 80 hoặc 2.5 hoặc 5/2"
                      value={userAnswers[currentQuestion.id] || ''}
                      onChange={(e) => handleFillBlankChange(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
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
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-1 transition shadow-xs"
              >
                Câu tiếp <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs sm:text-sm">
              <span>Thời gian làm câu hiện tại</span>
              <span className="bg-white border border-slate-300 font-mono font-bold text-slate-800 px-3 py-1 rounded-md">
                {formatQuestionTime(questionSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: QUESTION STATE INDICATORS GRID */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col gap-5">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
              Thông tin thí sinh
            </h3>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Họ tên</span>
                <span className="font-bold text-slate-900">{studentName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Mã dự thi</span>
                <span className="font-mono font-bold text-slate-800">{studentId}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Thời gian còn lại</span>
                <span className={`font-mono font-extrabold text-xl sm:text-2xl ${globalSeconds < 300 ? 'text-crimson animate-pulse' : 'text-slate-900'}`}>
                  {formatTime(globalSeconds)}
                </span>
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-crimson hover:bg-rose-700 text-white font-black px-6 py-2.5 rounded-lg text-sm transition shadow-md hover:shadow-lg transform active:scale-95"
              >
                Nộp bài
              </button>
            </div>
          </div>

          {/* REQUIREMENT 2: QUESTION STATE INDICATORS GRID */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  DANH SÁCH CÂU HỎI ({questions.length} CÂU)
                </h4>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Chưa làm
                  </span>
                  <span className="flex items-center gap-1 text-crimson">
                    <span className="w-2.5 h-2.5 rounded-full bg-crimson"></span> Đã làm
                  </span>
                </div>
              </div>

              {/* Grid Buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const val = userAnswers[q.id];
                  const isAttempted = Array.isArray(val) ? val.length > 0 : !!val && String(val).trim() !== '';
                  const isActive = idx === currentIndex;

                  // State styling:
                  // Unattempted: White/Gray background
                  // Attempted: Solid Crimson background
                  // Active: Distinct visual ring/border scale
                  let btnStyle = 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300';
                  if (isAttempted) {
                    btnStyle = 'bg-crimson text-white font-bold border-rose-700 shadow-xs';
                  }

                  let activeRing = '';
                  if (isActive) {
                    activeRing = 'ring-4 ring-slate-900 border-slate-900 scale-105 font-extrabold z-10 shadow-md';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-10 h-10 rounded-full text-xs transition-all flex items-center justify-center mx-auto border ${btnStyle} ${activeRing}`}
                    >
                      {q.number || idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Completion Progress Bar */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Đã hoàn thành</span>
                <span className="font-bold text-slate-900">
                  {answeredCount}/{questions.length} câu - {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-crimson h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-crimson flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {isPreview ? 'Nộp bài thử nghiệm (Draft Preview)' : 'Xác nhận nộp bài thi?'}
              </h3>
              <p className="text-sm text-slate-600">
                Bạn đã trả lời <strong className="text-slate-900">{answeredCount}/{questions.length}</strong> câu hỏi.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition"
              >
                Làm tiếp
              </button>
              <button
                onClick={executeSubmission}
                disabled={isSubmitting}
                className="flex-1 bg-crimson hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
