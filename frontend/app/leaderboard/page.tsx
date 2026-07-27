'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Award, Trophy, Medal, Star, Sparkles, UserCheck } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      });
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Header Title Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200 shadow-xs">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Bảng Xếp Hạng Toàn Hệ Thống CACULUS TSA</h1>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Bảng vinh danh 30 thí sinh xuất sắc nhất có kết quả bài thi Tư duy cao nhất trên hệ thống khảo thí tự động.
          </p>
        </div>

        {/* Podium Top 3 Showcase */}
        {!loading && top3.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Rank 2 (Silver) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md flex flex-col items-center text-center space-y-3 relative order-2 md:order-1 mt-0 md:mt-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-2xl border-2 border-slate-300 shadow-inner">
                🥈
              </div>
              <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">HẠNG 2</span>
              <h3 className="font-extrabold text-slate-900 text-lg">{top3[1]?.name}</h3>
              <p className="text-xs font-mono text-slate-500">{top3[1]?.studentId}</p>
              <div className="text-2xl font-black text-slate-800">{top3[1]?.highestScore}%</div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="bg-gradient-to-b from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex flex-col items-center text-center space-y-3 relative order-1 md:order-2 border-2 border-amber-300">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md text-amber-100 flex items-center justify-center font-black text-4xl border-2 border-amber-200 shadow-lg">
                🥇
              </div>
              <span className="bg-amber-400 text-amber-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">QUÁN QUÂN SYSTEM</span>
              <h3 className="font-black text-white text-xl">{top3[0]?.name}</h3>
              <p className="text-xs font-mono text-amber-100">{top3[0]?.studentId}</p>
              <div className="text-4xl font-black text-white">{top3[0]?.highestScore}%</div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md flex flex-col items-center text-center space-y-3 relative order-3 mt-0 md:mt-8">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-black text-2xl border-2 border-amber-200 shadow-inner">
                🥉
              </div>
              <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">HẠNG 3</span>
              <h3 className="font-extrabold text-slate-900 text-lg">{top3[2]?.name}</h3>
              <p className="text-xs font-mono text-slate-500">{top3[2]?.studentId}</p>
              <div className="text-2xl font-black text-amber-800">{top3[2]?.highestScore}%</div>
            </div>

          </div>
        )}

        {/* Full 30 Students Table View */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-hidden space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-crimson" />
              Danh sách chi tiết Top 30 Thí sinh
            </h2>
            <span className="text-xs text-slate-400 font-medium">Cập nhật tự động</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3 text-center">Hạng</th>
                  <th className="p-3">Họ và tên Thí sinh</th>
                  <th className="p-3">Mã định danh Student ID</th>
                  <th className="p-3 text-center">Số bài đã làm</th>
                  <th className="p-3 text-right">Điểm cao nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((item) => {
                  let rankBadge = <span className="font-mono font-bold text-slate-600">#{item.rank}</span>;
                  if (item.rank === 1) rankBadge = <span className="text-xl">🥇</span>;
                  if (item.rank === 2) rankBadge = <span className="text-xl">🥈</span>;
                  if (item.rank === 3) rankBadge = <span className="text-xl">🥉</span>;

                  const isTop3 = item.rank <= 3;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-3.5 text-center">{rankBadge}</td>
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        {item.name}
                        {isTop3 && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{item.studentId}</td>
                      <td className="p-3.5 text-center font-mono font-semibold text-slate-700">{item.totalExams || 1} bài</td>
                      <td className="p-3.5 text-right font-mono font-black text-crimson text-base">
                        {item.highestScore}%
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Đang tải danh sách bảng xếp hạng...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
