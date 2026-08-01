import { NextRequest, NextResponse } from 'next/server';
import { verifyJoseToken, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('caculus_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let payload = await verifyJoseToken(token);
  if (!payload) {
    payload = verifyToken(token);
  }

  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: payload });
}
