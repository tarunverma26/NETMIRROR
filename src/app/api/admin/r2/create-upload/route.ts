import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { initStorageUpload } from '@/lib/storage';
import { checkRateLimit, applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

const createUploadSchema = z
  .object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1),
    size: z.number().positive(),
    type: z.enum(['movie', 'song', 'series', 'thumbnail', 'poster']),
    industry: z.enum(['bollywood', 'hollywood', 'bhojpuri', 'tollywood', 'srajen-dj']),
    isMultipart: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.industry === 'srajen-dj') {
        return data.type === 'song' || data.type === 'thumbnail' || data.type === 'poster';
      }
      return true;
    },
    {
      message: 'Srajen Dj category is only available for songs and their artwork',
      path: ['industry'],
    }
  );

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  const rateCheck = checkRateLimit(req, 100, 60 * 1000);
  if (!rateCheck.success) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Too many upload requests. Please slow down.' }, { status: 429 })
    );
  }

  try {
    const body = await req.json();
    const validated = createUploadSchema.safeParse(body);

    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Invalid upload parameters' },
          { status: 400 }
        )
      );
    }

    const { filename, contentType, size, type, industry, isMultipart } = validated.data;
    const useMultipart = isMultipart || size > 50 * 1024 * 1024;

    const session = await initStorageUpload({
      filename,
      contentType,
      size,
      type,
      industry,
      isMultipart: useMultipart,
    });

    return applySecurityHeaders(
      NextResponse.json({
        mode: session.mode,
        uploadId: session.uploadId,
        key: session.key,
        uploadUrl: session.uploadUrl,
        publicUrl: session.publicUrl,
        provider: session.provider,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error initiating upload';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
