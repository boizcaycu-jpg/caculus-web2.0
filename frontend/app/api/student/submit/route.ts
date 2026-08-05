import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsByModule, createSubmission } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { UserAnswer } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('caculus_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Phiên làm việc hết hạn' }, { status: 401 });
    }

    const { examId, moduleId, answers, antiCheatViolationCount } = await req.json();

    if (!examId || !moduleId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Dữ liệu nộp bài không hợp lệ' }, { status: 400 });
    }

    const questions = getQuestionsByModule(moduleId);
    let correctCount = 0;

    const gradedAnswers = answers.map((ans: UserAnswer) => {
      const q = questions.find(question => question.id === ans.questionId);
      let isCorrect = false;

      if (q) {
        if (q.type === 'multiple_choice') {
          // Compare student selected True option IDs against q.correctOptionIds
          const correctIds = q.correctOptionIds || [];
          const studentIds = ans.selectedOptionIds || [];
          const isMatch = correctIds.length === studentIds.length && correctIds.every(id => studentIds.includes(id));
          isCorrect = isMatch;
        } else if (q.type === 'fill_blank') {
          const accepted = q.fillBlankAnswers || [];
          const val = (ans.fillBlankValue || '').trim().toLowerCase();
          isCorrect = accepted.some(a => a.trim().toLowerCase() === val);
        } else {
          isCorrect = q.correctOptionId === ans.selectedOptionId;
        }
      }

      if (isCorrect) correctCount++;
      return {
        ...ans,
        isCorrect,
      };
    });

    const totalQuestions = questions.length > 0 ? questions.length : answers.length;
    const score = Math.round((correctCount / (totalQuestions || 1)) * 100);

    const submission = createSubmission({
      id: 'sub-' + Date.now(),
      examId,
      moduleId,
      userId: user.userId,
      userName: user.name,
      studentId: user.studentId,
      score,
      totalQuestions,
      correctCount,
      answers: gradedAnswers,
      submittedAt: new Date().toISOString(),
      antiCheatViolationCount: antiCheatViolationCount || 0,
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json({ error: 'Lỗi nộp bài thi' }, { status: 500 });
  }
}
