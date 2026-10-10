import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { STORAGE_PROVIDER, completeLocalMultipartUpload } from '@/lib/storage';
import { completeMultipartUpload } from '@/lib/r2';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

const completeUploadSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().min(1),
        ETag: z.string().min(1),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const validated = completeUploadSchema.safeParse(body);

    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Invalid completion payload' },
          { status: 400 }
        )
      );
    }

    const { key, uploadId, parts } = validated.data;

    // 1. Local Storage Provider
    if (STORAGE_PROVIDER === 'local') {
      const localResult = await completeLocalMultipartUpload(uploadId, parts);
      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          key: localResult.key,
          publicUrl: localResult.url,
          location: localResult.url,
          fileSize: localResult.fileSize,
        })
      );
    }

    // 2. Cloudflare R2 Provider
    const result = await completeMultipartUpload({ key, uploadId, parts });
    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        key: result.key,
        publicUrl: result.publicUrl,
        location: result.location,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error completing multipart upload';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
