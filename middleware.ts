import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'reelbeat_token';

// Edge-safe JWT payload decoder and verification helper
function decodeJwtPayload(token: string): { role?: string; userId?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files, internal next paths, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/content')
  ) {
    return NextResponse.next();
  }

  // 2. Allow admin login page itself without being an admin yet
  if (pathname === '/admin/login') {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return NextResponse.next();
  }

  // 3. Admin routes protection: /admin and /api/admin/*
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const token =
      request.cookies.get(AUTH_COOKIE_NAME)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin credentials required.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const payload = decodeJwtPayload(token);

    if (!payload || payload.role !== 'admin') {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Forbidden. Admin privileges required.' },
          { status: 403 }
        );
      }
      // Non-admin users are strictly redirected to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
