import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('caculus_token');
  response.cookies.delete('caculus_session');
  return response;
}
