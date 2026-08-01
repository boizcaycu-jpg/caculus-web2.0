import { NextResponse } from 'next/server';
import { getUsers, getSubmissions } from '@/lib/db';

export async function GET() {
  // Only include students who have completed the mandatory Name Entry flow (realName is set)
  const users = getUsers().filter(
    u => u.role === 'student' && (u.name || u.realName) && (u.name !== 'null') && String(u.name || u.realName).trim() !== ''
  );
  const submissions = getSubmissions();

  const leaderboard = users.map((student) => {
    const studentSubmissions = submissions.filter(s => s.userId === student.id);
    const totalExams = studentSubmissions.length;
    const highestScore = studentSubmissions.reduce((max, s) => Math.max(max, s.score), 0);
    const avgScore = totalExams > 0 
      ? Math.round(studentSubmissions.reduce((sum, s) => sum + s.score, 0) / totalExams)
      : 0;

    return {
      rank: 0,
      id: student.id,
      name: student.realName || student.name,
      studentId: student.studentId,
      totalExams,
      highestScore,
      avgScore,
    };
  });

  leaderboard.sort((a, b) => b.highestScore - a.highestScore || b.totalExams - a.totalExams);

  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return NextResponse.json({ leaderboard });
}
