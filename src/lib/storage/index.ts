import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import {
  initiateMultipartUpload,
  getSingleUploadPresignedUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  deleteR2Object,
  isR2Configured,
  r2Client,
  R2_BUCKET,
} from '@/lib/r2';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

export interface StorageUploadResult {
  key: string;
  url: string;
  fileSize: number;
  mimeType: string;
}

export type StorageProviderType = 'local' | 'r2';

export const STORAGE_PROVIDER: StorageProviderType =
  (process.env.STORAGE_PROVIDER as StorageProviderType) === 'r2' ? 'r2' : 'local';

export const STORAGE_ROOT = path.resolve(
  process.cwd(),
  process.env.STORAGE_PATH || 'storage'
);

const CHUNKS_ROOT = path.join(STORAGE_ROOT, '.chunks');

// Ensure root storage and chunk directories exist
export function ensureStorageDirs() {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  if (!fs.existsSync(CHUNKS_ROOT)) {
    fs.mkdirSync(CHUNKS_ROOT, { recursive: true });
  }
}

/**
 * Sanitizes a filename safely
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates structured storage key: {type}/{industry}/{yyyy-mm}/{uuid}-{filename}
 */
export function generateStorageKey(
  filename: string,
  type: string = 'media',
  industry: string = 'general'
): string {
  const date = new Date();
  const yyyyMm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const cleanFilename = sanitizeFilename(filename);
  const uuid = crypto.randomUUID().slice(0, 8);
  const safeType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeIndustry = industry.toLowerCase().replace(/[^a-z0-9-]/g, '');

  return `${safeType}/${safeIndustry}/${yyyyMm}/${uuid}-${cleanFilename}`;
}

/**
 * Resolve absolute disk path from key
 */
export function getLocalFilePath(key: string): string {
  // Prevent directory traversal
  const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
  return path.join(STORAGE_ROOT, safeKey);
}

/**
 * Initialize an upload session
 */
export async function initStorageUpload(options: {
  filename: string;
  contentType: string;
  size: number;
  type: string;
  industry: string;
  isMultipart: boolean;
}): Promise<{
  mode: 'single' | 'multipart';
  uploadId: string;
  key: string;
  uploadUrl?: string;
  publicUrl: string;
  provider: 'local' | 'r2';
}> {
  const key = generateStorageKey(options.filename, options.type, options.industry);
  const maxGb = parseFloat(process.env.MAX_FILE_SIZE_GB || '5');
  const maxBytes = maxGb * 1024 * 1024 * 1024;

  if (options.size > maxBytes) {
    throw new Error(`File size exceeds maximum allowed limit of ${maxGb} GB.`);
  }

  // 1. Local Storage Provider
  if (STORAGE_PROVIDER === 'local') {
    ensureStorageDirs();
    const uploadId = crypto.randomUUID();

    if (!options.isMultipart) {
      // Single upload endpoint
      const uploadUrl = `/api/admin/storage/upload?key=${encodeURIComponent(key)}&type=${encodeURIComponent(options.type)}&industry=${encodeURIComponent(options.industry)}`;
      return {
        mode: 'single',
        uploadId,
        key,
        uploadUrl,
        publicUrl: `/api/media/${key}`,
        provider: 'local',
      };
    }

    // Multipart upload
    const uploadChunkDir = path.join(CHUNKS_ROOT, uploadId);
    fs.mkdirSync(uploadChunkDir, { recursive: true });

    // Store upload metadata
    fs.writeFileSync(
      path.join(uploadChunkDir, 'meta.json'),
      JSON.stringify({
        key,
        filename: options.filename,
        contentType: options.contentType,
        size: options.size,
        type: options.type,
        industry: options.industry,
        createdAt: new Date().toISOString(),
      }),
      'utf8'
    );

    return {
      mode: 'multipart',
      uploadId,
      key,
      publicUrl: `/api/media/${key}`,
      provider: 'local',
    };
  }

  // 2. Cloudflare R2 Provider
  if (!isR2Configured) {
    throw new Error('Cloudflare R2 is not configured. Please switch STORAGE_PROVIDER to "local".');
  }

  if (!options.isMultipart) {
    const presigned = await getSingleUploadPresignedUrl({ key, contentType: options.contentType });
    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : `/api/media/${key}`;

    return {
      mode: 'single',
      uploadId: 'single',
      key,
      uploadUrl: presigned.url,
      publicUrl,
      provider: 'r2',
    };
  }

  const r2Session = await initiateMultipartUpload({ key, contentType: options.contentType });
  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
    : `/api/media/${key}`;

  return {
    mode: 'multipart',
    uploadId: r2Session.uploadId,
    key: r2Session.key,
    publicUrl,
    provider: 'r2',
  };
}

/**
 * Save a chunk for a multipart upload to disk
 */
export async function saveLocalChunk(
  uploadId: string,
  partNumber: number,
  chunkStream: NodeJS.ReadableStream
): Promise<{ PartNumber: number; ETag: string }> {
  ensureStorageDirs();
  const chunkDir = path.join(CHUNKS_ROOT, uploadId);
  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir, { recursive: true });
  }

  const chunkPath = path.join(chunkDir, `part-${partNumber}`);
  const writeStream = fs.createWriteStream(chunkPath);

  await pipeline(chunkStream, writeStream);

  const stats = fs.statSync(chunkPath);
  return {
    PartNumber: partNumber,
    ETag: `part-${partNumber}-${stats.size}`,
  };
}

/**
 * Complete a multipart upload on disk by sequentially stitching chunks
 */
export async function completeLocalMultipartUpload(
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
): Promise<StorageUploadResult> {
  const chunkDir = path.join(CHUNKS_ROOT, uploadId);
  if (!fs.existsSync(chunkDir)) {
    throw new Error(`Upload session "${uploadId}" not found or expired.`);
  }

  const metaPath = path.join(chunkDir, 'meta.json');
  let meta: any = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  const key = meta.key;
  if (!key) {
    throw new Error('Upload metadata missing storage key.');
  }

  const targetPath = getLocalFilePath(key);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Sort parts by PartNumber
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  // Sequential streaming append to prevent loading multi-GB into memory
  const destStream = fs.createWriteStream(targetPath);

  for (const part of sortedParts) {
    const partFile = path.join(chunkDir, `part-${part.PartNumber}`);
    if (!fs.existsSync(partFile)) {
      destStream.close();
      throw new Error(`Missing part ${part.PartNumber} for upload ${uploadId}.`);
    }

    const partStream = fs.createReadStream(partFile);
    await new Promise<void>((resolve, reject) => {
      partStream.pipe(destStream, { end: false });
      partStream.on('end', () => resolve());
      partStream.on('error', (err) => reject(err));
    });
  }

  // Close destination stream
  await new Promise<void>((resolve, reject) => {
    destStream.end(() => resolve());
    destStream.on('error', (err) => reject(err));
  });

  // Cleanup chunks directory
  try {
    fs.rmSync(chunkDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Failed to clean up chunk directory:', err);
  }

  const finalStats = fs.statSync(targetPath);

  return {
    key,
    url: `/api/media/${key}`,
    fileSize: finalStats.size,
    mimeType: meta.contentType || 'application/octet-stream',
  };
}

/**
 * Abort a multipart upload and clean up temporary parts
 */
export async function abortLocalMultipartUpload(uploadId: string): Promise<void> {
  const chunkDir = path.join(CHUNKS_ROOT, uploadId);
  if (fs.existsSync(chunkDir)) {
    fs.rmSync(chunkDir, { recursive: true, force: true });
  }
}

/**
 * Save a single streaming file directly to disk
 */
export async function saveSingleLocalFile(
  key: string,
  inputStream: NodeJS.ReadableStream,
  mimeType: string = 'application/octet-stream'
): Promise<StorageUploadResult> {
  ensureStorageDirs();
  const targetPath = getLocalFilePath(key);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(targetPath);
  await pipeline(inputStream, writeStream);

  const stats = fs.statSync(targetPath);
  return {
    key,
    url: `/api/media/${key}`,
    fileSize: stats.size,
    mimeType,
  };
}

/**
 * Delete a file from disk or R2
 */
export async function deleteStorageFile(key: string): Promise<boolean> {
  if (!key) return false;

  // 1. If key is stored locally
  const localPath = getLocalFilePath(key);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
      return true;
    } catch (err) {
      console.warn('Failed to delete local storage file:', err);
      return false;
    }
  }

  // 2. If R2 is active, also attempt R2 delete
  if (isR2Configured) {
    try {
      await deleteR2Object(key);
      return true;
    } catch (err) {
      console.warn('Failed to delete R2 object:', err);
      return false;
    }
  }

  return false;
}

/**
 * Check health of current storage provider
 */
export async function checkStorageHealth(): Promise<{
  provider: 'local' | 'r2';
  accessible: boolean;
  message: string;
  folderExists?: boolean;
  writable?: boolean;
  freeSpaceGB?: string;
  totalSpaceGB?: string;
  storagePath?: string;
}> {
  if (STORAGE_PROVIDER === 'local') {
    try {
      ensureStorageDirs();
      const testFile = path.join(STORAGE_ROOT, `.health-check-${Date.now()}`);
      fs.writeFileSync(testFile, 'ok', 'utf8');
      const isWritable = fs.existsSync(testFile);
      if (isWritable) {
        fs.unlinkSync(testFile);
      }

      let freeGB = 'Unknown';
      let totalGB = 'Unknown';

      try {
        const stats = await fs.promises.statfs(STORAGE_ROOT);
        if (stats) {
          freeGB = `${((stats.bavail * stats.bsize) / 1024 / 1024 / 1024).toFixed(2)} GB`;
          totalGB = `${((stats.blocks * stats.bsize) / 1024 / 1024 / 1024).toFixed(2)} GB`;
        }
      } catch {
        // ignore statfs failure
      }

      return {
        provider: 'local',
        accessible: isWritable,
        folderExists: true,
        writable: isWritable,
        freeSpaceGB: freeGB,
        totalSpaceGB: totalGB,
        storagePath: STORAGE_ROOT,
        message: 'Local disk storage active and verified',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Storage check failed';
      return {
        provider: 'local',
        accessible: false,
        folderExists: fs.existsSync(STORAGE_ROOT),
        writable: false,
        message: `Local storage error: ${msg}`,
      };
    }
  }

  // R2 Provider
  if (!isR2Configured) {
    return {
      provider: 'r2',
      accessible: false,
      message: 'R2 storage selected but credentials missing in .env',
    };
  }

  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    return {
      provider: 'r2',
      accessible: true,
      message: 'R2 bucket reachable and verified',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'R2 bucket unreachable';
    return {
      provider: 'r2',
      accessible: false,
      message: `R2 check: ${msg}`,
    };
  }
}
