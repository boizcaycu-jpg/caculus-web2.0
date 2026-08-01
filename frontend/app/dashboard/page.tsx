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

  // Requirement: Collapsible Accordion State for "Phòng luyện đề TSA" list
  const [isExamsExpanded, setIsExamsExpanded] = useState(true);

  // Requirement 3: Mandatory Name Entry State
  const [inputRealName, setInputRealName] = useState('');
  const [submittingName, setSubmittingName] = useState(false);

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
      .catch(() => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('caculus_user');
          if (stored) {
            try { setUser(JSON.parse(stored)); } catch (e) {}
          }
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
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
              <div className="text-xs text-slate-400 font-semibold">
                {user && user.name ? `Xin chào, ${user.name}` : 'Chào mừng thí sinh VIP'}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {user && user.name ? user.name : 'Thí sinh VIP'}
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
                <BookOpen className="w-4 h-4 text-crimson" /> Số đề đã làm
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

        {/* Collapsible Accordion List Section: PHÒNG LUYỆN ĐỀ THI TSA */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Accordion Header */}
          <button
            onClick={() => setIsExamsExpanded(!isExamsExpanded)}
            className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/80 transition text-left border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-crimson rounded-full"></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Phòng Luyện Đề Thi Mô Phỏng TSA Bách Khoa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách đề thi chuẩn hóa phân chia 3 phân môn (Toán, Đọc hiểu, Khoa học)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-rose-100 text-crimson px-3 py-1 rounded-full">
                {exams.length} Đề thi
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isExamsExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Accordion Content Body */}
          {isExamsExpanded && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {exams.map((exam) => {
                const isPublished = exam.isPublished ?? (exam.is_published ?? (exam.status !== 'CHƯA UPDATE'));
                const isDemoExam = exam.isFree || exam.id === 'exam-2k9-1' || exam.id === 'exam-2k9-2';
                const isUserVip = user?.isVip ?? true;

                const canAccess = isPublished && (isDemoExam || isUserVip || user?.role === 'admin');

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
                          {isPublished ? 'Hệ thống mở' : 'Khóa đóng'}
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDemoExam ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isDemoExam ? 'Đề Đánh giá' : 'Đề VIP'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base group-hover:text-crimson transition line-clamp-1">
                        {exam.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {exam.description || 'Bộ đề kiểm tra đánh giá tư duy theo cấu trúc mới nhất của Đại học Bách Khoa Hà Nội.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Số lượng Module:</span>
                        <span className="font-bold text-slate-800">{exam.modules?.length || 3} Phần thi</span>
                      </div>

                      {canAccess ? (
                        <Link
                          href={`/exams/${exam.id}`}
                          className="w-full bg-crimson hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <PlayCircle className="w-4 h-4" /> Vào thi / Làm bài
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-slate-400 font-semibold text-xs py-2.5 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 border border-slate-200"
                        >
                          {!isPublished ? '🔒 Đề chưa mở' : '🔒 Cần tài khoản VIP'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-crimson" /> Thống kê Luyện tập
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
