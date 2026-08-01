import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getExams, createExam, updateExam, saveQuestionsForModule, saveQuestionGroupsForModule } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
      console.error('Supabase admin getExams error:', sbErr);
    }
  }

  if (exams.length === 0) {
    exams = getExams();
  }

  return NextResponse.json({ exams });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const newId = 'exam-' + Date.now();
    const isPub = body.isPublished ?? true;
    const stat = body.status || (isPub ? 'ĐÃ UPDATE' : 'CHƯA UPDATE');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exams').insert([
          {
            id: newId,
            title: body.title,
            description: body.description || '',
            is_free: body.isFree ?? true,
            is_published: isPub,
            status: stat,
            price: body.price || 0,
            modules: body.modules || [],
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (sbErr) {
        console.error('Supabase createExam error:', sbErr);
      }
    }

    const newExam = createExam({
      id: newId,
      title: body.title,
      description: body.description || '',
      isFree: body.isFree ?? true,
      isPublished: isPub,
      status: stat,
      price: body.price,
      modules: body.modules || [],
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/exams');
    revalidatePath('/dashboard');
    revalidatePath('/admin/exams');
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

    if (id && isSupabaseConfigured) {
      try {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.isPublished !== undefined) payload.is_published = updates.isPublished;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.modules !== undefined) payload.modules = updates.modules;

        if (Object.keys(payload).length > 0) {
          await supabase.from('exams').update(payload).eq('id', id);
        }
      } catch (sbErr) {
        console.error('Supabase updateExam error:', sbErr);
      }
    }

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
    revalidatePath('/admin/exams');
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
