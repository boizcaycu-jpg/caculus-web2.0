import { NextRequest, NextResponse } from 'next/server';
import { getExams, getQuestionsByModule, getQuestionGroupsByModule, getSubmissions } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  const token = req.cookies.get('caculus_token')?.value;
  const user = token ? verifyToken(token) : null;

  const exams = getExams();
  const submissions = user ? getSubmissions(user.userId) : [];

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (moduleId) {
    const rawQuestions = getQuestionsByModule(moduleId);
    const questions = rawQuestions.length > 0 ? rawQuestions : [
      {
        id: `q-test-${moduleId}`,
        moduleId: moduleId,
        number: 1,
        type: 'single_choice' as const,
        text: '[TEST]',
        options: [
          { id: 'opt-a', text: 'TEST A' },
          { id: 'opt-b', text: 'TEST B' },
          { id: 'opt-c', text: 'TEST C' },
          { id: 'opt-d', text: 'TEST D' },
        ],
        correctOptionId: 'opt-a',
        explanation: '',
        explanationImageUrl: '',
      }
    ];
    const questionGroups = getQuestionGroupsByModule(moduleId);

    return NextResponse.json({
      exams,
      submissions,
      questions,
      questionGroups,
    }, { headers });
  }

  return NextResponse.json({
    exams,
    submissions,
  }, { headers });
}
