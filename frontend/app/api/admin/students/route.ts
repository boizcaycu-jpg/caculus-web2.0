import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUsers } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('caculus_token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('students').select('*');
    if (!error && data && data.length > 0) {
      return NextResponse.json({ students: data, users: data });
    }
  }

  const users = getUsers();
  return NextResponse.json({ students: users, users });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const { email, password, name, role, studentId, isVip } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Thiếu thông tin yêu cầu' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const finalStudentId = studentId || 'CACULUS_' + Math.floor(100000 + Math.random() * 900000);
    const userRole = role || 'student';
    const isVipUser = isVip ?? true;

    const newId = 'user-' + Date.now();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('students').insert([
          {
            id: newId,
            email,
            password_hash: passwordHash,
            name,
            student_id: finalStudentId,
            role: userRole,
            is_vip: isVipUser,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (sbErr) {
        console.error('Supabase insert student error:', sbErr);
      }
    }

    const created = createUser({
      id: newId,
      email,
      passwordHash,
      name,
      studentId: finalStudentId,
      role: userRole,
      isVip: isVipUser,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/admin');
    revalidatePath('/admin/students');

    return NextResponse.json({ success: true, user: created, student: created });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Không thể tạo tài khoản' }, { status: 500 });
  }
}
