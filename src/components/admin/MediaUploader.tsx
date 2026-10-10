'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, CheckCircle, AlertCircle, FileAudio, FileVideo, X } from 'lucide-react';

interface MediaUploaderProps {
  label: string;
  accept: string;
  maxSizeMB?: number;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  fileTypeLabel?: string;
  presetUrls?: string[];
}

export default function MediaUploader({
  label,
  accept,
  maxSizeMB = 100,
  value,
  onChange,
  folder = 'reelbeat',
  fileTypeLabel = 'File',
  presetUrls = [],
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.includes('image');
  const isVideo = accept.includes('video');
  const isAudio = accept.includes('audio');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    if (isImage && !file.type.startsWith('image/')) {
      return 'Please upload an image file (PNG, JPG, WebP).';
    }
    if (isVideo && !file.type.startsWith('video/')) {
      return 'Please upload a video file (MP4, WebM, MKV).';
    }
    if (isAudio && !file.type.startsWith('audio/')) {
      return 'Please upload an audio file (MP3, WAV, AAC).';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    setError(null);
    setSuccess(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 200);

    try {
      // 1. Check if direct Cloudinary upload is configured
      const sigRes = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });

      const sigData = await sigRes.json();

      if (sigRes.ok && sigData.configured) {
        // Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp.toString());
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        const resourceType = isVideo || isAudio ? 'video' : 'image';
        const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`;

        const uploadRes = await fetch(cloudinaryEndpoint, {
          method: 'POST',
          body: formData,
        });

        const cloudJson = await uploadRes.json();
        if (uploadRes.ok && cloudJson.secure_url) {
          clearInterval(progressInterval);
          setProgress(100);
          onChange(cloudJson.secure_url);
          setSuccess('Uploaded directly to Cloudinary successfully!');
          return;
        }
      }

      // 2. Fallback to server route /api/admin/upload
      const serverFormData = new FormData();
      serverFormData.append('file', file);
      serverFormData.append('folder', folder);

      const serverUploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: serverFormData,
      });

      const serverJson = await serverUploadRes.json();
      clearInterval(progressInterval);

      if (serverUploadRes.ok && serverJson.url) {
        setProgress(100);
        onChange(serverJson.url);
        setSuccess('File uploaded successfully!');
      } else {
        throw new Error(serverJson.error || 'Server upload failed');
      }
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const message = err instanceof Error ? err.message : 'Upload encountered an error';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
          className="text-[11px] text-red-400 hover:text-red-300 transition-colors underline"
        >
          {isCustomUrlMode ? 'Switch to File Upload' : 'Paste Direct URL'}
        </button>
      </div>

      {isCustomUrlMode ? (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${fileTypeLabel} URL (https://...)`}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {presetUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-gray-400 self-center">Presets:</span>
              {presetUrls.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset)}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-red-glow'
              : 'border-white/10 hover:border-white/20 bg-surface/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Current File Preview */}
          {value ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-white/10">
              <div className="flex items-center space-x-3 truncate">
                {isImage ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-neutral-900">
                    <Image src={value} alt="Preview" fill className="object-cover" />
                  </div>
                ) : isAudio ? (
                  <FileAudio className="w-8 h-8 text-primary flex-shrink-0" />
                ) : (
                  <FileVideo className="w-8 h-8 text-primary flex-shrink-0" />
                )}
                <div className="text-left truncate">
                  <p className="text-xs font-medium text-white truncate max-w-xs">{value}</p>
                  <span className="text-[10px] text-emerald-400 flex items-center mt-0.5">
                    <CheckCircle className="w-3 h-3 mr-1" /> Ready for streaming
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <UploadCloud className="w-8 h-8 mx-auto text-gray-400 group-hover:text-primary transition-colors" />
              <p className="text-xs text-gray-300 font-medium">
                Drag & drop {fileTypeLabel} here, or <span className="text-primary underline">browse</span>
              </p>
              <p className="text-[10px] text-gray-500">
                Max {maxSizeMB}MB &bull; Supports Cloudinary Direct Upload
              </p>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-3 space-y-1">
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 transition-all duration-200 shadow-red-glow"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-gray-400">Uploading... {progress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <p className="text-xs text-red-400 flex items-center mt-1">
          <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 flex items-center mt-1">
          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {success}
        </p>
      )}
    </div>
  );
}
