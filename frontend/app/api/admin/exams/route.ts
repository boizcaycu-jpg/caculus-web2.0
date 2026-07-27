import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getExams, createExam, updateExam, saveQuestionsForModule, saveQuestionGroupsForModule } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('caculus_token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(req: NextRequest) {
  const exams = getExams();
  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const newExam = createExam({
      id: 'exam-' + Date.now(),
      title: body.title,
      description: body.description || '',
      isFree: body.isFree ?? true,
      price: body.price,
      modules: body.modules || [],
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath('/admin/exams/editor');

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Lỗi tạo đề thi' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, moduleId, questions, questionGroups, ...updates } = body;

    let updatedExam = null;
    if (id) {
      updatedExam = updateExam(id, updates);
    }

    if (moduleId && Array.isArray(questions)) {
      saveQuestionsForModule(moduleId, questions);
    }

    if (moduleId && Array.isArray(questionGroups)) {
      saveQuestionGroupsForModule(moduleId, questionGroups);
    }

    // Aggressive Cache Busting across all student & admin views
    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath('/admin/exams/editor');
    if (id) {
      revalidatePath(`/exams/${id}`);
      revalidatePath(`/exams/${id}/room`);
    }

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error('Error updating exam/questions:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật đề thi' }, { status: 500 });
  }
}
