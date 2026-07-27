import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, deleteUser } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';

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

  const users = getUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const { email, password, name, role, studentId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Thiếu thông tin yêu cầu' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = createUser({
      id: 'user-' + Date.now(),
      email,
      passwordHash,
      name,
      studentId: studentId || 'CACULUS_' + Math.floor(100000 + Math.random() * 900000),
      role: role || 'student',
      createdAt: new Date().toISOString(),
    });

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

  const success = deleteUser(id);
  return NextResponse.json({ success });
}
