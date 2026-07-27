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

  if (moduleId) {
    const questions = getQuestionsByModule(moduleId);
    const questionGroups = getQuestionGroupsByModule(moduleId);

    return NextResponse.json({
      exams,
      submissions,
      questions,
      questionGroups,
    });
  }

  return NextResponse.json({
    exams,
    submissions,
  });
}
