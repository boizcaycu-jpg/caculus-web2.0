import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getExamById, updateExam, saveQuestionsForModule, saveQuestionGroupsForModule } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('caculus_token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exam = getExamById(id);
  if (!exam) {
    return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 });
  }
  return NextResponse.json({ exam });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { moduleId, questions, questionGroups, ...updates } = body;

    const updatedExam = updateExam(id, updates);

    if (moduleId && Array.isArray(questions)) {
      saveQuestionsForModule(moduleId, questions);
    }

    if (moduleId && Array.isArray(questionGroups)) {
      saveQuestionGroupsForModule(moduleId, questionGroups);
    }

    // Flush cache so student view reflects changes immediately
    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath(`/exams/${id}`);
    revalidatePath(`/exams/${id}/room`);

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật đề thi' }, { status: 500 });
  }
}
