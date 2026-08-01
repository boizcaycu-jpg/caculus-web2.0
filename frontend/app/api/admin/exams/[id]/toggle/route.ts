import { NextRequest, NextResponse } from 'next/server';
import { updateExam, getExamById } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    const body = await req.json().catch(() => ({}));

    const existing = getExamById(examId);
    const nextPublished = typeof body.isPublished === 'boolean' 
      ? body.isPublished 
      : typeof body.is_published === 'boolean'
        ? body.is_published
        : !(existing?.isPublished ?? (existing?.status !== 'CHƯA UPDATE'));

    const nextStatus = nextPublished ? 'ĐÃ UPDATE' : 'CHƯA UPDATE';

    const updated = updateExam(examId, {
      isPublished: nextPublished,
      status: nextStatus,
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/exams');
    revalidatePath('/exams');

    return NextResponse.json({
      success: true,
      exam: updated || { id: examId, isPublished: nextPublished, status: nextStatus },
    });
  } catch (error) {
    console.error('Toggle exam publish error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật trạng thái xuất bản' }, { status: 500 });
  }
}
