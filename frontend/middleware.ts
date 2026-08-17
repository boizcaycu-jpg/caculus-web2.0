import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Allow instant direct access to the Local Authoring Editor without login
  if (url.pathname.startsWith('/admin/exams/editor')) {
    return NextResponse.next();
  }

  const token = 
    request.cookies.get('caculus_token')?.value || 
    request.cookies.get('caculus_session')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  if (!token && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard'))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
