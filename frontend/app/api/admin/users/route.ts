import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, deleteUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    const users = getUsers().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.studentId || u.id,
      role: u.role || 'student',
      isVip: u.isVip ?? true,
      createdAt: u.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, users, students: users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Lỗi lấy danh sách tài khoản' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, studentId, isVip } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin yêu cầu' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const finalStudentId = studentId || 'CACULUS_' + Math.floor(100000 + Math.random() * 900000);
    const newId = 'user-' + Date.now();

    const newUser = createUser({
      id: newId,
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      studentId: finalStudentId,
      role: role || 'student',
      isVip: isVip ?? true,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/admin');
    revalidatePath('/admin/students');

    return NextResponse.json({ success: true, user: newUser, data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Không thể tạo tài khoản' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 });
  }

  const success = deleteUser(id);
  revalidatePath('/admin');
  revalidatePath('/admin/students');

  return NextResponse.json({ success: true });
}
