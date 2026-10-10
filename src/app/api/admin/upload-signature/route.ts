import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { generateUploadSignature } from '@/lib/cloudinary';
import { applySecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const folder = body.folder || 'reelbeat';
    const signatureData = generateUploadSignature(folder);

    return applySecurityHeaders(NextResponse.json(signatureData));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating upload signature';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
