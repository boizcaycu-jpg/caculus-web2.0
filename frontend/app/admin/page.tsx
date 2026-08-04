'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Exam, AntiCheatLog, Submission } from '@/types';
import { FileText, ShieldAlert, Calendar, Clock, CheckCircle2, Lock, Unlock, Eye, Edit, Trash2, Plus } from 'lucide-react';

export default function AdminDashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resExams = await fetch('/api/admin/exams');
      const dataExams = await resExams.json();
      setExams(dataExams.exams || []);

      const resMon = await fetch('/api/admin/monitoring');
      const dataMon = await resMon.json();
      setAntiCheatLogs(dataMon.antiCheatLogs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (examId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setExams(prev =>
          prev.map(e => (e.id === examId ? { ...e, isPublished: !currentPublished, status: !currentPublished ? 'ĐÃ UPDATE' : 'CHƯA UPDATE' } : e))
        );
      }
    } catch (e) {
      alert('Lỗi đổi trạng thái đề thi');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-8 bg-[#d90429] rounded-full inline-block"></span>
              <h1 className="text-2xl font-bold text-slate-900">Quản trị Hệ thống Khảo thí CACULUS</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý 500 Tài khoản Thí sinh VIP, 44 Đề thi TSA (Luyện tập & Thực chiến) & Giám sát Gian lận
            </p>
          </div>

          <Link
            href="/admin/exams"
            className="bg-[#d90429] hover:bg-red-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-md"
          >
            <FileText className="w-4 h-4" /> Quản lý Soạn thảo Đề thi (Workspace)
          </Link>
        </div>

        {/* Dashboard Metric Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Tổng số Bài thi TSA</div>
              <div className="text-2xl font-black text-slate-900">{exams.length} Đề thi</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Đề thi Đang Mở (Published)</div>
              <div className="text-2xl font-black text-emerald-600">
                {exams.filter(e => e.isPublished || e.status !== 'CHƯA UPDATE').length} Đề thi
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Nhật ký Gian lận Anti-Cheat</div>
              <div className="text-2xl font-black text-rose-600">{antiCheatLogs.length} Vi phạm</div>
            </div>
          </div>
        </div>

        {/* Quick Management Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách Đề thi TSA & Trạng thái Khóa / Mở</h2>
              <p className="text-xs text-slate-500">Nhấn vào công tắc để bật/tắt quyền truy cập làm bài thi tức thì</p>
            </div>
            <Link
              href="/admin/exams"
              className="text-xs font-bold text-[#d90429] hover:underline"
            >
              Vào Workspace Quản lý Chi tiết →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Tên Đề thi</th>
                  <th className="px-4 py-3.5">Phân loại</th>
                  <th className="px-6 py-3.5">Trạng thái Xuất bản</th>
                  <th className="px-6 py-3.5 text-right">Thao tác Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {exams.slice(0, 10).map(exam => {
                  const isPub = exam.isPublished ?? (exam.status !== 'CHƯA UPDATE');
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {exam.title}
                        <div className="text-xs font-normal text-slate-500 line-clamp-1">{exam.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                          exam.category === 'LUYỆN TẬP' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-[#d90429] border border-rose-200'
                        }`}>
                          {exam.category === 'LUYỆN TẬP' ? 'LUYỆN TẬP' : 'THỰC CHIẾN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(exam.id, isPub)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isPub
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isPub ? 'ĐÃ XUẤT BẢN' : 'ĐÃ KHÓA (LOCKED)'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/exams/${exam.id}`}
                          target="_blank"
                          className="text-xs font-bold text-[#d90429] hover:underline"
                        >
                          Xem thử →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
