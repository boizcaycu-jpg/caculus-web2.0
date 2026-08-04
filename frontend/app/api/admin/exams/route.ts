import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getExams, createExam, updateExam, deleteExam, saveQuestionsForModule, saveQuestionGroupsForModule } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const exams = getExams();
  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newId = body.id || 'exam-' + Date.now();
    const isPub = body.isPublished ?? false;
    const stat = body.status || (isPub ? 'ĐÃ UPDATE' : 'CHƯA UPDATE');

    const newExam = createExam({
      id: newId,
      title: body.title,
      description: body.description || '',
      isFree: body.isFree ?? false,
      isDemoExam: body.isDemoExam ?? false,
      isPublished: isPub,
      category: body.category || 'THỰC CHIẾN',
      subCategory: body.subCategory || 'math',
      status: stat,
      price: body.price || 0,
      modules: body.modules || [],
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/exams');
    revalidatePath('/admin/exams');

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Lỗi tạo đề thi' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/exams');
    revalidatePath('/admin/exams');
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

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID bài thi' }, { status: 400 });
  }

  const success = deleteExam(id);

  revalidatePath('/exams');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/exams');
  revalidatePath('/admin/exams');

  return NextResponse.json({ success });
}
