'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { FileText, Download, Users, ExternalLink, Sparkles, MessageCircle, PlaySquare } from 'lucide-react';

export default function DocumentsPage() {
  const documents = [
    {
      id: 'doc-1',
      title: 'Bộ tài liệu Ôn luyện Tư duy Toán học TSA Bách Khoa 2026',
      category: 'Tư duy Toán học',
      fileSize: '4.2 MB',
      updatedAt: '15/05/2026',
      downloadUrl: '#',
    },
    {
      id: 'doc-2',
      title: 'Tuyển tập 50 Bài đọc hiểu Kỹ năng Phân tích Logic & Văn bản',
      category: 'Tư duy Đọc hiểu',
      fileSize: '6.8 MB',
      updatedAt: '20/05/2026',
      downloadUrl: '#',
    },
    {
      id: 'doc-3',
      title: 'Cẩm nang Giải quyết vấn đề Khoa học Lý - Hóa - Sinh ứng dụng',
      category: 'Tư duy Khoa học',
      fileSize: '8.1 MB',
      updatedAt: '02/06/2026',
      downloadUrl: '#',
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-crimson font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Trung tâm tài nguyên học tập CACULUS
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-crimson" />
            Tài liệu ôn tập & Đề thi mẫu PDF
          </h1>
          <p className="text-xs text-slate-500">Tải tài liệu dạng PDF trực tuyến để xem offline và rèn luyện kỹ năng làm bài trên giấy</p>
        </div>

        {/* Task 3: Prominent Channel & Community Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: YouTube Reference Channel */}
          <div className="bg-gradient-to-br from-rose-900 via-crimson to-red-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="space-y-3 z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                <PlaySquare className="w-4 h-4 text-red-200" />
                HỆ THỐNG BÀI GIẢNG VIDEO
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">
                Kênh tài liệu tham khảo
              </h2>
              <p className="text-xs text-rose-100 leading-relaxed">
                Tổng hợp video chữa chi tiết đề thi Đánh giá Tư duy TSA, hướng dẫn mẹo giải nhanh Toán học, Đọc hiểu & Khoa học từ các chuyên gia.
              </p>
            </div>

            <div className="pt-2 z-10">
              <a
                href="https://www.youtube.com/@siiuuuu77777"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-crimson font-black text-xs px-6 py-3 rounded-2xl transition shadow-md w-full sm:w-auto"
              >
                <PlaySquare className="w-4 h-4 text-red-600" />
                Ghé thăm Kênh YouTube Official
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Card 2: Zalo Study Support Community */}
          <div className="bg-gradient-to-br from-blue-900 via-indigo-700 to-sky-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="space-y-3 z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                <Users className="w-4 h-4 text-sky-200" />
                CỘNG ĐỒNG THÍ SINH TSA 2K8 - 2K9
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">
                Cộng đồng hỗ trợ học tập
              </h2>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Tham gia nhóm Zalo để trao đổi bài tập hàng ngày, nhận tài liệu độc quyền và giải đáp thắc mắc trực tiếp cùng đội ngũ cố vấn CACULUS.
              </p>
            </div>

            <div className="pt-2 z-10">
              <a
                href="https://zalo.me/g/mw6rrjaosw86oamzaxy1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-sky-50 text-indigo-900 font-black text-xs px-6 py-3 rounded-2xl transition shadow-md w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 text-sky-600" />
                Tham gia Nhóm Zalo Hỗ Trợ
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>

        </div>

        {/* PDF Downloads Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Danh sách File PDF tải về</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="bg-rose-50 text-crimson font-bold text-[11px] px-3 py-1 rounded-full border border-rose-200 inline-block">
                    {doc.category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">{doc.title}</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Dung lượng: <strong>{doc.fileSize}</strong></div>
                    <div>Cập nhật ngày: {doc.updatedAt}</div>
                  </div>
                </div>

                <a
                  href={doc.downloadUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Đang tải file PDF: ${doc.title}`);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Tải tài liệu PDF
                </a>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
