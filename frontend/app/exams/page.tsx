'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Exam } from '@/types';
import { BookOpen, PlayCircle, Clock, CheckCircle, Lock, Search, Sparkles } from 'lucide-react';

export default function ExamsPortalPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        setExams(data.exams || []);
        setLoading(false);
      });
  }, []);

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Header & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-crimson font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Hệ thống khảo thí 36+ Đề thực chiến
            </div>
            <h1 className="text-2xl font-black text-slate-900">Danh sách khoá luyện đề TSA</h1>
            <p className="text-xs text-slate-500">Lựa chọn đề thi thử nghiệm cấu trúc 3 phần chuẩn Bách Khoa 2026</p>
          </div>

          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm đề thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-crimson transition"
            />
          </div>
        </div>

        {/* Exams Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const isDisabled = exam.status === 'disabled';

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs space-y-5 transition flex flex-col justify-between ${
                  isDisabled ? 'border-slate-200 opacity-90' : 'border-slate-200 hover:shadow-md hover:border-rose-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      isDisabled 
                        ? 'bg-slate-100 text-slate-500 border border-slate-200'
                        : exam.isFree 
                          ? 'bg-rose-100 text-crimson border border-rose-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isDisabled ? 'Chưa mở' : exam.isFree ? 'Miễn phí' : `${exam.price?.toLocaleString()} VNĐ`}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {isDisabled ? 'Kế hoạch VIP' : 'Sẵn sàng'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg">{exam.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{exam.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {isDisabled ? (
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                    >
                      <Lock className="w-4 h-4 text-slate-400" /> Chưa mở
                    </button>
                  ) : (
                    <Link
                      href={`/exams/${exam.id}`}
                      className="w-full bg-crimson hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs"
                    >
                      <PlayCircle className="w-4 h-4" /> Tham gia khảo thí
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
              Đang tải danh sách 36+ đề thi TSA...
            </div>
          )}

          {!loading && filteredExams.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
              Không tìm thấy đề thi nào phù hợp với từ khóa "{searchQuery}"
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
