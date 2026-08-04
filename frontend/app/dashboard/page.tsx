'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { User, Award, BookOpen, Clock, PlayCircle, Lock, Trophy, BarChart2, ChevronDown, Flame, Compass, CheckCircle2 } from 'lucide-react';
import { TokenPayload } from '@/lib/auth';

export default function DashboardPage() {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mandatory Name Entry State
  const [inputRealName, setInputRealName] = useState('');
  const [submittingName, setSubmittingName] = useState(false);

  // Collapsible Accordion States for the 4 Sections
  const [openMath, setOpenMath] = useState(true);
  const [openReading, setOpenReading] = useState(true);
  const [openScience, setOpenScience] = useState(true);
  const [openFull, setOpenFull] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('caculus_user');
          if (stored) {
            try { setUser(JSON.parse(stored)); } catch (e) {}
          }
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

  const totalTaken = submissions.length;
  const highestScore = submissions.reduce((max, s) => Math.max(max, s.score), 0);

  const needsName = user && user.role === 'student' && (!user.name || user.name === 'null' || user.name.trim() === '');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRealName.trim()) return;

    setSubmittingName(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realName: inputRealName.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('caculus_user', JSON.stringify(data.user));
        }
      } else {
        alert(data.error || 'Không thể lưu tên');
      }
    } catch (err) {
      alert('Lỗi cập nhật Họ và tên');
    } finally {
      setSubmittingName(false);
    }
  };

  // Group Exams into 4 distinct color-coded categories
  const practiceExams = exams.filter(e => e.category === 'LUYỆN TẬP');
  const mathPractice = practiceExams.filter(e => e.subCategory === 'math' || e.title.includes('Toán'));
  const readingPractice = practiceExams.filter(e => e.subCategory === 'reading' || e.title.includes('Đọc'));
  const sciencePractice = practiceExams.filter(e => e.subCategory === 'science' || e.title.includes('Khoa học'));

  const fullExams = exams.filter(e => e.category !== 'LUYỆN TẬP' || e.isDemoExam);

  const isUserVip = user?.isVip ?? true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Profile Summary Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-4 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-crimson flex items-center justify-center font-bold text-xl border border-rose-200 shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">
                {user && (user.name || user.realName) ? `Xin chào, ${user.name || user.realName}` : 'Chào mừng thí sinh VIP'}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 line-clamp-1">
                {user && (user.name || user.realName) ? (user.name || user.realName) : 'Thí sinh VIP'}
              </h2>
              <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                Tài khoản VIP {user?.studentId ? `• ${user.studentId}` : ''}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                <BookOpen className="w-4 h-4 text-crimson" /> Số bài đã làm
              </div>
              <div className="text-2xl font-black text-slate-900">{totalTaken}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                <Award className="w-4 h-4 text-amber-500" /> Điểm cao nhất
              </div>
              <div className="text-2xl font-black text-crimson">{highestScore > 0 ? `${highestScore}%` : '--'}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-emerald-600" /> Trạng thái
              </div>
              <div className="text-xs font-extrabold text-emerald-600 mt-2 bg-emerald-100 py-1 px-2 rounded-full inline-block">
                Đã kích hoạt VIP
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 COLOR-CODED COLLAPSIBLE SECTIONS (LIST NGANG CÓ ĐỀ MỤC THU GỌN)        */}
        {/* ========================================================================= */}

        {/* SECTION 1: 🔵 LUYỆN TOÁN (BLUE THEME) */}
        <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-xs">
          <button
            onClick={() => setOpenMath(!openMath)}
            className="w-full flex items-center justify-between p-5 bg-blue-50/80 hover:bg-blue-100/60 transition text-left border-b border-blue-200"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-blue-600 rounded-full inline-block"></span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  🔵 LUYỆN TOÁN - Tư duy Toán học
                  <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                    {mathPractice.length} Chuyên đề
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Luyện tập chuyên sâu các dạng toán Hàm số, Logarit, Tích phân, Số phức & Hình học Oxyz
                </p>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${openMath ? 'rotate-180' : ''}`} />
          </button>

          {openMath && (
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
              {mathPractice.map((item, idx) => {
                const isPub = item.isPublished;
                const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                            🔵 Luyện Toán
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        20 câu • 45 phút
                      </span>

                      {canAccess ? (
                        <Link
                          href={`/exams/${item.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" /> Vào thi / Làm bài
                        </Link>
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 font-semibold text-xs py-2 px-4 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> 🔒 Đề chưa mở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: 🟣 LUYỆN ĐỀ ĐỌC HIỂU (PURPLE THEME) */}
        <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-xs">
          <button
            onClick={() => setOpenReading(!openReading)}
            className="w-full flex items-center justify-between p-5 bg-purple-50/80 hover:bg-purple-100/60 transition text-left border-b border-purple-200"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-purple-600 rounded-full inline-block"></span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  🟣 LUYỆN ĐỀ ĐỌC HIỂU - Tư duy Đọc hiểu
                  <span className="text-xs font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">
                    {readingPractice.length} Chuyên đề
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rèn luyện kỹ năng phân tích văn bản Báo chí, Khoa học & Nghệ thuật chuẩn TSA
                </p>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${openReading ? 'rotate-180' : ''}`} />
          </button>

          {openReading && (
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
              {readingPractice.map((item, idx) => {
                const isPub = item.isPublished;
                const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm hover:text-purple-600 transition">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                            🟣 Đọc hiểu
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        15 câu • 30 phút
                      </span>

                      {canAccess ? (
                        <Link
                          href={`/exams/${item.id}`}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" /> Vào thi / Làm bài
                        </Link>
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 font-semibold text-xs py-2 px-4 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> 🔒 Đề chưa mở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: 🟢 LUYỆN ĐỀ KHOA HỌC (EMERALD THEME) */}
        <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
          <button
            onClick={() => setOpenScience(!openScience)}
            className="w-full flex items-center justify-between p-5 bg-emerald-50/80 hover:bg-emerald-100/60 transition text-left border-b border-emerald-200"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-emerald-600 rounded-full inline-block"></span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  🟢 LUYỆN ĐỀ KHOA HỌC - Tư duy Khoa học & GQVĐ
                  <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                    {sciencePractice.length} Chuyên đề
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân tích dữ liệu thực nghiệm Vật lý, Hóa học, Sinh học & Giải quyết vấn đề Khoa học tổng hợp
                </p>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-200 ${openScience ? 'rotate-180' : ''}`} />
          </button>

          {openScience && (
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
              {sciencePractice.map((item, idx) => {
                const isPub = item.isPublished;
                const canAccess = isPub && (item.isDemoExam || isUserVip || user?.role === 'admin');

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm hover:text-emerald-600 transition">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                            🟢 Khoa học
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        15 câu • 45 phút
                      </span>

                      {canAccess ? (
                        <Link
                          href={`/exams/${item.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" /> Vào thi / Làm bài
                        </Link>
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 font-semibold text-xs py-2 px-4 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> 🔒 Đề chưa mở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: 🔥 LUYỆN ĐỀ THỰC CHIẾN (CRIMSON/RED THEME) */}
        <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs">
          <button
            onClick={() => setOpenFull(!openFull)}
            className="w-full flex items-center justify-between p-5 bg-rose-50/80 hover:bg-rose-100/60 transition text-left border-b border-rose-200"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-[#d90429] rounded-full inline-block"></span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  🔥 LUYỆN ĐỀ THỰC CHIẾN - Bộ Đề Full 3 Phần TSA
                  <span className="text-xs font-bold bg-[#d90429] text-white px-2.5 py-0.5 rounded-full">
                    {fullExams.length} Đề thi
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thi thử áp lực thời gian thực 150 phút (Toán + Đọc hiểu + Khoa học) chuẩn cấu trúc Bách Khoa
                </p>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-[#d90429] transition-transform duration-200 ${openFull ? 'rotate-180' : ''}`} />
          </button>

          {openFull && (
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
              {fullExams.map((exam, idx) => {
                const isPublished = exam.isPublished ?? (exam.is_published ?? (exam.status !== 'CHƯA UPDATE'));
                const isDemoExam = exam.isFree || exam.isDemoExam || exam.id.includes('demo');
                const canAccess = isPublished && (isDemoExam || isUserVip || user?.role === 'admin');

                const sub = submissions.find(s => s.examId === exam.id);

                return (
                  <div
                    key={exam.id}
                    className="p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-rose-100 text-[#d90429] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm hover:text-[#d90429] transition">
                            {exam.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isDemoExam ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {isDemoExam ? 'Đề DEMO' : 'Đề VIP Thực chiến'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{exam.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        sub ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {sub ? `Đã nộp bài (${sub.score}%)` : 'Chưa làm'}
                      </span>

                      {canAccess ? (
                        <Link
                          href={`/exams/${exam.id}`}
                          className="bg-[#d90429] hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" /> {sub ? 'Làm lại bài' : 'Vào thi / Làm bài'}
                        </Link>
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 font-semibold text-xs py-2 px-4 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> 🔒 Đề chưa mở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Section: Leaderboard Preview & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-crimson" /> Thống kê Tiến độ Luyện tập
            </h3>
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">Hoàn thành bài thi để theo dõi biểu đồ tiến độ điểm số cá nhân</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Top điểm cao
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

      </main>

      {/* MANDATORY NAME ENTRY MODAL FOR FIRST LOGIN */}
      {needsName && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-100 text-crimson rounded-full flex items-center justify-center mx-auto border border-rose-200">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Xác nhận Họ & Tên Thí sinh</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tài khoản <strong>{user?.email}</strong> cần nhập Họ và tên chính xác lần đầu để tham gia luyện thi và ghi nhận bảng vàng thành tích.
              </p>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={inputRealName}
                  onChange={(e) => setInputRealName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Cường"
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#d90429] outline-none font-medium text-slate-900 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingName}
                className="w-full bg-crimson hover:bg-red-700 text-white font-bold text-sm py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                {submittingName ? 'Đang lưu thông tin...' : 'Xác nhận & Vào Phòng Luyện TSA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
