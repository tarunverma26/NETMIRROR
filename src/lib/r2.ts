import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
export const R2_BUCKET = process.env.R2_BUCKET || 'reelbeat-media';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
);

// Cloudflare R2 S3-Compatible Client
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate standardized R2 key:
 * Structure: {type}/{industry}/{yyyy-mm}/{uuid}-{sanitized-filename}
 */
export function generateR2Key(params: {
  type: string;
  industry: string;
  filename: string;
}): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dateFolder = `${yyyy}-${mm}`;

  const uuid = crypto.randomUUID().slice(0, 8);
  const sanitized = params.filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');

  const cleanType = params.type.toLowerCase();
  const cleanIndustry = params.industry.toLowerCase();

  return `${cleanType}/${cleanIndustry}/${dateFolder}/${uuid}-${sanitized}`;
}

/**
 * Get Public URL for a given R2 storage key
 */
export function getR2PublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
  return `/api/media/${encodeURIComponent(key)}`;
}

/**
 * Single-part direct upload presigned URL (for files <= 50MB, thumbnails, posters)
 * Expires in 15 minutes (900 seconds)
 */
export async function getSingleUploadPresignedUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: params.expiresIn || 900, // 15 mins
  });

  return {
    url,
    key: params.key,
    publicUrl: getR2PublicUrl(params.key),
  };
}

/**
 * Initiate Multipart Upload for large files (> 50MB)
 */
export async function initiateMultipartUpload(params: {
  key: string;
  contentType: string;
}) {
  const command = new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  const res = await r2Client.send(command);
  return {
    uploadId: res.UploadId!,
    key: params.key,
    publicUrl: getR2PublicUrl(params.key),
  };
}

/**
 * Generate presigned URL for an individual part in a multipart upload
 */
export async function getMultipartPartPresignedUrl(params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresIn?: number;
}) {
  const command = new UploadPartCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: params.expiresIn || 900, // 15 mins
  });

  return {
    partNumber: params.partNumber,
    url,
  };
}

/**
 * Complete Multipart Upload
 */
export async function completeMultipartUpload(params: {
  key: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}) {
  // Parts must be sorted by PartNumber ascending
  const sortedParts = [...params.parts].sort((a, b) => a.PartNumber - b.PartNumber);

  const command = new CompleteMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    UploadId: params.uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  const res = await r2Client.send(command);
  return {
    location: res.Location,
    key: params.key,
    publicUrl: getR2PublicUrl(params.key),
  };
}

/**
 * Abort Multipart Upload (cleans up any uploaded chunks)
 */
export async function abortMultipartUpload(params: {
  key: string;
  uploadId: string;
}) {
  const command = new AbortMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    UploadId: params.uploadId,
  });

  await r2Client.send(command);
  return { aborted: true };
}

/**
 * Delete an object from R2
 */
export async function deleteR2Object(key: string) {
  if (!isR2Configured) return false;
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (err) {
    console.warn(`Failed to delete object ${key} from R2:`, err);
    return false;
  }
}
