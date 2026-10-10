import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Please log in to save to watchlist' }, { status: 401 })
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Session expired' }, { status: 401 })
      );
    }

    const { contentId } = await req.json();
    if (!contentId) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Content ID required' }, { status: 400 })
      );
    }

    const isMongo = await connectToDatabase();
    let updatedWatchlist: string[] = [];

    if (isMongo) {
      const user = await User.findById(payload.userId);
      if (user) {
        const idx = user.watchlist.indexOf(contentId);
        if (idx >= 0) {
          user.watchlist.splice(idx, 1);
        } else {
          user.watchlist.push(contentId);
        }
        await user.save();
        updatedWatchlist = user.watchlist;
      }
    } else {
      updatedWatchlist = dataStore.toggleWatchlist(payload.userId, contentId);
    }

    return applySecurityHeaders(
      NextResponse.json({
        message: 'Watchlist updated',
        watchlist: updatedWatchlist,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Watchlist update failed';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
