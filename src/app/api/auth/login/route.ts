import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { dataStore } from '@/lib/dataStore';
import { loginSchema } from '@/lib/validations';
import { signToken, setAuthCookie } from '@/lib/jwt';
import { checkRateLimit, applySecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, 30, 60 * 1000);
    if (!rateCheck.success) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Too many login attempts. Please wait.' }, { status: 429 })
      );
    }

    const body = await req.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Validation error' },
          { status: 400 }
        )
      );
    }

    const { email, password } = validated.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check env admin match
    const envAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || '';

    const isMongo = await connectToDatabase();
    let foundUser: {
      id: string;
      name: string;
      email: string;
      passwordHash: string;
      role: 'user' | 'admin';
    } | null = null;

    if (isMongo) {
      const u = await User.findOne({ email: lowerEmail });
      if (u) {
        foundUser = {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role,
        };
      }
    } else {
      const u = dataStore.getUserByEmail(lowerEmail);
      if (u) {
        foundUser = {
          id: u._id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role,
        };
      }
    }

    // Direct match for env admin if DB user hasn't synced
    if (
      !foundUser &&
      envAdminEmail &&
      envAdminPassword &&
      lowerEmail === envAdminEmail &&
      password === envAdminPassword
    ) {
      const token = signToken({
        userId: 'usr-admin-env',
        email: envAdminEmail,
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'admin',
      });

      const response = NextResponse.json({
        message: 'Admin signed in successfully',
        user: {
          id: 'usr-admin-env',
          name: process.env.ADMIN_NAME || 'ReelBeat Administrator',
          email: envAdminEmail,
          role: 'admin',
        },
      });
      setAuthCookie(response, token);
      return applySecurityHeaders(response);
    }

    if (!foundUser) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        )
      );
    }

    const passwordMatch = await bcrypt.compare(password, foundUser.passwordHash);
    if (!passwordMatch && !(lowerEmail === envAdminEmail && password === envAdminPassword)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        )
      );
    }

    const token = signToken({
      userId: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    });

    const response = NextResponse.json({
      message: 'Signed in successfully',
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      },
    });

    setAuthCookie(response, token);
    return applySecurityHeaders(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
