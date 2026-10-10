import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return applySecurityHeaders(
        NextResponse.json({ user: null }, { status: 200 })
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return applySecurityHeaders(
        NextResponse.json({ user: null }, { status: 200 })
      );
    }

    const isMongo = await connectToDatabase();
    let userDetails = null;

    if (isMongo) {
      const dbUser = await User.findById(payload.userId).select('-passwordHash');
      if (dbUser) {
        userDetails = {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          watchlist: dbUser.watchlist || [],
        };
      }
    } else {
      const storeUser = dataStore.getUserById(payload.userId);
      if (storeUser) {
        userDetails = {
          id: storeUser._id,
          name: storeUser.name,
          email: storeUser.email,
          role: storeUser.role,
          watchlist: storeUser.watchlist || [],
        };
      }
    }

    if (!userDetails) {
      // Fallback to token payload
      userDetails = {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        watchlist: [],
      };
    }

    return applySecurityHeaders(
      NextResponse.json({ user: userDetails }, { status: 200 })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification error';
    return applySecurityHeaders(
      NextResponse.json({ error: message, user: null }, { status: 500 })
    );
  }
}
