'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Mail, Phone, MapPin, Send, HelpCircle, Code, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-crimson">HỖ TRỢ THÍ SINH & ĐỘI NGŨ PHÁT TRIỂN</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Liên hệ & Trợ giúp Kỹ thuật</h1>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Hệ thống khảo thí CACULUS TSA được phát triển bởi đội ngũ Senior Full-Stack Developers nhằm tối ưu hóa trải nghiệm luyện đề Đánh giá Tư duy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-crimson flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Email Hỗ trợ</h3>
              <p className="text-xs text-slate-600 font-mono">support.caculus.edu.vn@gmail.com</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-crimson flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Hotline Kỹ thuật</h3>
              <p className="text-xs text-slate-600 font-mono">0767588269</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-crimson flex items-center justify-center mx-auto">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Phiên bản Hệ thống</h3>
              <p className="text-xs text-slate-600 font-mono">CACULUS v2.6 Pro</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
