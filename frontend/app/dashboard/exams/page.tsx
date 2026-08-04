'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { BookOpen, Award, Clock, PlayCircle, Lock, CheckCircle2, Search, Filter, Compass, Flame } from 'lucide-react';
import { TokenPayload } from '@/lib/auth';

export default function StudentExamsPage() {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'luyen-tap' (Chuyên đề từng phần) or 'thuc-chien' (Đề thi đầy đủ 3 phần)
  const [activeTab, setActiveTab] = useState<'luyen-tap' | 'thuc-chien'>('luyen-tap');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        setExams(data.exams || []);
        setSubmissions(data.submissions || []);
        setLoading(false);
      });
  }, []);

  const isUserVip = user?.isVip ?? true;

  // Filter LUYỆN TẬP (Chuyên đề)
  const practiceExams = exams.filter(e => e.category === 'LUYỆN TẬP');
  const mathPractice = practiceExams.filter(e => e.subCategory === 'math' || e.title.includes('Toán'));
  const readingPractice = practiceExams.filter(e => e.subCategory === 'reading' || e.title.includes('Đọc'));
  const sciencePractice = practiceExams.filter(e => e.subCategory === 'science' || e.title.includes('Khoa học'));

  // Filter THỰC CHIẾN (Full Exams)
  const fullExams = exams.filter(e => e.category !== 'LUYỆN TẬP' || e.isDemoExam);

  const filterBySearch = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Title */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-8 bg-[#d90429] rounded-full inline-block"></span>
              <h1 className="text-2xl font-bold text-slate-900">Hệ thống Luyện thi TSA Bách Khoa 2026</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Phân chia rõ ràng giữa <strong>LUYỆN TẬP (Chuyên đề từng phần)</strong> & <strong>THỰC CHIẾN (Bộ đề thi đầy đủ)</strong>
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài thi, chuyên đề..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#d90429] bg-slate-50"
            />
          </div>
        </div>

        {/* 2 Main Interactive Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl max-w-md">
          <button
            onClick={() => setActiveTab('luyen-tap')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'luyen-tap'
                ? 'bg-white text-[#d90429] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            LUYỆN TẬP (Chuyên đề)
          </button>
          <button
            onClick={() => setActiveTab('thuc-chien')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'thuc-chien'
                ? 'bg-white text-[#d90429] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-[#d90429]" />
            THỰC CHIẾN (Đề VIP)
          </button>
        </div>

        {/* TAB 1: LUYỆN TẬP (Chuyên đề từng phần) */}
        {activeTab === 'luyen-tap' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* 1. PHẦN TOÁN HỌC */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <span className="w-3 h-6 bg-blue-600 rounded-full inline-block"></span>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  Phần 1: Tư duy Toán học
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    🔵 {mathPractice.length} Chuyên đề
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBySearch(mathPractice).map((item) => {
                  const isPub = item.isPublished;
                  const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3 group hover:border-blue-300"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                            🔵 Toán học
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPub ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isPub ? 'Đã mở' : 'Khóa'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {item.modules?.[0]?.totalQuestions || 20} câu • 45 phút
                        </span>

                        {canAccess ? (
                          <Link
                            href={`/exams/${item.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Luyện ngay
                          </Link>
                        ) : (
                          <button disabled className="bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Đề chưa mở
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. PHẦN ĐỌC HIỂU */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <span className="w-3 h-6 bg-purple-600 rounded-full inline-block"></span>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  Phần 2: Tư duy Đọc hiểu
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    🟣 {readingPractice.length} Chuyên đề
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBySearch(readingPractice).map((item) => {
                  const isPub = item.isPublished;
                  const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3 group hover:border-purple-300"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                            🟣 Đọc hiểu
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPub ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isPub ? 'Đã mở' : 'Khóa'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {item.modules?.[0]?.totalQuestions || 15} câu • 30 phút
                        </span>

                        {canAccess ? (
                          <Link
                            href={`/exams/${item.id}`}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Luyện ngay
                          </Link>
                        ) : (
                          <button disabled className="bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Đề chưa mở
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. PHẦN KHOA HỌC & GQVĐ */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <span className="w-3 h-6 bg-emerald-600 rounded-full inline-block"></span>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  Phần 3: Tư duy Khoa học & Giải quyết vấn đề
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    🟢 {sciencePractice.length} Chuyên đề
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBySearch(sciencePractice).map((item) => {
                  const isPub = item.isPublished;
                  const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3 group hover:border-emerald-300"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                            🟢 Khoa học & GQVĐ
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPub ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isPub ? 'Đã mở' : 'Khóa'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {item.modules?.[0]?.totalQuestions || 15} câu • 45 phút
                        </span>

                        {canAccess ? (
                          <Link
                            href={`/exams/${item.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Luyện ngay
                          </Link>
                        ) : (
                          <button disabled className="bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Đề chưa mở
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* TAB 2: THỰC CHIẾN (Đề thi đầy đủ 3 phần) */}
        {activeTab === 'thuc-chien' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Danh sách Đề thi Thực chiến TSA (Full 3 Phần)</h2>
                <p className="text-xs text-slate-500">Bao gồm 3 Đề DEMO mở tự do & 20 Đề VIP Thực chiến</p>
              </div>
              <span className="text-xs font-bold bg-rose-100 text-[#d90429] px-3 py-1 rounded-full">
                {fullExams.length} Đề thi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBySearch(fullExams).map((exam) => {
                const isPublished = exam.isPublished ?? (exam.is_published ?? (exam.status !== 'CHƯA UPDATE'));
                const isDemoExam = exam.isFree || exam.isDemoExam || exam.id.includes('demo');
                const canAccess = isPublished && (isDemoExam || isUserVip || user?.role === 'admin');

                const sub = submissions.find(s => s.examId === exam.id);

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group hover:border-rose-200"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isPublished ? 'Hệ thống mở' : 'Đã khóa'}
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                          isDemoExam ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isDemoExam ? 'Đề DEMO' : 'Đề VIP Thực chiến'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base group-hover:text-[#d90429] transition line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Trạng thái làm bài:</span>
                        <span className={`font-bold ${sub ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {sub ? `Đã nộp bài (${sub.score}%)` : 'Chưa làm'}
                        </span>
                      </div>

                      {canAccess ? (
                        <Link
                          href={`/exams/${exam.id}`}
                          className="w-full bg-[#d90429] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <PlayCircle className="w-4 h-4" /> {sub ? 'Làm lại bài thi' : 'Vào thi / Làm bài'}
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-slate-400 font-semibold text-xs py-2.5 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 border border-slate-200"
                        >
                          <Lock className="w-3.5 h-3.5" /> {!isPublished ? '🔒 Đề chưa mở' : '🔒 Cần tài khoản VIP'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
