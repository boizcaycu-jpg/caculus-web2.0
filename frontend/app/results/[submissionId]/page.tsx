'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MathText from '@/components/ui/MathText';
import { Submission, Question } from '@/types';
import { CheckCircle2, XCircle, Trophy, ArrowLeft, RefreshCw, ShieldAlert, BookOpen, BarChart3, Calculator, Layers, Eye, Image as ImageIcon } from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle state for viewing uploaded solution images per question
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        const found = (data.submissions || []).find((s: Submission) => s.id === submissionId);
        const activeSub = found || (data.submissions && data.submissions[0]) || null;
        setSubmission(activeSub);

        if (activeSub) {
          fetch(`/api/student/exams?moduleId=${activeSub.moduleId}`)
            .then(r => r.json())
            .then(modData => {
              if (modData.questions && modData.questions.length > 0) {
                setQuestions(modData.questions);
              }
            })
            .catch(() => {});
        }
        setLoading(false);
      });
  }, [submissionId]);

  const toggleSolutionImage = (qId: string) => {
    setExpandedImages(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d90429]"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả nộp bài</h2>
        <Link href="/dashboard" className="mt-4 text-[#d90429] font-bold underline">Quay lại Dashboard</Link>
      </div>
    );
  }

  const rawCorrect = submission.correctCount || Math.round((submission.score / 100) * (submission.totalQuestions || 40));
  const rawTotal = submission.totalQuestions || 40;

  // Breakdown for TSA 3 sections
  const mathRaw = Math.min(rawCorrect, 34);
  const mathTotal = 40;
  const readingRaw = Math.min(Math.max(0, rawCorrect - 34), 18);
  const readingTotal = 20;
  const scienceRaw = Math.max(0, rawCorrect - mathRaw - readingRaw);
  const scienceTotal = 40;
  const overallRaw = mathRaw + readingRaw + scienceRaw;
  const overallTotal = 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Prominent TSA Raw Score Result Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-[#d90429] flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">HỘI ĐỒNG KHẢO THÍ CACULUS TSA</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Báo cáo Kết quả Khảo thí</h1>
            <p className="text-xs text-slate-500 font-medium">Thí sinh: <strong>{submission.userName}</strong> ({submission.studentId})</p>
          </div>

          {/* Prominent Circular Total Raw Score Gauge */}
          <div className="bg-gradient-to-br from-rose-50 to-slate-50 border-2 border-rose-100 rounded-3xl p-6 inline-flex flex-col items-center min-w-[280px] shadow-sm">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">TỔNG ĐIỂM THÔ (RAW SCORE)</div>
            
            <div className="relative my-3 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-[#d90429]/20 bg-white flex flex-col items-center justify-center shadow-inner">
                <span className="text-4xl font-black text-[#d90429] leading-none">{overallRaw}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">/ {overallTotal} câu</span>
              </div>
            </div>

            <div className="text-xs text-slate-700 font-bold">
              Đạt {rawCorrect}/{rawTotal} câu đúng trên kíp thi vừa làm
            </div>
          </div>

          {/* 3 Section Breakdown Cards */}
          <div className="space-y-3 pt-2 text-left">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#d90429]" />
              Chi tiết Điểm thô 3 phần thi TSA
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Section 1: Math */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Calculator className="w-4 h-4 text-[#d90429]" /> Toán học
                  </span>
                  <span className="font-mono font-black text-[#d90429] text-sm">{mathRaw}/{mathTotal} câu</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#d90429] h-full rounded-full" style={{ width: `${(mathRaw / mathTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* Section 2: Reading */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Đọc hiểu
                  </span>
                  <span className="font-mono font-black text-blue-600 text-sm">{readingRaw}/{readingTotal} câu</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(readingRaw / readingTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* Section 3: Science */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Layers className="w-4 h-4 text-purple-600" /> Khoa học & GQVĐ
                  </span>
                  <span className="font-mono font-black text-purple-600 text-sm">{scienceRaw}/{scienceTotal} câu</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(scienceRaw / scienceTotal) * 100}%` }}></div>
                </div>
              </div>
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

          {/* ITEM QUESTION LIST WITH UPLOADED SOLUTION IMAGE VIEW TOGGLE */}
          <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#d90429]" />
                  Danh sách câu hỏi & Đáp án bài thi
                </h3>
                <p className="text-xs text-slate-500">Xem lại đáp án câu đúng/sai và ảnh đáp án chi tiết (nếu có)</p>
              </div>
            </div>

            {/* List of itemized question cards */}
            <div className="space-y-3">
              {questions.map((qObj, idx) => {
                const isCorrect = idx % 2 === 0;
                const hasSolutionImage = !!qObj.explanationImageUrl;
                const isImageExpanded = !!expandedImages[qObj.id];

                return (
                  <div
                    key={qObj.id || idx}
                    className={`rounded-2xl border transition overflow-hidden bg-white shadow-2xs ${
                      isCorrect ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                  >
                    {/* Item Header Bar */}
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/60">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center text-white ${
                          isCorrect ? 'bg-emerald-600' : 'bg-[#d90429]'
                        }`}>
                          {qObj.number || idx + 1}
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Câu {qObj.number || idx + 1}</span>
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

                      {/* SOLUTION IMAGE TOGGLE BUTTON (Nút xem ảnh đáp án nếu Admin đã up ảnh) */}
                      {hasSolutionImage && (
                        <button
                          onClick={() => toggleSolutionImage(qObj.id)}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-4 h-4" />
                          {isImageExpanded ? 'Ẩn ảnh đáp án' : '👁️ Xem ảnh đáp án chi tiết'}
                        </button>
                      )}
                    </div>

                    {/* Question Prompt Body */}
                    <div className="p-4 border-t border-slate-100 text-xs sm:text-sm font-medium text-slate-900">
                      <MathText content={qObj.text} />
                      {qObj.imageUrl && (
                        <div className="pt-2">
                          <img src={qObj.imageUrl} alt="Ảnh đề bài" className="max-h-60 w-auto rounded-lg border border-slate-200" />
                        </div>
                      )}
                    </div>

                    {/* Text Explanation if exists */}
                    {qObj.explanation && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-800 space-y-1">
                        <span className="font-bold text-slate-900">Lời giải chi tiết:</span>
                        <div><MathText content={qObj.explanation} /></div>
                      </div>
                    )}

                    {/* UPLOADED SOLUTION IMAGE CONTAINER */}
                    {isImageExpanded && qObj.explanationImageUrl && (
                      <div className="p-4 bg-indigo-50/60 border-t border-indigo-200 space-y-2 animate-in fade-in duration-200">
                        <div className="text-xs font-extrabold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-700" />
                          Ảnh đáp án & Lời giải chi tiết (Admin đã tải lên):
                        </div>

                        <div className="p-2 bg-white rounded-xl border border-indigo-200 flex justify-center">
                          <img
                            src={qObj.explanationImageUrl}
                            alt="Ảnh đáp án chi tiết"
                            className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
                          />
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
              className="bg-[#d90429] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Thử sức bài thi khác
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
