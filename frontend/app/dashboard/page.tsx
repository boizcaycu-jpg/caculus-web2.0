'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { User, Award, BookOpen, Clock, PlayCircle, CheckCircle, Trophy, BarChart2, ChevronDown } from 'lucide-react';
import { TokenPayload } from '@/lib/auth';

export default function DashboardPage() {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Requirement 2: Collapsible Accordion State for "Phòng luyện đề TSA" list
  const [isExamsExpanded, setIsExamsExpanded] = useState(true);

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
        setExams(data.exams || []);
        setSubmissions(data.submissions || []);
        setLoading(false);
      });
  }, []);

  const totalTaken = submissions.length;
  const highestScore = submissions.reduce((max, s) => Math.max(max, s.score), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Profile Summary Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-4 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-crimson flex items-center justify-center font-bold text-xl border border-rose-200">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Xin chào,</div>
              <h2 className="text-lg font-extrabold text-slate-900">{user?.name || 'Nguyễn Cường'}</h2>
              <div className="text-xs text-slate-500">{user?.email || 'student@caculus.edu.vn'}</div>
            </div>
          </div>

          {/* Stat 1: Total Exams Taken */}
          <div className="text-center md:border-r border-slate-100 pr-4">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng bài đã làm</div>
            <div className="text-3xl font-black text-crimson mt-1">{totalTaken}</div>
            <div className="text-[11px] text-slate-400">bài thi</div>
          </div>

          {/* Stat 2: High Score */}
          <div className="text-center md:border-r border-slate-100 pr-4">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Điểm cao nhất</div>
            <div className="text-3xl font-black text-slate-900 mt-1">{highestScore}</div>
            <div className="text-[11px] text-slate-400">thang điểm %</div>
          </div>

          {/* Role & Identification (Requirement 1: Scrubbed Safe Student ID) */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-semibold">Vai trò</div>
            <div className="text-base font-black text-crimson tracking-wide uppercase">HỌC SINH</div>
            <div className="text-xs font-mono font-bold text-slate-600 mt-0.5">{user?.studentId || 'CACULUS_496692'}</div>
          </div>
        </div>

        {/* Action Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Card 1: Main Practice Exams with Collapsible Accordion (Requirement 2) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition">
            
            {/* Accordion Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-crimson" />
                Phòng luyện đề TSA
              </h3>
              
              <div className="flex items-center gap-3">
                <Link href="/exams" className="text-xs font-bold text-crimson hover:underline">
                  Xem tất cả
                </Link>

                <button
                  onClick={() => setIsExamsExpanded(!isExamsExpanded)}
                  className="p-1 text-slate-400 hover:text-crimson hover:bg-rose-50 rounded-lg transition"
                  title={isExamsExpanded ? 'Thu gọn danh sách đề' : 'Mở rộng danh sách đề'}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExamsExpanded ? 'rotate-180 text-crimson' : ''}`} />
                </button>
              </div>
            </div>

            {/* Smooth Collapsible Accordion Container */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExamsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
              }`}
            >
              <div className="overflow-hidden space-y-3 pt-1">
                {exams.map((exam) => {
                  const isUserVip = user?.isVip ?? true;
                  const isDemoExam = exam.title.includes('DEMO');
                  const isUnlocked = isDemoExam || isUserVip || user?.role === 'admin';

                  return (
                    <div key={exam.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{exam.title}</h4>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Miễn phí
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{exam.modules?.length || 3} kíp thi tự động</p>
                      </div>

                      {isUnlocked ? (
                        <Link
                          href={`/exams/${exam.id}`}
                          className="bg-crimson hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Vào thi / Làm bài
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1"
                        >
                          🔒 Cần tài khoản VIP
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: IRT Assessment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Bài thi chuẩn hóa IRT
              </h3>
              <span className="text-xs font-bold text-slate-400">Xem tất cả</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200 space-y-2">
              <p className="text-xs text-slate-600 font-medium">Chưa có bài thi IRT nâng cao nào mở hôm nay</p>
              <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">
                Sắp diễn ra
              </span>
            </div>
          </div>

          {/* Card 3: Top Performance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top 5 điểm cao nhất
              </h3>
              <Link href="/leaderboard" className="text-xs font-bold text-crimson hover:underline">
                Bảng xếp hạng
              </Link>
            </div>
            <div className="space-y-2">
              {submissions.length > 0 ? (
                submissions.slice(0, 3).map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {sub.moduleId === 'mod-math-1' ? 'Tư duy Toán học' : 'Tư duy Đọc hiểu'}
                    </span>
                    <span className="font-mono font-bold text-crimson">{sub.score} điểm</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-4">Chưa có kết quả làm bài nào</div>
              )}
            </div>
          </div>
        </div>

        {/* History Table Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Lịch sử bài thi gần đây</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Tên bài thi / Kíp thi</th>
                  <th className="p-3">Ngày nộp bài</th>
                  <th className="p-3">Số câu đúng</th>
                  <th className="p-3">Thang điểm</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-900">
                      {sub.examId === 'exam-2k9-1' ? 'Đề TSA Caculus DEMO 01' : 'Đề TSA Caculus DEMO 02'}
                    </td>
                    <td className="p-3 text-slate-500">{new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 font-mono text-slate-700">{sub.correctCount}/{sub.totalQuestions} câu</td>
                    <td className="p-3 font-mono font-bold text-crimson">{sub.score}%</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        Đã nộp bài
                      </span>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                      Bạn chưa thực hiện bài thi nào. Vào <Link href="/exams" className="text-crimson font-bold underline">Phòng khảo thí</Link> để bắt đầu!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
