'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamsPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center text-slate-500 font-semibold text-sm">
        Đang chuyển hướng về Trang Tổng quan...
      </div>
    </div>
  );
}
