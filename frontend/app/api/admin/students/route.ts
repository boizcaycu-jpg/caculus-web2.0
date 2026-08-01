import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getUsers, createUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          studentId: s.student_id || s.studentId || ('CACULUS_' + String(s.id).slice(-6)),
          role: s.role || 'student',
          isVip: s.is_vip ?? s.isVip ?? true,
          createdAt: s.created_at || s.createdAt || new Date().toISOString(),
        }));

        return NextResponse.json({ success: true, students: formatted, users: formatted });
      }
    }

    // Fallback to local DB if Supabase isn't configured or returns empty
    const localUsers = getUsers();
    const formattedLocal = localUsers.map((u) => ({
      ...u,
      studentId: u.studentId || u.id,
      isVip: u.isVip ?? true,
    }));

    return NextResponse.json({ success: true, students: formattedLocal, users: formattedLocal });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi lấy danh sách học sinh' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, name, email, password, isVip, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ Email, Họ tên và Mật khẩu' }, { status: 400 });
    }

    const finalStudentId = studentId || ('CACULUS_' + Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await hashPassword(password);
    const newId = 'user-' + Date.now();

    const supabasePayload = {
      id: newId,
      student_id: finalStudentId,
      name,
      email,
      password_hash: passwordHash,
      is_vip: isVip ?? true,
      role: role || 'student',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('students')
        .insert([supabasePayload])
        .select();

      if (error) {
        console.error('Supabase student insert error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Lỗi lưu thông tin học sinh vào CSDL Supabase' }, { status: 500 });
      }

      // Sync with local backup db as fallback
      try {
        createUser({
          id: newId,
          email,
          passwordHash,
          name,
          studentId: finalStudentId,
          role: role || 'student',
          isVip: isVip ?? true,
          createdAt: supabasePayload.created_at,
        });
      } catch (e) {}

      revalidatePath('/admin');
      revalidatePath('/admin/students');

      const created = data && data[0] ? {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        studentId: data[0].student_id || finalStudentId,
        role: data[0].role || 'student',
        isVip: data[0].is_vip ?? true,
        createdAt: data[0].created_at,
      } : supabasePayload;

      return NextResponse.json({ success: true, data: created, student: created, user: created });
    }

    // Local DB fallback
    const createdLocal = createUser({
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

    return NextResponse.json({ success: true, data: createdLocal, student: createdLocal, user: createdLocal });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo tài khoản học sinh' }, { status: 500 });
  }
}
