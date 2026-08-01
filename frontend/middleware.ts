import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('caculus_token')?.value || request.cookies.get('caculus_session')?.value;
  const url = request.nextUrl.clone();

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
