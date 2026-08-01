import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, deleteUser } from '@/lib/db';
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
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (!error && data && data.length > 0) {
        const formatted = data.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          studentId: u.student_id || u.studentId,
          role: u.role || 'student',
          isVip: u.is_vip ?? u.isVip ?? true,
          createdAt: u.created_at || u.createdAt,
        }));
        return NextResponse.json({ users: formatted });
      }
    } catch (sbErr) {
      console.error('Supabase getUsers error:', sbErr);
    }
  }

  const users = getUsers();
  return NextResponse.json({ users });
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
            role: role || 'student',
            is_vip: isVip ?? true,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (sbErr) {
        console.error('Supabase createUser error:', sbErr);
      }
    }

    const newUser = createUser({
      id: newId,
      email,
      passwordHash,
      name,
      studentId: finalStudentId,
      role: role || 'student',
      isVip: isVip ?? true,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/admin');
    revalidatePath('/admin/students');

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Không thể tạo tài khoản' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 });
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('students').delete().eq('id', id);
    } catch (sbErr) {
      console.error('Supabase deleteUser error:', sbErr);
    }
  }

  const success = deleteUser(id);
  revalidatePath('/admin');
  return NextResponse.json({ success: true });
}
