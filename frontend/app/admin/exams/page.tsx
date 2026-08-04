'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Exam, Question, QuestionGroup } from '@/types';
import { FileText, Lock, Unlock, Edit, Trash2, Eye, Plus, Check, X, Calendar, Clock, BookOpen, Layers } from 'lucide-react';

export default function AdminExamsWorkspacePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filter tab: 'all' | 'LUYỆN TẬP' | 'THỰC CHIẾN'
  const [filterTab, setFilterTab] = useState<'all' | 'LUYỆN TẬP' | 'THỰC CHIẾN'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Drawer state for creating / editing exams
  const [showAuthoringModal, setShowAuthoringModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form State for Authoring Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'LUYỆN TẬP' | 'THỰC CHIẾN'>('THỰC CHIẾN');
  const [formSubCategory, setFormSubCategory] = useState<'math' | 'reading' | 'science'>('math');
  const [formIsDemo, setFormIsDemo] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(false);

  // Authoring Questions & Passage State
  const [activeModuleTab, setActiveModuleTab] = useState<'math' | 'reading' | 'science'>('math');
  const [mathDuration, setMathDuration] = useState(60);
  const [readingDuration, setReadingDuration] = useState(30);
  const [scienceDuration, setScienceDuration] = useState(60);

  const [readingPassage, setReadingPassage] = useState('');
  const [sciencePassage, setSciencePassage] = useState('');

  // Questions array
  const [questions, setQuestions] = useState<any[]>([
    {
      id: 'q-1',
      number: 1,
      type: 'single_choice',
      text: 'Ví dụ câu hỏi 1: Cho hàm số y = f(x) liên tục trên R...',
      options: [
        { id: 'opt-1', text: 'Đáp án A: Max = 5' },
        { id: 'opt-2', text: 'Đáp án B: Max = 3' },
        { id: 'opt-3', text: 'Đáp án C: Max = 2' },
        { id: 'opt-4', text: 'Đáp án D: Max = 0' },
      ],
      correctOptionId: 'opt-1',
    },
  ]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/exams');
      const data = await res.json();
      setExams(data.exams || []);
    } catch (e) {
      console.error('Error fetching exams:', e);
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
      alert('Lỗi đổi trạng thái bài thi');
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài thi "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/exams?id=${examId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      }
    } catch (e) {
      alert('Không thể xóa bài thi');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('THỰC CHIẾN');
    setFormSubCategory('math');
    setFormIsDemo(false);
    setFormIsPublished(false);
    setShowAuthoringModal(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setFormTitle(exam.title);
    setFormDescription(exam.description || '');
    setFormCategory((exam.category as any) || 'THỰC CHIẾN');
    setFormSubCategory((exam.subCategory as any) || 'math');
    setFormIsDemo(exam.isDemoExam || exam.isFree);
    setFormIsPublished(exam.isPublished || exam.status !== 'CHƯA UPDATE');
    setShowAuthoringModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập Tên bài thi');
      return;
    }

    try {
      const newExamData = {
        id: editingExamId || `exam-${Date.now()}`,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        subCategory: formSubCategory,
        isDemoExam: formIsDemo,
        isFree: formIsDemo,
        isPublished: formIsPublished,
        status: formIsPublished ? 'ĐÃ UPDATE' : 'CHƯA UPDATE',
        modules: [
          {
            id: `mod-${editingExamId || Date.now()}-math`,
            title: '1. Tư duy Toán học',
            category: 'math',
            durationMinutes: mathDuration,
            totalQuestions: 40,
            openTime: '2026-01-01',
            closeTime: '2027-12-31',
          },
          {
            id: `mod-${editingExamId || Date.now()}-reading`,
            title: '2. Tư duy Đọc hiểu',
            category: 'reading',
            durationMinutes: readingDuration,
            totalQuestions: 20,
            openTime: '2026-01-01',
            closeTime: '2027-12-31',
          },
          {
            id: `mod-${editingExamId || Date.now()}-science`,
            title: '3. Tư duy Khoa học & GQVĐ',
            category: 'science',
            durationMinutes: scienceDuration,
            totalQuestions: 20,
            openTime: '2026-01-01',
            closeTime: '2027-12-31',
          },
        ],
      };

      const method = editingExamId ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/exams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExamData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Đã lưu bài thi thành công vào dữ liệu CSDL db.json!');
        setShowAuthoringModal(false);
        fetchExams();
      } else {
        alert(data.error || 'Lỗi lưu bài thi');
      }
    } catch (err) {
      alert('Không thể kết nối máy chủ để lưu bài thi');
    }
  };

  const filteredExams = exams
    .filter(e => {
      if (filterTab === 'LUYỆN TẬP') return e.category === 'LUYỆN TẬP';
      if (filterTab === 'THỰC CHIẾN') return e.category !== 'LUYỆN TẬP';
      return true;
    })
    .filter(e => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
    });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-8 bg-[#d90429] rounded-full inline-block"></span>
              <h1 className="text-2xl font-bold text-slate-900">Workspace Quản lý & Soạn thảo Đề thi TSA</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý đồng nhất <strong>LUYỆN TẬP (Chuyên đề)</strong> & <strong>THỰC CHIẾN (Đề thi VIP)</strong> trên CSDL local `db.json`
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#d90429] hover:bg-red-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-md active:scale-98"
          >
            <Plus className="w-5 h-5" /> + Thêm Bài Thi Mới
          </button>
        </div>

        {/* Tab Selection & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                filterTab === 'all' ? 'bg-white text-[#d90429] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({exams.length})
            </button>
            <button
              onClick={() => setFilterTab('LUYỆN TẬP')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                filterTab === 'LUYỆN TẬP' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔵 LUYỆN TẬP ({exams.filter(e => e.category === 'LUYỆN TẬP').length})
            </button>
            <button
              onClick={() => setFilterTab('THỰC CHIẾN')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                filterTab === 'THỰC CHIẾN' ? 'bg-white text-[#d90429] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 THỰC CHIẾN ({exams.filter(e => e.category !== 'LUYỆN TẬP').length})
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc tên đề thi..."
            className="w-full sm:w-64 text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#d90429]"
          />
        </div>

        {/* Unified Exam Management Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-6 py-3.5">Tên Bài Thi</th>
                <th className="px-4 py-3.5">Phân loại</th>
                <th className="px-4 py-3.5">Phân môn / Số câu</th>
                <th className="px-6 py-3.5">Trạng thái (Khóa / Mở)</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredExams.map((exam, index) => {
                const isPub = exam.isPublished ?? (exam.status !== 'CHƯA UPDATE');

                return (
                  <tr key={exam.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-4 text-center font-mono text-slate-400 text-xs">{index + 1}</td>
                    
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {exam.title}
                        {exam.isDemoExam && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{exam.description}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        exam.category === 'LUYỆN TẬP'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-[#d90429] border border-rose-200'
                      }`}>
                        {exam.category === 'LUYỆN TẬP' ? 'LUYỆN TẬP' : 'THỰC CHIẾN'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {exam.category === 'LUYỆN TẬP' ? (
                        <span className="capitalize">{exam.subCategory === 'math' ? '🔵 Toán học' : exam.subCategory === 'reading' ? '🟣 Đọc hiểu' : '🟢 Khoa học'} (20 câu)</span>
                      ) : (
                        <span>Full 3 Phần ({exam.modules?.length || 3} Module)</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(exam.id, isPub)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                          isPub
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {isPub ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {isPub ? 'ĐANG MỞ (PUBLISHED)' : 'ĐÃ KHÓA (LOCKED)'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/exams/${exam.id}`}
                          target="_blank"
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Xem thử bài thi"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/admin/exams/editor?id=${exam.id}`}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#d90429] border border-rose-200 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Soạn thảo thêm/bớt/sửa câu hỏi chi tiết"
                        >
                          <Edit className="w-3.5 h-3.5" /> Soạn câu hỏi
                        </Link>

                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa bài thi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Prominent Create Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#d90429] hover:bg-red-700 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-98"
          >
            <Plus className="w-6 h-6" /> + Thêm Bài Thi Mới Tải Lên CSDL
          </button>
        </div>

      </main>

      {/* UPGRADED EXAM AUTHORING MODAL WORKSPACE */}
      {showAuthoringModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 my-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingExamId ? 'Chỉnh sửa Cấu trúc Bài thi TSA' : 'Soạn thảo Bài thi TSA Mới'}
                </h3>
                <p className="text-xs text-slate-500">Lưu trực tiếp vào tập tin CSDL `data/db.json`</p>
              </div>

              <button
                onClick={() => setShowAuthoringModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-6">
              
              {/* General Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Bài thi *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ví dụ: Đề TSA Caculus VIP 21"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#d90429] outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại Đề thi</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#d90429] outline-none font-medium"
                  >
                    <option value="THỰC CHIẾN">🔥 THỰC CHIẾN (Full 3 phần)</option>
                    <option value="LUYỆN TẬP">🔵 LUYỆN TẬP (Chuyên đề)</option>
                  </select>
                </div>

                {formCategory === 'LUYỆN TẬP' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phân môn Chuyên đề</label>
                    <select
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value as any)}
                      className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#d90429] outline-none font-medium"
                    >
                      <option value="math">🔵 Phần 1: Tư duy Toán học</option>
                      <option value="reading">🟣 Phần 2: Tư duy Đọc hiểu</option>
                      <option value="science">🟢 Phần 3: Tư duy Khoa học & GQVĐ</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả bài thi</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả cấu trúc đề thi..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-[#d90429] outline-none"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 text-[#d90429] rounded"
                  />
                  Xuất bản ngay (Mở cho học sinh)
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDemo}
                    onChange={(e) => setFormIsDemo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Đề thi Miễn phí DEMO (Mở tự do)
                </label>
              </div>

              {editingExamId && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase">
                      ✨ Trình Soạn Thảo Câu Hỏi Chi Tiết (Full Workspace)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Chỉnh sửa chi tiết đề bài, công thức KaTeX, chọn đáp án đúng A/B/C/D, câu hỏi đúng/sai, điền từ ngắn, đính kèm hình ảnh & nhập bài thi từ file PDF.
                  </p>
                  <Link
                    href={`/admin/exams/editor?id=${editingExamId}`}
                    className="w-full bg-[#d90429] hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-98 mt-2"
                  >
                    <Edit className="w-4 h-4" /> 🚀 Mở Trình Soạn Thảo Chi Tiết Câu Hỏi & Đoạn Văn
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAuthoringModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-[#d90429] text-white rounded-xl hover:bg-red-700 shadow-md transition active:scale-98"
                >
                  Lưu Thông Tin Cơ Bản
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
