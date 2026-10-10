import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { getLocalFilePath, STORAGE_PROVIDER } from '@/lib/storage';
import { r2Client, R2_BUCKET, isR2Configured } from '@/lib/r2';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const MIME_MAP: Record<string, string> = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  return MIME_MAP[ext] || 'application/octet-stream';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  const rawKey = Array.isArray(params.key) ? params.key.join('/') : params.key;
  // Decode URL encoded characters in the key
  const key = decodeURIComponent(rawKey);

  // 1. Try Local Disk Storage first
  const localPath = getLocalFilePath(key);
  if (fs.existsSync(localPath)) {
    try {
      const stats = fs.statSync(localPath);
      const fileSize = stats.size;
      const contentType = getMimeType(localPath);
      const rangeHeader = req.headers.get('range');

      // Handle HTTP Range Requests (Seeking in videos and audio)
      if (rangeHeader && fileSize > 0) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          return new NextResponse('Requested range not satisfiable', {
            status: 416,
            headers: { 'Content-Range': `bytes */${fileSize}` },
          });
        }

        const chunkSize = end - start + 1;
        const nodeStream = fs.createReadStream(localPath, { start, end });
        const webStream = Readable.toWeb(nodeStream) as any;

        return new NextResponse(webStream, {
          status: 206, // Partial Content
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      // Full file streaming
      const nodeStream = fs.createReadStream(localPath);
      const webStream = Readable.toWeb(nodeStream) as any;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reading local media';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // 2. Fallback to Cloudflare R2 if configured
  if (isR2Configured) {
    try {
      const head = await r2Client.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })
      );

      const fileSize = head.ContentLength || 0;
      const contentType = head.ContentType || 'application/octet-stream';
      const rangeHeader = req.headers.get('range');

      if (rangeHeader && fileSize > 0) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          return new NextResponse('Requested range not satisfiable', {
            status: 416,
            headers: { 'Content-Range': `bytes */${fileSize}` },
          });
        }

        const chunkSize = end - start + 1;
        const response = await r2Client.send(
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Range: `bytes=${start}-${end}`,
          })
        );

        return new NextResponse(response.Body as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      const response = await r2Client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      );

      return new NextResponse(response.Body as any, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
}
