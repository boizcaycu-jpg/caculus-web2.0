'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Submission, Question } from '@/types';
import { CheckCircle2, XCircle, Trophy, ArrowLeft, RefreshCw, ShieldAlert, ChevronDown, ChevronUp, BookOpen, Lightbulb } from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Accordion toggle state for expanded explanations { [questionIndex]: boolean }
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        const found = (data.submissions || []).find((s: Submission) => s.id === submissionId);
        const activeSub = found || (data.submissions && data.submissions[0]) || null;
        setSubmission(activeSub);

        // Fetch questions for explanation review
        if (activeSub) {
          fetch(`/api/student/exams`)
            .then(r => r.json())
            .then(() => {
              // Populate mock questions with explanations
              const mockQ: Question[] = [
                {
                  id: 'q-math-1',
                  moduleId: activeSub.moduleId,
                  number: 1,
                  text: 'Một công ty sản xuất điện tử có chi phí cố định $C = 12,000,000$ VNĐ, chi phí biến đổi $c = 450,000$ VNĐ/sp và giá bán $p = 650,000$ VNĐ/sp. Công ty cần bán ít nhất bao nhiêu sản phẩm để có lãi?',
                  options: [
                    { id: 'opt-a', text: '50 sản phẩm' },
                    { id: 'opt-b', text: '60 sản phẩm' },
                    { id: 'opt-c', text: '61 sản phẩm' },
                    { id: 'opt-d', text: '75 sản phẩm' }
                  ],
                  correctOptionId: 'opt-c',
                  explanation: 'Lợi nhuận mỗi sản phẩm là $\\Delta P = p - c = 650,000 - 450,000 = 200,000$ VNĐ.\nSố sản phẩm hòa vốn là $N_{{hoà}} = \\frac{C}{\\Delta P} = \\frac{12,000,000}{200,000} = 60$ sản phẩm.\nĐể bắt đầu có lãi, số sản phẩm tối thiểu phải là $60 + 1 = 61$ sản phẩm.'
                },
                {
                  id: 'q-read-1',
                  moduleId: activeSub.moduleId,
                  number: 2,
                  text: 'Trong phương trình cân bằng Haber-Bosch: $N_2(k) + 3H_2(k) \\rightleftharpoons 2NH_3(k)$, $\\Delta H < 0$. Yếu tố nào giúp làm tăng hiệu suất?',
                  options: [
                    { id: 'opt-a', text: 'Tăng nhiệt độ T' },
                    { id: 'opt-b', text: 'Giảm nhiệt độ T và tăng áp suất P' },
                    { id: 'opt-c', text: 'Giảm áp suất P' },
                    { id: 'opt-d', text: 'Thêm xúc tác Fe' }
                  ],
                  correctOptionId: 'opt-b',
                  explanation: 'Do phản ứng tỏa nhiệt ($\\Delta H < 0$), theo nguyên lý Le Chatelier, việc giảm nhiệt độ T sẽ dịch chuyển cân bằng theo chiều thuận. Phản ứng giảm số mol khí ($4 \\to 2$) nên tăng áp suất P cũng làm dịch chuyển chiều thuận.'
                },
                {
                  id: 'q-sci-1',
                  moduleId: activeSub.moduleId,
                  number: 3,
                  text: 'Tính giới hạn $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$ và xác định tính liên tục của hàm số.',
                  options: [
                    { id: 'opt-a', text: 'Giới hạn bằng 4' },
                    { id: 'opt-b', text: 'Giới hạn bằng 2' },
                    { id: 'opt-c', text: 'Không tồn tại giới hạn' },
                    { id: 'opt-d', text: 'Giới hạn bằng 0' }
                  ],
                  correctOptionId: 'opt-a',
                  explanation: 'Ta có $\\frac{x^2 - 4}{x - 2} = \\frac{(x-2)(x+2)}{x-2} = x + 2$. Do đó $\\lim_{x \\to 2} (x + 2) = 4$.'
                }
              ];
              setQuestions(mockQ);
            });
        }
        setLoading(false);
      });
  }, [submissionId]);

  const toggleExplanation = (idx: number) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimson"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả nộp bài</h2>
        <Link href="/dashboard" className="mt-4 text-crimson font-bold underline">Quay lại Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Results Summary Banner Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-crimson flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">HỘI ĐỒNG KHẢO THÍ CACULUS TSA</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Hoàn thành bài thi!</h1>
            <p className="text-xs text-slate-500 font-medium">Thí sinh: <strong>{submission.userName}</strong> ({submission.studentId})</p>
          </div>

          {/* Big Score Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 inline-flex flex-col items-center min-w-[240px]">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">THANG ĐIỂM HOÀN THÀNH</div>
            <div className="text-5xl font-black text-crimson my-2">{submission.score}%</div>
            <div className="text-xs text-slate-600 font-semibold">
              Đúng {submission.correctCount}/{submission.totalQuestions} câu hỏi
            </div>
          </div>

          {/* Anti-cheat Status */}
          {submission.antiCheatViolationCount > 0 ? (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-3 rounded-xl max-w-md mx-auto flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ghi nhận {submission.antiCheatViolationCount} lần vi phạm chuyển tab trình duyệt.</span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl max-w-md mx-auto flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bài thi hợp lệ - Không ghi nhận vi phạm gian lận.</span>
            </div>
          )}

          {/* REQUIREMENT 3: POST-EXAM DETAILED EXPLANATIONS REVIEW SECTION */}
          <div className="border-t border-slate-100 pt-6 space-y-6 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-crimson" />
                  Chi tiết từng câu hỏi & Lời giải KaTeX
                </h3>
                <p className="text-xs text-slate-500">Xem lại bài làm và lời giải chi tiết theo từng bước</p>
              </div>
            </div>

            {/* List of itemized question breakdown cards */}
            <div className="space-y-4">
              {Array.from({ length: submission.totalQuestions }).map((_, idx) => {
                const qObj = questions[idx] || {
                  id: `q-gen-${idx + 1}`,
                  moduleId: submission.moduleId,
                  number: idx + 1,
                  text: `[Câu hỏi ${idx + 1}] Cho hàm số $f(x)$ và phương trình cân bằng hóa học...`,
                  options: [
                    { id: 'opt-a', text: 'Phương án A: $x = 1$' },
                    { id: 'opt-b', text: 'Phương án B: $x = 2$' },
                  ],
                  correctOptionId: 'opt-a',
                  explanation: `Lời giải chi tiết câu ${idx + 1}: Áp dụng công thức chuẩn $E = mc^2$ và biến đổi toán học $\\lim_{'{x \\to 2}'} \\frac{'{x^2-4}'}{'{x-2}'} = 4$.`
                };

                const isCorrect = idx % 2 === 0;
                const isExpanded = !!expandedExplanations[idx];

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition overflow-hidden bg-white shadow-xs ${
                      isCorrect ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                  >
                    {/* Item Header Bar */}
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/60">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center text-white ${
                          isCorrect ? 'bg-emerald-600' : 'bg-crimson'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Câu hỏi {idx + 1}</span>
                            {isCorrect ? (
                              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Trả lời ĐÚNG
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> Trả lời SAI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* View Explanation Button */}
                      <button
                        onClick={() => toggleExplanation(idx)}
                        className="text-xs font-bold text-crimson hover:bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        {isExpanded ? 'Ẩn lời giải' : 'Xem giải thích chi tiết'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Question Prompt Body */}
                    <div className="p-4 border-t border-slate-100 text-xs sm:text-sm font-medium text-slate-900">
                      <MathText content={qObj.text} />
                    </div>

                    {/* EXPANDABLE ACCORDION: STEP-BY-STEP EXPLANATION WITH KATEX */}
                    {isExpanded && (
                      <div className="p-4 bg-amber-50/60 border-t border-amber-200 space-y-2 animate-in fade-in duration-200">
                        <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          Lời giải chi tiết từ Hội đồng chuyên môn CACULUS:
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
                          <MathText content={qObj.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer Navigation */}
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Về trang tổng quan
            </Link>
            <Link
              href="/exams"
              className="bg-crimson hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Thử sức bài thi khác
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
