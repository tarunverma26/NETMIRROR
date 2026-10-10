import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { STORAGE_PROVIDER } from '@/lib/storage';
import { getMultipartPartPresignedUrl } from '@/lib/r2';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

const getPartUrlsSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(z.number().int().min(1).max(10000)).min(1).max(50), // Batch up to 50 parts
});

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const validated = getPartUrlsSchema.safeParse(body);

    if (!validated.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: validated.error.errors[0]?.message || 'Invalid part URL request' },
          { status: 400 }
        )
      );
    }

    const { key, uploadId, parts } = validated.data;

    // 1. Local storage provider
    if (STORAGE_PROVIDER === 'local') {
      const partUrls = parts.map((partNumber) => {
        const uploadUrl = `/api/admin/storage/upload?uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}&key=${encodeURIComponent(key)}`;
        return {
          partNumber,
          url: uploadUrl,
          uploadUrl,
        };
      });

      return applySecurityHeaders(NextResponse.json({ partUrls }));
    }

    // 2. Cloudflare R2 provider
    const partUrls = await Promise.all(
      parts.map((partNumber) =>
        getMultipartPartPresignedUrl({
          key,
          uploadId,
          partNumber,
          expiresIn: 900,
        })
      )
    );

    return applySecurityHeaders(NextResponse.json({ partUrls }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating part URLs';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
