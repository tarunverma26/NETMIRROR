import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './jwt';

export function verifyAdminSession(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Authentication token is missing' },
        { status: 401 }
      ),
      payload: null,
    };
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
      payload: null,
    };
  }

  return {
    authorized: true,
    response: null,
    payload,
  };
}
