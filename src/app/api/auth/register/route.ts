import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { dataStore } from '@/lib/dataStore';
import { registerSchema } from '@/lib/validations';
import { signToken, setAuthCookie } from '@/lib/jwt';
import { checkRateLimit, applySecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, 20, 60 * 1000);
    if (!rateCheck.success) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
      );
    }

    const body = await req.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Validation error' },
          { status: 400 }
        )
      );
    }

    const { name, email, password } = validated.data;
    const lowerEmail = email.toLowerCase();
    const isMongo = await connectToDatabase();

    let existingUser = null;
    if (isMongo) {
      existingUser = await User.findOne({ email: lowerEmail });
    } else {
      existingUser = dataStore.getUserByEmail(lowerEmail);
    }

    if (existingUser) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        )
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser;
    if (isMongo) {
      const created = await User.create({
        name,
        email: lowerEmail,
        passwordHash,
        role: 'user',
      });
      newUser = {
        userId: created._id.toString(),
        name: created.name,
        email: created.email,
        role: created.role as 'user' | 'admin',
      };
    } else {
      const created = dataStore.createUser({
        name,
        email: lowerEmail,
        passwordHash,
        role: 'user',
        watchlist: [],
      });
      newUser = {
        userId: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
      };
    }

    const token = signToken({
      userId: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.userId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return applySecurityHeaders(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
