import { NextRequest, NextResponse } from 'next/server';
import { getExams, getQuestionsByModule, getQuestionGroupsByModule, getSubmissions } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  const token = req.cookies.get('caculus_token')?.value;
  const user = token ? verifyToken(token) : null;

  let exams: any[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        exams = data.map(e => ({
          ...e,
          isPublished: e.is_published ?? (e.status !== 'CHƯA UPDATE'),
          isFree: e.is_free ?? true,
        }));
      }
    } catch (sbErr) {
      console.error('Supabase getExams error:', sbErr);
    }
  }

  if (exams.length === 0) {
    exams = getExams();
  }

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
