'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Exam, ExamModule, Submission } from '@/types';
import { ArrowLeft, Clock, CheckCircle2, PlayCircle, Lock, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { TokenPayload } from '@/lib/auth';

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      });

    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        const found = (data.exams || []).find((e: Exam) => e.id === examId);
        setExam(found || null);
        setSubmissions(data.submissions || []);
        setLoading(false);
      });
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d90429]"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi yêu cầu</h2>
        <Link href="/exams" className="mt-4 text-[#d90429] font-bold underline">Quay lại danh sách</Link>
      </div>
    );
  }

  // Determine Sequential Module Order Status
  const mathMod = exam.modules.find(m => m.category === 'math') || exam.modules[0];
  const readingMod = exam.modules.find(m => m.category === 'reading') || exam.modules[1];
  const scienceMod = exam.modules.find(m => m.category === 'science') || exam.modules[2];

  const mathCompleted = submissions.some(s => s.moduleId === mathMod?.id);
  const readingCompleted = submissions.some(s => s.moduleId === readingMod?.id);
  const scienceCompleted = submissions.some(s => s.moduleId === scienceMod?.id);

  // Next Module to take sequentially
  let nextModuleToTake: ExamModule = mathMod;
  let actionButtonLabel = '🚀 BẮT ĐẦU PHẦN 1: TƯ DUY TOÁN HỌC (60 PHÚT)';

  if (!mathCompleted) {
    nextModuleToTake = mathMod;
    actionButtonLabel = '🚀 BẮT ĐẦU PHẦN 1: TƯ DUY TOÁN HỌC (60 PHÚT)';
  } else if (!readingCompleted) {
    nextModuleToTake = readingMod;
    actionButtonLabel = '🚀 TIẾP TỤC PHẦN 2: TƯ DUY ĐỌC HIỂU (30 PHÚT)';
  } else if (!scienceCompleted) {
    nextModuleToTake = scienceMod;
    actionButtonLabel = '🚀 TIẾP TỤC PHẦN 3: TƯ DUY KHOA HỌC (60 PHÚT)';
  } else {
    nextModuleToTake = mathMod; // Retake from start if all completed
    actionButtonLabel = '🔄 LÀM LẠI TOÀN BỘ BÀI THI TSA CHUẨN HOÁ';
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Main Container mirroring User Screenshot 1 */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center my-6">
        
        {/* White Rounded Portal Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl space-y-8">
          
          {/* Header Banner */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#d90429] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full inline-block">
              HỘI ĐỒNG KHẢO THÍ CHUẨN HOÁ CACULUS
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900">{exam.title}</h1>
            <p className="text-xs text-slate-500 font-medium">Bắt buộc làm đủ 3 phần theo thứ tự: Toán học ➔ Đọc hiểu ➔ Khoa học</p>
          </div>

          {/* Student Identification Info Sub-card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex justify-between items-center text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="text-slate-500 font-medium">Họ và tên thí sinh:</div>
              <div className="font-extrabold text-slate-900 text-base">{user?.name || user?.realName || 'Nguyễn Cường'}</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-slate-500 font-medium">Mã định danh HSSV:</div>
              <div className="font-mono font-black text-[#d90429] text-base">{user?.studentId || 'CACULUS_VIP_001'}</div>
            </div>
          </div>

          {/* Modules Sequential List (LƯỢC BỎ 3 NÚT BẤM NHỎ THEO YÊU CẦU CỦA USER) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#d90429]" />
                DANH SÁCH 3 PHẦN THI CHUẨN HOÁ
              </h2>
              <span className="text-xs font-bold text-slate-500">
                Tiến độ: {[mathCompleted, readingCompleted, scienceCompleted].filter(Boolean).length}/3 phần
              </span>
            </div>

            <div className="space-y-3">
              {/* Part 1: Math */}
              <div className={`p-5 rounded-2xl border-2 transition flex items-center justify-between gap-4 ${
                mathCompleted
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-blue-400 bg-blue-50/20 shadow-2xs'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-blue-700">1. Tư duy Toán học</span>
                    {mathCompleted && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã làm bài
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Thời gian: <strong className="text-slate-800">60 phút</strong> | 40 câu hỏi | Mở kíp: {mathMod?.openTime || '00:00'} - {mathMod?.closeTime || '23:59'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl inline-block ${
                    mathCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-600 text-white shadow-2xs'
                  }`}>
                    {mathCompleted ? '✓ Hoàn thành' : '● Đang làm'}
                  </span>
                </div>
              </div>

              {/* Part 2: Reading */}
              <div className={`p-5 rounded-2xl border-2 transition flex items-center justify-between gap-4 ${
                readingCompleted
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : mathCompleted
                    ? 'border-purple-400 bg-purple-50/20 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 opacity-60'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-purple-800">2. Tư duy Đọc hiểu</span>
                    {readingCompleted ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã làm bài
                      </span>
                    ) : !mathCompleted && (
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Khóa (Cần xong Phần 1)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Thời gian: <strong className="text-slate-800">30 phút</strong> | 20 câu hỏi | Mở kíp: {readingMod?.openTime || '00:00'} - {readingMod?.closeTime || '23:59'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl inline-block ${
                    readingCompleted ? 'bg-emerald-100 text-emerald-800' : mathCompleted ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {readingCompleted ? '✓ Hoàn thành' : mathCompleted ? '● Đang làm' : '🔒 Khóa'}
                  </span>
                </div>
              </div>

              {/* Part 3: Science */}
              <div className={`p-5 rounded-2xl border-2 transition flex items-center justify-between gap-4 ${
                scienceCompleted
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : readingCompleted
                    ? 'border-emerald-400 bg-emerald-50/20 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 opacity-60'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-800">3. Tư duy Khoa học & GQVĐ</span>
                    {scienceCompleted ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã làm bài
                      </span>
                    ) : !readingCompleted && (
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Khóa (Cần xong Phần 2)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Thời gian: <strong className="text-slate-800">60 phút</strong> | 40 câu hỏi | Mở kíp: {scienceMod?.openTime || '00:00'} - {scienceMod?.closeTime || '23:59'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl inline-block ${
                    scienceCompleted ? 'bg-emerald-100 text-emerald-800' : readingCompleted ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {scienceCompleted ? '✓ Hoàn thành' : readingCompleted ? '● Đang làm' : '🔒 Khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🚀 SINGLE LARGE PRIMARY BUTTON AT BOTTOM (DÙNG 1 NÚT DUY NHẤT TO NỔI BẬT) */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <button
              onClick={() => router.push(`/exams/${exam.id}/room?module=${nextModuleToTake?.id || mathMod?.id}`)}
              className="w-full bg-[#d90429] hover:bg-red-700 text-white font-black text-base sm:text-lg py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition transform active:scale-98 flex items-center justify-center gap-3 tracking-wide"
            >
              <span>{actionButtonLabel}</span>
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>

            <p className="text-xs text-slate-500 font-medium">
              * Điểm số của từng phần sẽ được hệ thống tính toán và bảo lưu. Kết quả tổng quát sẽ hiển thị sau khi hoàn thành xong cả 3 phần thi.
            </p>
          </div>

          {/* Back Navigation */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#d90429] transition"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Tổng quan
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
