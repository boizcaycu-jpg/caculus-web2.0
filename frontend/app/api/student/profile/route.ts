import { NextRequest, NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/lib/db';
import { verifyJoseToken, verifyToken, signJoseToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get('caculus_token')?.value;
    const sessionCookie = req.cookies.get('caculus_session')?.value;

    let userPayload = token ? (await verifyJoseToken(token) || verifyToken(token)) : null;

    if (!userPayload && sessionCookie) {
      try {
        userPayload = JSON.parse(sessionCookie);
      } catch (e) {}
    }

    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' }, { status: 401 });
    }

    const body = await req.json();
    const realName = (body.realName || body.name || '').trim();

    if (!realName || realName.length < 2) {
      return NextResponse.json({ error: 'Vui lòng nhập Họ và tên đầy đủ hợp lệ' }, { status: 400 });
    }

    // 1. Update user record in data/db.json
    const updated = updateUser(userPayload.userId, {
      name: realName,
      realName: realName,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 });
    }

    // 2. Sign updated JWT payload
    const newPayload = {
      userId: updated.id,
      id: updated.id,
      email: updated.email,
      role: updated.role || 'student',
      name: realName,
      realName: realName,
      studentId: updated.studentId || ('CACULUS_' + String(updated.id).slice(-6)),
      isVip: updated.isVip ?? true,
    };

    const newToken = await signJoseToken(newPayload);

    // 3. Update HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      user: newPayload,
    });

    response.cookies.set('caculus_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('caculus_session', JSON.stringify(newPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    revalidatePath('/dashboard');
    revalidatePath('/leaderboard');

    return response;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Lỗi cập nhật thông tin cá nhân' }, { status: 500 });
  }
}
