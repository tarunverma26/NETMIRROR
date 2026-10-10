import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { verifyAdminSession } from '@/lib/adminAuth';
import { saveLocalChunk, saveSingleLocalFile } from '@/lib/storage';
import { checkRateLimit, applySecurityHeaders } from '@/lib/security';

export async function PUT(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  const rateCheck = checkRateLimit(req, 200, 60 * 1000);
  if (!rateCheck.success) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Upload rate limit reached' }, { status: 429 })
    );
  }

  if (!req.body) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'No payload stream provided' }, { status: 400 })
    );
  }

  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get('uploadId');
  const partNumberStr = searchParams.get('partNumber');
  const key = searchParams.get('key');
  const contentType = req.headers.get('content-type') || 'application/octet-stream';

  try {
    // 1. Multipart chunk streaming
    if (uploadId && partNumberStr) {
      const partNumber = parseInt(partNumberStr, 10);
      if (isNaN(partNumber) || partNumber < 1) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Invalid partNumber' }, { status: 400 })
        );
      }

      const nodeStream = Readable.fromWeb(req.body as any);
      const chunkResult = await saveLocalChunk(uploadId, partNumber, nodeStream);

      const res = NextResponse.json({
        PartNumber: chunkResult.PartNumber,
        ETag: chunkResult.ETag,
      });
      res.headers.set('ETag', chunkResult.ETag);
      return applySecurityHeaders(res);
    }

    // 2. Single file direct streaming
    if (key) {
      const decodedKey = decodeURIComponent(key);
      const nodeStream = Readable.fromWeb(req.body as any);
      const result = await saveSingleLocalFile(decodedKey, nodeStream, contentType);

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          key: result.key,
          publicUrl: result.url,
          fileSize: result.fileSize,
        })
      );
    }

    return applySecurityHeaders(
      NextResponse.json({ error: 'Missing uploadId or key parameter' }, { status: 400 })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error processing storage stream';
    return applySecurityHeaders(
      NextResponse.json({ error: msg }, { status: 500 })
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
