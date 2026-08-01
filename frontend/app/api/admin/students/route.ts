import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';
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

  try {
    const localUsers = getUsers();
    const formattedStudents = localUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.studentId || u.id,
      role: u.role || 'student',
      isVip: u.isVip ?? true,
      createdAt: u.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, students: formattedStudents, users: formattedStudents });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, error: 'Lỗi lấy danh sách học sinh' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentId, name, email, password, isVip, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ Email, Họ tên và Mật khẩu' }, { status: 400 });
    }

    const finalStudentId = studentId || ('CACULUS_' + Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await hashPassword(password);
    const newId = 'user-' + Date.now();

    const created = createUser({
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

    return NextResponse.json({ success: true, data: created, student: created, user: created });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo tài khoản học sinh' }, { status: 500 });
  }
}
