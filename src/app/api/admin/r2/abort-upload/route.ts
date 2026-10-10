import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { STORAGE_PROVIDER, abortLocalMultipartUpload } from '@/lib/storage';
import { abortMultipartUpload } from '@/lib/r2';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

const abortUploadSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const validated = abortUploadSchema.safeParse(body);

    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Invalid abort payload' },
          { status: 400 }
        )
      );
    }

    const { key, uploadId } = validated.data;

    if (STORAGE_PROVIDER === 'local') {
      await abortLocalMultipartUpload(uploadId);
      return applySecurityHeaders(
        NextResponse.json({ success: true, message: 'Local multipart upload aborted and cleaned up.' })
      );
    }

    await abortMultipartUpload({ key, uploadId });

    return applySecurityHeaders(
      NextResponse.json({ success: true, message: 'Multipart upload aborted and cleaned up.' })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error aborting multipart upload';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
