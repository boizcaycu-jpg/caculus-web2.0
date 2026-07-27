'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Exam, ExamModule, Submission } from '@/types';
import { ArrowLeft, Clock, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimson"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi yêu cầu</h2>
        <Link href="/exams" className="mt-4 text-crimson font-bold underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Main Container mirroring Screenshot 1 exact layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        
        {/* White Rounded Portal Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl space-y-8">
          
          {/* Header Banner */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">HỘI ĐỒNG KHẢO THÍ CACULUS</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{exam.title}</h1>
          </div>

          {/* Student Identification Info Sub-card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex justify-between items-center text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="text-slate-500 font-medium">Họ và tên:</div>
              <div className="font-bold text-slate-900 text-base">{user?.name || 'Nguyễn Cường'}</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-slate-500 font-medium">Mã định danh:</div>
              <div className="font-mono font-bold text-crimson text-base">{user?.studentId || 'CACULUS_496692'}</div>
            </div>
          </div>

          {/* Modules List matching Screenshot 1 */}
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">
              Danh sách bài thi
            </h2>

            <div className="space-y-4">
              {exam.modules.map((mod: ExamModule, idx: number) => {
                const isCompleted = submissions.some(s => s.moduleId === mod.id);
                const isPrimary = idx === 0;

                return (
                  <div
                    key={mod.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <h3 className={`text-base font-bold ${isPrimary ? 'text-crimson' : 'text-slate-800'}`}>
                        {mod.title}
                      </h3>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Giờ mở kíp:</strong> {mod.openTime} – {mod.closeTime}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-4 pt-1">
                        <span>Thời gian: <strong>{mod.durationMinutes} phút</strong></span>
                        <span>Trạng thái: <strong className={isCompleted ? 'text-emerald-600' : 'text-slate-600'}>
                          {isCompleted ? 'Đã làm bài' : 'Chưa thi'}
                        </strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/exams/${exam.id}/room?module=${mod.id}`)}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 ${
                        isPrimary
                          ? 'bg-crimson hover:bg-rose-700 text-white'
                          : 'border-2 border-slate-700 text-slate-800 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      {isCompleted ? 'Làm lại' : 'Tiếp tục'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back Navigation */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-crimson transition"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
