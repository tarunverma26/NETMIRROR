import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { isCloudinaryConfigured, cloudinary } from '@/lib/cloudinary';
import { applySecurityHeaders } from '@/lib/security';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'reelbeat';

    if (!file) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'No file provided in form data' }, { status: 400 })
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary is configured, upload via Cloudinary SDK
    if (isCloudinaryConfigured) {
      const isVideo = file.type.startsWith('video') || file.type.startsWith('audio');
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: isVideo ? 'video' : 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      const res = uploadResult as { secure_url: string; public_id: string; duration?: number };
      return applySecurityHeaders(
        NextResponse.json({
          url: res.secure_url,
          publicId: res.public_id,
          provider: 'cloudinary',
        })
      );
    }

    // Local fallback: write into public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

    return applySecurityHeaders(
      NextResponse.json({
        url: publicUrl,
        filename: file.name,
        provider: 'local',
        message: 'Saved locally (configure Cloudinary in .env.local for cloud hosting)',
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
