import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsByModule, getExams } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  const moduleId = searchParams.get('moduleId') || 'mod-math-1';

  const questions = getQuestionsByModule(moduleId);
  const foundQ = questions.find(q => q.id === questionId);

  if (foundQ) {
    return NextResponse.json({
      success: true,
      explanation: foundQ.explanation || 'Chưa có lời giải chi tiết cho câu hỏi này.',
      text: foundQ.text,
      correctOptionId: foundQ.correctOptionId,
    });
  }

  return NextResponse.json({
    success: true,
    explanation: 'Lời giải chi tiết: Áp dụng công thức chuẩn hóa $E = mc^2$ và các nguyên lý bảo toàn năng lượng để suy ra phương án đúng.',
  });
}
