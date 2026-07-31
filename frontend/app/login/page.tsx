'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('caculus_user', JSON.stringify(data.user));
        }
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError(data.error || 'Đăng nhập không thành công');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background subtle watermark design */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-2xl shadow-sm border border-slate-200">
            <span className="bg-crimson text-white font-black text-2xl tracking-tighter px-3 py-0.5 rounded-lg">
              CACULUS
            </span>
            <span className="text-xs font-bold text-slate-700 tracking-wider">TSA PORTAL</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Hệ thống khảo thí & Đánh giá tư duy chuẩn quốc gia</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Đăng nhập</h1>
            <p className="text-xs text-slate-500">Tài khoản được cấp bởi Quản trị viên hệ thống</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="new-password" className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  name="auth_user_email_secure"
                  id="auth_user_email_secure"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Nhập email tài khoản..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 focus:border-crimson transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mật khẩu *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  name="auth_user_pass_secure"
                  id="auth_user_pass_secure"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 focus:border-crimson transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-crimson hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Login options */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block text-center">
              Chọn tài khoản thử nghiệm nhanh
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@caculus.edu.vn', 'student123')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-crimson/30 transition text-xs space-y-0.5"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-crimson" /> Thí sinh Demo
                </div>
                <div className="text-[10px] text-slate-500">Tài khoản thí sinh</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@caculus.edu.vn', 'admin123')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400/40 transition text-xs space-y-0.5"
              >
                <div className="font-bold text-amber-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Admin
                </div>
                <div className="text-[10px] text-slate-500">Quản trị viên</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
