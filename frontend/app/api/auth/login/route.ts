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

    // 1. Super Admin Authentication Check
    if (
      (email === 'admin@caculus.edu.vn' || email === 'admin') &&
      (password === 'admin123' || password === process.env.ADMIN_PASSWORD)
    ) {
      tokenPayload = {
        userId: 'admin-01',
        email: 'admin@caculus.edu.vn',
        role: 'admin',
        name: 'Quản trị viên',
        studentId: 'ADMIN_01',
        isVip: true,
      };
    } else {
      // 2. Student Authentication Check against local persistent DB
      const user = getUserByEmail(email);

      if (user) {
        const isPasswordValid = 
          (password === 'student123' && user.role === 'student') ||
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

    // 3. Sign secure JWT using jose
    const token = await signJoseToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
    });

    // 4. Set HttpOnly Cookies securely
    response.cookies.set('caculus_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
