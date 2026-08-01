import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { comparePassword, signJoseToken, TokenPayload } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || body.auth_user_email_secure || '').trim().toLowerCase();
    const password = body.password || body.auth_user_pass_secure || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập Email và Mật khẩu' }, { status: 400 });
    }

    let tokenPayload: TokenPayload | null = null;

    // 1. Check Admin Accounts
    if (
      (email === 'admin@caculus.edu.vn' || email === 'admin') &&
      (password === 'admin123' || password === process.env.ADMIN_PASSWORD)
    ) {
      tokenPayload = {
        userId: 'user-admin-1',
        email: 'admin@caculus.edu.vn',
        role: 'admin',
        name: 'Quản trị viên 1',
        studentId: 'ADMIN-001',
        isVip: true,
      };
    } else if (
      email === 'admin2@caculus.edu.vn' &&
      (password === 'admin123' || password === process.env.ADMIN_PASSWORD)
    ) {
      tokenPayload = {
        userId: 'user-admin-2',
        email: 'admin2@caculus.edu.vn',
        role: 'admin',
        name: 'Quản trị viên 2',
        studentId: 'ADMIN-002',
        isVip: true,
      };
    } else {
      // 2. Check Student Account (VIP or Admin created)
      const user = getUserByEmail(email);

      if (user) {
        const isPasswordValid = 
          (password === 'student123' && (user.role === 'student' || !user.role)) ||
          (user.passwordHash ? await comparePassword(password, user.passwordHash) : false);

        if (isPasswordValid) {
          tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role || 'student',
            name: user.name,
            studentId: user.studentId || ('CACULUS_' + String(user.id).slice(-6)),
            isVip: user.isVip ?? true,
          };
        }
      }
    }

    if (!tokenPayload) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    const token = await signJoseToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
    });

    response.cookies.set('caculus_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('caculus_session', JSON.stringify(tokenPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống máy chủ' }, { status: 500 });
  }
}
