'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldAlert, Award, FileText, Phone, LayoutDashboard, Menu, X } from 'lucide-react';
import { TokenPayload } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('caculus_user');
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Hide main nav in exam room mode for full immersion
  if (pathname.includes('/room')) {
    return null;
  }

  return (
    <header className="bg-[#d90429] border-b border-rose-800 sticky top-0 z-40 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/logo-caculus.png"
              alt="CACULUS Logo"
              width={180}
              height={48}
              className="h-10 w-auto object-contain shrink-0"
              priority
            />
            <div className="hidden sm:flex flex-col border-l border-white/30 pl-3">
              <span className="text-xs font-black tracking-wider text-white">CACULUS TSA</span>
              <span className="text-[11px] text-rose-100 font-extrabold">Phòng Luyện Mô Phỏng TSA</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-xl transition ${
              pathname === '/dashboard' || pathname === '/' ? 'bg-white/20 text-white shadow-xs' : 'text-rose-100 hover:bg-white/15 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Tổng quan
          </Link>
          <Link
            href="/documents"
            className={`flex items-center gap-1.5 text-sm font-extrabold px-3.5 py-2 rounded-xl transition ${
              pathname === '/documents' ? 'bg-white/20 text-white shadow-xs' : 'text-rose-100 hover:bg-white/15 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Tài liệu
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center gap-1.5 text-sm font-extrabold px-3.5 py-2 rounded-xl transition ${
              pathname === '/leaderboard' ? 'bg-white/20 text-white shadow-xs' : 'text-rose-100 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            Bảng xếp hạng
          </Link>
          <Link
            href="/contact"
            className={`flex items-center gap-1.5 text-sm font-extrabold px-3.5 py-2 rounded-xl transition ${
              pathname === '/contact' ? 'bg-white/20 text-white shadow-xs' : 'text-rose-100 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            Liên hệ
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-black text-amber-950 bg-amber-400 border border-amber-300 px-4 py-2 rounded-xl hover:bg-amber-300 transition shadow-xs ml-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-950" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-white">{user.name || user.realName || 'Thí sinh VIP'}</div>
                <div className="text-[11px] font-mono text-rose-100">{user.studentId} • VIP ACCOUNT</div>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-rose-100 hover:text-white hover:bg-white/15 rounded-full transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-white text-[#d90429] font-black px-4 py-2 rounded-xl text-sm hover:bg-rose-50 transition shadow-sm"
            >
              Đăng nhập
            </Link>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/15 rounded-lg focus:outline-none"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-rose-900 border-b border-rose-800 px-4 pt-2 pb-4 space-y-2 text-white">
          <Link href="/dashboard" className="block font-bold py-2 px-3 rounded-lg hover:bg-white/10">Tổng quan</Link>
          <Link href="/documents" className="block font-bold py-2 px-3 rounded-lg hover:bg-white/10">Tài liệu ôn tập</Link>
          <Link href="/leaderboard" className="block font-bold py-2 px-3 rounded-lg hover:bg-white/10">Bảng xếp hạng</Link>
          <Link href="/contact" className="block font-bold py-2 px-3 rounded-lg hover:bg-white/10">Liên hệ trợ giúp</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="block text-amber-300 font-black py-2 px-3 rounded-lg hover:bg-white/10">Quản trị Admin</Link>
          )}
        </div>
      )}
    </header>
  );
}
