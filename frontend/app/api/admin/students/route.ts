import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { hashPassword } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');

      if (!error && data && data.length > 0) {
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
    } catch (sbErr) {
      console.error('Supabase SSR GET /students fetch error:', sbErr);
    }

    // Fallback to local DB if Supabase isn't configured or returns empty or fetch fails
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

    const supabase = await createClient();
    const finalStudentId = studentId || ('CACULUS_' + Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await hashPassword(password);
    const newUuid = crypto.randomUUID();

    let createdFromSupabase: any = null;

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            id: newUuid,
            student_id: finalStudentId,
            name: name,
            email: email,
            password: password,
          }
        ])
        .select();

      if (!error && data && data.length > 0) {
        createdFromSupabase = data[0];
      } else if (error) {
        console.error('Supabase SSR student insert error:', error.message);
        // Try retry payload with all columns
        const { data: data2, error: error2 } = await supabase
          .from('students')
          .insert([
            {
              id: newUuid,
              student_id: finalStudentId,
              name: name,
              email: email,
              password: password,
              password_hash: passwordHash,
              is_vip: isVip ?? true,
              role: role || 'student',
              created_at: new Date().toISOString(),
            }
          ])
          .select();

        if (!error2 && data2 && data2.length > 0) {
          createdFromSupabase = data2[0];
        }
      }
    } catch (sbErr) {
      console.error('Supabase SSR POST /students fetch error:', sbErr);
    }

    // Sync with local backup db as fallback
    let createdLocal: any = null;
    try {
      createdLocal = createUser({
        id: newUuid,
        email,
        passwordHash,
        name,
        studentId: finalStudentId,
        role: role || 'student',
        isVip: isVip ?? true,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Local DB createUser error:', e);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/students');

    const created = createdFromSupabase ? {
      id: createdFromSupabase.id,
      name: createdFromSupabase.name,
      email: createdFromSupabase.email,
      studentId: createdFromSupabase.student_id || finalStudentId,
      role: createdFromSupabase.role || 'student',
      isVip: createdFromSupabase.is_vip ?? true,
      createdAt: createdFromSupabase.created_at || new Date().toISOString(),
    } : (createdLocal || {
      id: newUuid,
      name,
      email,
      studentId: finalStudentId,
      role: role || 'student',
      isVip: isVip ?? true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: created, student: created, user: created });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo tài khoản học sinh' }, { status: 500 });
  }
}
