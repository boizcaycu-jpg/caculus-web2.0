'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Exam, AntiCheatLog, Submission } from '@/types';
import { FileText, ShieldAlert, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'exams' | 'monitoring'>('exams');
  
  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLog[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam Schedule Edit State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

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
      setSubmissions(dataMon.submissions || []);
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
      alert('Lỗi chuyển trạng thái đề thi');
    }
  };

  const handleUpdateExam = async (examId: string, updates: Partial<Exam>) => {
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Cập nhật thông tin đề thi thành công!');
        setEditingExam(null);
        fetchData();
      }
    } catch (e) {
      alert('Lỗi cập nhật đề thi');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-7 bg-[#d90429] rounded-full inline-block"></span>
              Quản trị Hệ thống Khảo thí CACULUS
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý 500 Tài khoản Thí sinh VIP, Xuất bản Đề thi & Giám sát Gian lận Thời gian thực
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'exams'
                  ? 'bg-white text-[#d90429] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Quản lý Đề thi ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'monitoring'
                  ? 'bg-white text-[#d90429] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Giám sát Gian lận ({antiCheatLogs.length})
            </button>
          </div>
        </div>

        {/* TAB 1: EXAMS MANAGEMENT */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Danh sách Đề thi TSA & Trạng thái Xuất bản</h2>
                <p className="text-xs text-slate-500">Bật/tắt trạng thái xuất bản đề thi cho 500 thí sinh VIP</p>
              </div>
              <a
                href="/admin/exams/editor"
                className="bg-[#d90429] text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-1.5 shadow-sm"
              >
                + Tạo Đề thi Mới
              </a>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Tên Đề thi</th>
                    <th className="px-6 py-3.5">Cấu trúc Module</th>
                    <th className="px-6 py-3.5">Trạng thái Xuất bản</th>
                    <th className="px-6 py-3.5">Lịch tự động</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {exams.map(exam => {
                    const isPub = exam.isPublished ?? (exam.status !== 'CHƯA UPDATE');
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{exam.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{exam.description || 'Chưa có mô tả'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-600 font-medium">
                            {exam.modules?.length || 0} Module ({exam.modules?.map(m => m.title).join(', ')})
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleTogglePublish(exam.id, isPub)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                              isPub
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isPub ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                            {isPub ? 'ĐÃ XUẤT BẢN' : 'CHƯA MỞ (ĐANG KHÓA)'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {exam.publishDate ? (
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#d90429]" />
                              {new Date(exam.publishDate).toLocaleString('vi-VN')}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-italic">Chưa hẹn giờ</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingExam(exam)}
                            className="text-[#d90429] hover:underline font-semibold text-xs px-2 py-1 rounded hover:bg-red-50"
                          >
                            Sửa lịch
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MONITORING LOGS */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Giám sát Gian lận Anti-Cheat (Real-Time)</h2>
                <p className="text-xs text-slate-500">Ghi nhận thao tác chuyển tab, thoát toàn màn hình của thí sinh</p>
              </div>
              <span className="bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                Đang giám sát
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Thí sinh</th>
                    <th className="px-6 py-3.5">Mã bài thi</th>
                    <th className="px-6 py-3.5">Hành vi ghi nhận</th>
                    <th className="px-6 py-3.5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {antiCheatLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                        Chưa ghi nhận vi phạm gian lận nào
                      </td>
                    </tr>
                  ) : (
                    antiCheatLogs.map(log => (
                      <tr key={log.id} className="hover:bg-rose-50/40 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{log.userId}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">{log.examId}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                            ⚠️ {log.event} ({log.warningCount} lần)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* EDIT EXAM SCHEDULE MODAL */}
      {editingExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hẹn giờ Xuất bản Tự động</h3>
            <p className="text-xs text-slate-500 mb-4">{editingExam.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày giờ xuất bản (YYYY-MM-DD THH:mm)</label>
                <input
                  type="datetime-local"
                  defaultValue={editingExam.publishDate || ''}
                  id="exam_publish_date_input"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#d90429] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const val = (document.getElementById('exam_publish_date_input') as HTMLInputElement)?.value;
                    handleUpdateExam(editingExam.id, { publishDate: val });
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[#d90429] text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                  Lưu thiết lập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
