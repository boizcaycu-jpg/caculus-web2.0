'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { User, Exam, AntiCheatLog, Submission } from '@/types';
import { Users, FileText, ShieldAlert, Plus, Trash2, Key, Calendar, Clock, CheckCircle2, Search } from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'exams' | 'monitoring'>('users');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLog[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // User Provisioning Form Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('student123');

  // Student search & sort state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState<'newest' | 'oldest' | 'name_asc'>('newest');

  // Exam Schedule Edit State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resUsers = await fetch('/api/admin/users');
      const dataUsers = await resUsers.json();
      setUsers(dataUsers.users || []);

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

  const filteredUsers = users
    .filter(u => {
      const q = studentSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.studentId.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (studentSort === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (studentSort === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: 'student',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Đã cấp tài khoản thành công cho ${newName}!\nMật khẩu ban đầu: ${newPassword}`);
        setShowAddUserModal(false);
        setNewEmail('');
        setNewName('');
        fetchData();
      } else {
        alert(data.error || 'Không thể tạo tài khoản');
      }
    } catch (e) {
      alert('Lỗi tạo tài khoản');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi tài khoản của ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      alert('Không thể xóa tài khoản');
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
        fetchData();
      }
    } catch (e) {
      console.error('Error updating exam status:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Admin Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md inline-block mb-1 border border-amber-200">
              ADMIN CONTROL PANEL
            </div>
            <h1 className="text-2xl font-black text-slate-900">Quản trị Hệ thống Khảo thí CACULUS</h1>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" /> Quản lý tài khoản
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'exams' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-crimson" /> Quản lý bài thi
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'monitoring' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Giám sát Gian lận
            </button>
          </div>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Danh sách học sinh & Cấp tài khoản</h2>
                <p className="text-xs text-slate-500">Phân quyền thủ công (Manual Provisioning) - Không mở đăng ký tự do</p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-crimson hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Cấp tài khoản học sinh
              </button>
            </div>

            {/* BUG 7: Search Bar & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email hoặc mã thí sinh..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-crimson"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={studentSort}
                  onChange={(e) => setStudentSort(e.target.value as any)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-crimson"
                >
                  <option value="newest">📅 Mới nhất</option>
                  <option value="oldest">⏳ Cũ nhất</option>
                  <option value="name_asc">🔤 Tên (A - Z)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Email đăng nhập</th>
                    <th className="p-3">Mã dự thi (Student ID)</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-3 font-mono font-bold text-crimson">{u.studentId}</td>
                      <td className="p-3">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Thu hồi tài khoản"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: EXAM MANAGEMENT & AUTO-UNLOCK SCHEDULES */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Cấu hình Đề thi & Lịch mở tự động</h2>
                <p className="text-xs text-slate-500">Thiết lập thời gian Giờ mở kíp cho từng Module (Toán, Đọc hiểu, Khoa học)</p>
              </div>
              <a
                href="/admin/exams/editor"
                className="bg-crimson hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Mở Trình soạn thảo & Import đề thi (Authoring Workspace)
              </a>
            </div>

            <div className="space-y-4">
              {exams.map((exam) => {
                const currentStatus = exam.status || 'ĐÃ THI';
                const badgeStyle = currentStatus === 'CHƯA UPDATE' 
                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
                  : currentStatus === 'ĐÃ UPDATE'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';

                return (
                  <div key={exam.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{exam.title}</h3>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                            {exam.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{exam.description}</p>
                      </div>

                      {/* Phase 2 Target 1: Independent Exam Publishing Toggle */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-700">Xuất bản đề thi:</span>
                          <button
                            onClick={async () => {
                              const isCurrentlyPublished = exam.isPublished ?? (exam.status !== 'CHƯA UPDATE');
                              try {
                                const res = await fetch(`/api/admin/exams/${exam.id}/toggle`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ isPublished: !isCurrentlyPublished }),
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  setExams(prev => prev.map(e => e.id === exam.id ? { ...e, ...data.exam } : e));
                                }
                              } catch (err) {
                                console.error('Error toggling exam publish:', err);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs border ${
                              (exam.isPublished ?? (exam.status !== 'CHƯA UPDATE'))
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border-slate-300'
                            }`}
                          >
                            {(exam.isPublished ?? (exam.status !== 'CHƯA UPDATE')) ? '🟢 ĐÃ XUẤT BẢN' : '⚪ KHÓA ĐỀ THI'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Modules list */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {exam.modules.map((mod) => (
                        <div key={mod.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                            <span>{mod.title}</span>
                            <span className="text-slate-400 font-mono">{mod.durationMinutes} phút</span>
                          </div>
                          <div className="text-slate-600 space-y-1">
                            <div><strong>Giờ mở:</strong> {mod.openTime}</div>
                            <div><strong>Giờ đóng:</strong> {mod.closeTime}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ANTI-CHEAT MONITORING & LIVE AUDIT LOGS */}
        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Nhật ký Giám sát Gian lận (Anti-Cheat Audit Logs)
              </h2>
              <p className="text-xs text-slate-500">Theo dõi hành vi rời khỏi bài thi, chuyển tab trình duyệt của học sinh theo thời gian thực</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Thời gian ghi nhận</th>
                    <th className="p-3">Họ và tên thí sinh</th>
                    <th className="p-3">Mã dự thi</th>
                    <th className="p-3">Loại vi phạm</th>
                    <th className="p-3">Chi tiết sự kiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {antiCheatLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-rose-50/50 transition">
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')} {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{log.userName}</td>
                      <td className="p-3 font-mono font-bold text-crimson">{log.studentId}</td>
                      <td className="p-3">
                        <span className="bg-rose-100 text-rose-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                          {log.eventType === 'tab_switch' ? 'Chuyển Tab' : 'Rời màn hình'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* PROVISION NEW STUDENT MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Cấp tài khoản học sinh mới</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Lê Hoàng Nam"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email nhận thông tin *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nam.le@gmail.com"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mật khẩu cấp ban đầu</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 border border-slate-300 font-bold py-2.5 rounded-xl text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-crimson hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Cấp tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
