export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  speedMBs: number;
  etaSeconds: number;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error' | 'aborted';
  error?: string;
}

export interface UploadResult {
  key: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
}

const CHUNK_SIZE = 15 * 1024 * 1024; // 15 MB chunk size (between 10-20 MB)

export class R2DirectUploader {
  private file: File;
  private type: 'movie' | 'song' | 'series' | 'thumbnail' | 'poster';
  private industry: 'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood' | 'srajen-dj';
  private onProgress: (progress: UploadProgress) => void;

  private isPaused: boolean = false;
  private isAborted: boolean = false;
  private uploadId: string | null = null;
  private key: string | null = null;
  private uploadedParts: { PartNumber: number; ETag: string }[] = [];
  private startTime: number = 0;
  private lastLoaded: number = 0;

  constructor(options: {
    file: File;
    type: 'movie' | 'song' | 'series' | 'thumbnail' | 'poster';
    industry: 'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood' | 'srajen-dj';
    onProgress: (progress: UploadProgress) => void;
  }) {
    this.file = options.file;
    this.type = options.type;
    this.industry = options.industry;
    this.onProgress = options.onProgress;
  }

  public pause() {
    this.isPaused = true;
    this.onProgress({
      loaded: this.lastLoaded,
      total: this.file.size,
      percent: Math.round((this.lastLoaded / this.file.size) * 100),
      speedMBs: 0,
      etaSeconds: 0,
      status: 'paused',
    });
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.start();
    }
  }

  public async abort(): Promise<void> {
    this.isAborted = true;
    if (this.uploadId && this.key) {
      try {
        await fetch('/api/admin/r2/abort-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: this.key, uploadId: this.uploadId }),
        });
      } catch (err) {
        console.warn('Failed to abort multipart upload on server:', err);
      }
    }
    this.onProgress({
      loaded: 0,
      total: this.file.size,
      percent: 0,
      speedMBs: 0,
      etaSeconds: 0,
      status: 'aborted',
    });
  }

  public async start(): Promise<UploadResult> {
    this.startTime = Date.now();
    this.isPaused = false;
    this.isAborted = false;

    // 1. Create upload session from backend
    const isMultipart = this.file.size > 50 * 1024 * 1024;

    const createRes = await fetch('/api/admin/r2/create-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: this.file.name,
        contentType: this.file.type || 'application/octet-stream',
        size: this.file.size,
        type: this.type,
        industry: this.industry,
        isMultipart,
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to initialize R2 storage upload.');
    }

    const session = await createRes.json();
    this.key = session.key;

    // 2. Single direct upload mode (<= 50MB)
    if (session.mode === 'single') {
      return this.uploadSingle(session.uploadUrl, session.publicUrl);
    }

    // 3. Multipart upload mode (> 50MB)
    this.uploadId = session.uploadId;
    return this.uploadMultipart(session.uploadId, session.publicUrl);
  }

  private async uploadSingle(uploadUrl: string, publicUrl: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', this.file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (this.isAborted) {
          xhr.abort();
          return;
        }
        if (e.lengthComputable) {
          this.lastLoaded = e.loaded;
          const elapsedSec = (Date.now() - this.startTime) / 1000;
          const speedMBs = elapsedSec > 0 ? e.loaded / (1024 * 1024 * elapsedSec) : 0;
          const remainingBytes = e.total - e.loaded;
          const etaSeconds = speedMBs > 0 ? Math.round(remainingBytes / (speedMBs * 1024 * 1024)) : 0;
          const percent = Math.round((e.loaded / e.total) * 100);

          this.onProgress({
            loaded: e.loaded,
            total: e.total,
            percent,
            speedMBs: parseFloat(speedMBs.toFixed(2)),
            etaSeconds,
            status: 'uploading',
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.onProgress({
            loaded: this.file.size,
            total: this.file.size,
            percent: 100,
            speedMBs: 0,
            etaSeconds: 0,
            status: 'completed',
          });

          resolve({
            key: this.key!,
            publicUrl,
            fileSize: this.file.size,
            mimeType: this.file.type || 'application/octet-stream',
          });
        } else {
          reject(new Error(`Direct upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.onabort = () => reject(new Error('Upload was aborted by user.'));

      xhr.send(this.file);
    });
  }

  private async uploadMultipart(uploadId: string, publicUrl: string): Promise<UploadResult> {
    const totalParts = Math.ceil(this.file.size / CHUNK_SIZE);
    const partsToUpload: number[] = [];

    for (let i = 1; i <= totalParts; i++) {
      if (!this.uploadedParts.find((p) => p.PartNumber === i)) {
        partsToUpload.push(i);
      }
    }

    // Process parts with concurrency of 3
    const concurrency = 3;
    let nextIndex = 0;
    let bytesUploadedAcrossParts = this.uploadedParts.length * CHUNK_SIZE;

    const uploadWorker = async (): Promise<void> => {
      while (nextIndex < partsToUpload.length) {
        if (this.isPaused || this.isAborted) return;

        const partNumber = partsToUpload[nextIndex++];
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, this.file.size);
        const chunkBlob = this.file.slice(start, end);

        // Fetch presigned URL for this part
        const urlRes = await fetch('/api/admin/r2/get-part-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: this.key,
            uploadId,
            parts: [partNumber],
          }),
        });

        if (!urlRes.ok) throw new Error(`Failed to get presigned URL for part ${partNumber}`);
        const { partUrls } = await urlRes.json();
        const partUrl = partUrls[0]?.url;

        // Upload chunk with up to 3 automatic retries
        let etag = '';
        let attempts = 0;
        while (attempts < 3) {
          attempts++;
          try {
            const putRes = await fetch(partUrl, {
              method: 'PUT',
              body: chunkBlob,
            });

            if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);
            etag = putRes.headers.get('ETag') || putRes.headers.get('etag') || '';
            if (!etag) {
              // Fallback ETag format if header not exposed
              etag = `"${partNumber}-etag"`;
            }
            break;
          } catch (err) {
            if (attempts >= 3) throw err;
            await new Promise((r) => setTimeout(r, 1000 * attempts));
          }
        }

        this.uploadedParts.push({ PartNumber: partNumber, ETag: etag });
        bytesUploadedAcrossParts += chunkBlob.size;
        this.lastLoaded = Math.min(bytesUploadedAcrossParts, this.file.size);

        const elapsedSec = (Date.now() - this.startTime) / 1000;
        const speedMBs = elapsedSec > 0 ? this.lastLoaded / (1024 * 1024 * elapsedSec) : 0;
        const remainingBytes = this.file.size - this.lastLoaded;
        const etaSeconds = speedMBs > 0 ? Math.round(remainingBytes / (speedMBs * 1024 * 1024)) : 0;
        const percent = Math.round((this.lastLoaded / this.file.size) * 100);

        this.onProgress({
          loaded: this.lastLoaded,
          total: this.file.size,
          percent,
          speedMBs: parseFloat(speedMBs.toFixed(2)),
          etaSeconds,
          status: 'uploading',
        });
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, partsToUpload.length) }, () =>
      uploadWorker()
    );
    await Promise.all(workers);

    if (this.isPaused) {
      throw new Error('Upload paused');
    }
    if (this.isAborted) {
      throw new Error('Upload aborted');
    }

    // Complete Multipart Upload on Server
    const compRes = await fetch('/api/admin/r2/complete-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: this.key,
        uploadId,
        parts: this.uploadedParts,
      }),
    });

    if (!compRes.ok) {
      const errJson = await compRes.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to complete multipart upload.');
    }

    this.onProgress({
      loaded: this.file.size,
      total: this.file.size,
      percent: 100,
      speedMBs: 0,
      etaSeconds: 0,
      status: 'completed',
    });

    return {
      key: this.key!,
      publicUrl,
      fileSize: this.file.size,
      mimeType: this.file.type || 'application/octet-stream',
    };
  }
}

/**
 * Convenience helper to upload a single file directly to R2
 */
export async function uploadMediaFile(
  file: File,
  type: 'movie' | 'song' | 'series' | 'thumbnail' | 'poster' | string,
  industry: 'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood' | string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const uploader = new R2DirectUploader({
    file,
    type: (type as any) || 'thumbnail',
    industry: (industry as any) || 'bollywood',
    onProgress: onProgress || (() => {}),
  });
  return uploader.start();
}

/**
 * Utility: Extract media duration in seconds and formatted string
 */
export async function getMediaDuration(file: File): Promise<{ seconds: number; formatted: string }> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|mkv|webm|mov)$/i);
    const mediaEl = document.createElement(isVideo ? 'video' : 'audio');
    const objectUrl = URL.createObjectURL(file);

    mediaEl.preload = 'metadata';
    mediaEl.src = objectUrl;

    mediaEl.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const totalSec = Math.round(mediaEl.duration || 0);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      let formatted = '';
      if (hours > 0) {
        formatted = `${hours}h ${minutes}m`;
      } else {
        formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;
      }

      resolve({ seconds: totalSec, formatted });
    };

    mediaEl.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ seconds: 0, formatted: '0:00' });
    };
  });
}

/**
 * Utility: Capture automatic thumbnail from video at 1.0 second
 */
export async function generateVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.currentTime = 1.0;

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return resolve(null);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const thumbFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}-thumb.webp`, {
              type: 'image/webp',
            });
            resolve(thumbFile);
          } else {
            resolve(null);
          }
        },
        'image/webp',
        0.85
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
  });
}
