import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/jwt';
import { applySecurityHeaders } from '@/lib/security';

export async function POST() {
  const response = NextResponse.json({ message: 'Signed out successfully' });
  clearAuthCookie(response);
  return applySecurityHeaders(response);
}
