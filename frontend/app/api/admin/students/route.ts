import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getUsers, createUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

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
        console.error('Supabase fetch failed during GET /students, falling back to local DB:', sbErr);
      }
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

    let createdFromSupabase: any = null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert([supabasePayload])
          .select();

        if (!error && data && data.length > 0) {
          createdFromSupabase = data[0];
        } else if (error) {
          console.error('Supabase student insert error:', error.message);
        }
      } catch (sbErr) {
        console.error('Supabase network fetch failed, falling back to local DB:', sbErr);
      }
    }

    // Sync with local backup db as fallback
    let createdLocal: any = null;
    try {
      createdLocal = createUser({
        id: newId,
        email,
        passwordHash,
        name,
        studentId: finalStudentId,
        role: role || 'student',
        isVip: isVip ?? true,
        createdAt: supabasePayload.created_at,
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
      createdAt: createdFromSupabase.created_at,
    } : (createdLocal || {
      id: newId,
      name,
      email,
      studentId: finalStudentId,
      role: role || 'student',
      isVip: isVip ?? true,
      createdAt: supabasePayload.created_at,
    });

    return NextResponse.json({ success: true, data: created, student: created, user: created });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo tài khoản học sinh' }, { status: 500 });
  }
}
