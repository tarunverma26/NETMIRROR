'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UploadCloud,
  Film,
  Music,
  Tv,
  CheckCircle,
  AlertCircle,
  Layers,
  Pause,
  Play,
  X,
  Clock,
  Sparkles,
  RefreshCw,
  FileAudio,
  FileVideo,
  ListPlus,
} from 'lucide-react';
import {
  R2DirectUploader,
  UploadProgress,
  getMediaDuration,
  generateVideoThumbnail,
} from '@/lib/r2Uploader';

interface ExistingSeries {
  _id: string;
  title: string;
  industry: string;
  seasonsCount?: number;
}

interface BulkSongItem {
  id: string;
  file: File;
  title: string;
  duration: string;
  progress: UploadProgress;
  uploader?: R2DirectUploader;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function AdminUploadPage() {
  // Mode selection
  const [contentType, setContentType] = useState<'movie' | 'song' | 'series'>('movie');
  const [isBulkSongMode, setIsBulkSongMode] = useState(false);
  const [isEpisodeMode, setIsEpisodeMode] = useState(false);

  // Common Metadata
  const [industry, setIndustry] = useState<'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood'>('bollywood');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [language, setLanguage] = useState('Hindi');
  const [cast, setCast] = useState('');
  const [duration, setDuration] = useState('');

  // Selected Files
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  // Series Episode specific fields
  const [existingSeriesList, setExistingSeriesList] = useState<ExistingSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);

  // Single Upload Progress & State
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [currentUploader, setCurrentUploader] = useState<R2DirectUploader | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk Song Upload State
  const [bulkSongs, setBulkSongs] = useState<BulkSongItem[]>([]);
  const [bulkCommonArtist, setBulkCommonArtist] = useState('');
  const [bulkCommonGenre, setBulkCommonGenre] = useState('Pop');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  // Load existing series list
  useEffect(() => {
    async function loadSeries() {
      try {
        const res = await fetch('/api/content?type=series&limit=100');
        if (res.ok) {
          const data = await res.json();
          setExistingSeriesList(data.items || []);
          if (data.items?.length > 0 && !selectedSeriesId) {
            setSelectedSeriesId(data.items[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load series', err);
      }
    }
    loadSeries();
  }, [selectedSeriesId]);

  // Handle Media File Selection & Auto-detect Duration
  const handleMediaSelect = async (file: File) => {
    setMediaFile(file);

    // Auto-detect Title if not set
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setTitle(cleanName);
    }

    // Auto-detect Duration
    try {
      const detected = await getMediaDuration(file);
      if (detected.formatted) {
        setDuration(detected.formatted);
      }
    } catch (e) {
      console.warn('Duration detection error:', e);
    }

    // Auto-generate Thumbnail for video if not uploaded
    if (file.type.startsWith('video') && !thumbnailFile) {
      try {
        const autoThumb = await generateVideoThumbnail(file);
        if (autoThumb) {
          setThumbnailFile(autoThumb);
          setThumbnailPreview(URL.createObjectURL(autoThumb));
        }
      } catch (e) {
        console.warn('Auto thumbnail error:', e);
      }
    }
  };

  // Handle Thumbnail File Selection
  const handleThumbnailSelect = (file: File) => {
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Handle Bulk Song Files
  const handleBulkSelect = async (files: FileList) => {
    const newItems: BulkSongItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let dur = '3:30';
      try {
        const d = await getMediaDuration(f);
        dur = d.formatted || dur;
      } catch {}

      newItems.push({
        id: `song-${Date.now()}-${i}`,
        file: f,
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
        duration: dur,
        progress: {
          loaded: 0,
          total: f.size,
          percent: 0,
          speedMBs: 0,
          etaSeconds: 0,
          status: 'idle',
        },
        status: 'pending',
      });
    }
    setBulkSongs((prev) => [...prev, ...newItems]);
  };

  // Submit Single Upload (Movie, Song, or Series Episode)
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!title.trim()) {
      setToast({ type: 'error', message: 'Title is required' });
      return;
    }
    if (!mediaFile) {
      setToast({ type: 'error', message: 'Please select a media file to upload' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Thumbnail to R2 (if provided)
      let finalThumbUrl =
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=900&auto=format&fit=crop';

      if (thumbnailFile) {
        const thumbUploader = new R2DirectUploader({
          file: thumbnailFile,
          type: 'thumbnail',
          industry,
          onProgress: () => {},
        });
        const thumbResult = await thumbUploader.start();
        finalThumbUrl = thumbResult.publicUrl;
      }

      // 2. Upload Media File directly to R2 with Multipart & Progress
      const mediaUploader = new R2DirectUploader({
        file: mediaFile,
        type: contentType,
        industry,
        onProgress: (p) => setUploadProgress({ ...p }),
      });
      setCurrentUploader(mediaUploader);

      const mediaResult = await mediaUploader.start();

      // 3. Save Record to Database ONLY after R2 upload completes
      const payload: Record<string, unknown> =
        contentType === 'series' && isEpisodeMode
          ? {
              isEpisode: true,
              seriesId: selectedSeriesId,
              season: Number(seasonNumber),
              episodeNumber: Number(episodeNumber),
              title: title.trim(),
              description: description.trim(),
              mediaUrl: mediaResult.publicUrl,
              thumbnailUrl: finalThumbUrl,
              duration: duration || '45m',
              storageKey: mediaResult.key,
              fileSize: mediaResult.fileSize,
              mimeType: mediaResult.mimeType,
            }
          : {
              type: contentType,
              industry,
              title: title.trim(),
              description: description.trim(),
              genre: genre ? genre.split(',').map((s) => s.trim()) : ['Cinema'],
              year: Number(year),
              language: language.trim() || 'Hindi',
              cast: cast ? cast.split(',').map((s) => s.trim()) : [],
              thumbnailUrl: finalThumbUrl,
              mediaUrl: mediaResult.publicUrl,
              duration: duration || (contentType === 'song' ? '3:45' : '2h 15m'),
              isPublished: true,
              storageKey: mediaResult.key,
              fileSize: mediaResult.fileSize,
              mimeType: mediaResult.mimeType,
            };

      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save content record');
      }

      setToast({
        type: 'success',
        message: `"${title}" successfully uploaded and published to streaming!`,
      });

      // Reset Form
      setTitle('');
      setDescription('');
      setGenre('');
      setCast('');
      setDuration('');
      setMediaFile(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setUploadProgress(null);
      setCurrentUploader(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Bulk Song Uploads
  const startBulkUpload = async () => {
    if (bulkSongs.length === 0) return;
    setIsSubmitting(true);

    for (let i = 0; i < bulkSongs.length; i++) {
      const item = bulkSongs[i];
      if (item.status === 'completed') continue;

      setBulkSongs((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: 'uploading' } : s))
      );

      try {
        const uploader = new R2DirectUploader({
          file: item.file,
          type: 'song',
          industry,
          onProgress: (p) => {
            setBulkSongs((prev) =>
              prev.map((s) => (s.id === item.id ? { ...s, progress: p } : s))
            );
          },
        });

        const uploadRes = await uploader.start();

        // Save song record to database
        const payload = {
          type: 'song',
          industry,
          title: item.title,
          description: `Track from ${item.title}`,
          genre: bulkCommonGenre ? [bulkCommonGenre] : ['Soundtrack'],
          year: new Date().getFullYear(),
          language: 'Hindi',
          cast: bulkCommonArtist ? [bulkCommonArtist] : ['Featured Artist'],
          thumbnailUrl:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900&auto=format&fit=crop',
          mediaUrl: uploadRes.publicUrl,
          duration: item.duration,
          isPublished: true,
          storageKey: uploadRes.key,
          fileSize: uploadRes.fileSize,
          mimeType: uploadRes.mimeType,
        };

        await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        setBulkSongs((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: 'completed' } : s))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to upload song';
        setBulkSongs((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: 'error', error: msg } : s))
        );
      }
    }

    setIsSubmitting(false);
    setToast({ type: 'success', message: 'Bulk song upload batch completed!' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>High-Performance Media Uploader</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Publish Media to Streaming Catalog
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Direct streaming upload with chunking, pause/resume, and automated metadata extraction.
        </p>
      </div>

      {/* Mode Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { type: 'movie', label: 'Movie', icon: Film, isBulk: false },
          { type: 'song', label: 'Single Song', icon: Music, isBulk: false },
          { type: 'song', label: 'Bulk Songs', icon: ListPlus, isBulk: true },
          { type: 'series', label: 'Web Series', icon: Tv, isBulk: false },
        ].map((tab, idx) => {
          const Icon = tab.icon;
          const isSelected =
            contentType === tab.type && isBulkSongMode === tab.isBulk;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setContentType(tab.type as any);
                setIsBulkSongMode(tab.isBulk);
                if (tab.type !== 'series') setIsEpisodeMode(false);
              }}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                isSelected
                  ? 'bg-primary/20 border-primary text-white shadow-red-glow'
                  : 'bg-surface-card border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : ''}`} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Episode Mode Switch for Web Series */}
      {contentType === 'series' && (
        <div className="p-4 rounded-xl bg-surface-card border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-gray-300 font-medium">Series Upload Mode:</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEpisodeMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isEpisodeMode ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Create New Series Master
            </button>
            <button
              type="button"
              onClick={() => setIsEpisodeMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isEpisodeMode ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Upload Episode to Existing Series
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-xs ${
            toast.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= BULK SONG MODE ================= */}
      {isBulkSongMode ? (
        <div className="bg-surface-card border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              >
                <option value="bollywood">Bollywood</option>
                <option value="hollywood">Hollywood</option>
                <option value="bhojpuri">Bhojpuri</option>
                <option value="tollywood">Tollywood</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Common Artist/Singer
              </label>
              <input
                type="text"
                value={bulkCommonArtist}
                onChange={(e) => setBulkCommonArtist(e.target.value)}
                placeholder="e.g. Arijit Singh"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Common Genre
              </label>
              <input
                type="text"
                value={bulkCommonGenre}
                onChange={(e) => setBulkCommonGenre(e.target.value)}
                placeholder="e.g. Indie, Pop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Bulk Drop Area */}
          <div
            onClick={() => bulkInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-primary/50 rounded-2xl p-8 text-center cursor-pointer bg-surface/50 transition-all"
          >
            <input
              ref={bulkInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.flac,.m4a,.aac"
              onChange={(e) => e.target.files && handleBulkSelect(e.target.files)}
              className="hidden"
            />
            <Music className="w-10 h-10 mx-auto text-primary mb-2" />
            <p className="text-sm font-semibold text-white">
              Click to select multiple audio tracks for bulk upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports MP3, WAV, FLAC, M4A, AAC with individual progress meters
            </p>
          </div>

          {/* Bulk Item Queue */}
          {bulkSongs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Queued Tracks ({bulkSongs.length})
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bulkSongs.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3 truncate w-2/3">
                      <span className="text-gray-500 font-mono">{idx + 1}</span>
                      <div className="truncate">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setBulkSongs((prev) =>
                              prev.map((s) => (s.id === item.id ? { ...s, title: newTitle } : s))
                            );
                          }}
                          className="bg-transparent font-medium text-white truncate focus:outline-none focus:underline"
                        />
                        <span className="text-[10px] text-gray-500 block">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB &bull; {item.duration}
                        </span>
                      </div>
                    </div>

                    <div className="w-1/3 flex items-center justify-end space-x-3">
                      {item.status === 'completed' ? (
                        <span className="text-emerald-400 font-medium flex items-center text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Uploaded
                        </span>
                      ) : item.status === 'uploading' ? (
                        <div className="w-24">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-1 bg-primary transition-all"
                              style={{ width: `${item.progress.percent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-gray-400">
                            {item.progress.percent}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={startBulkUpload}
                disabled={isSubmitting || bulkSongs.length === 0}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider shadow-red-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Bulk Upload...' : 'Upload All Tracks'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= SINGLE UPLOAD FORM ================= */
        <form
          onSubmit={handleSubmitSingle}
          className="bg-surface-card border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {/* Industry & Series Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              >
                <option value="bollywood">Bollywood (Hindi Cinema)</option>
                <option value="hollywood">Hollywood (Global English)</option>
                <option value="bhojpuri">Bhojpuri (Purvanchal / Bihar)</option>
                <option value="tollywood">Tollywood (Telugu / South Cinema)</option>
              </select>
            </div>

            {contentType === 'series' && isEpisodeMode && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Select Existing Series
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                >
                  {existingSeriesList.length === 0 ? (
                    <option value="">No existing series (Create series master first)</option>
                  ) : (
                    existingSeriesList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.title} ({s.industry.toUpperCase()})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Season & Episode # for Series */}
          {contentType === 'series' && isEpisodeMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Season Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Episode Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Title and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {contentType === 'series' && isEpisodeMode ? 'Episode Title' : 'Title'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Duration (Auto-detected)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={contentType === 'song' ? '3:45' : '2h 15m'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Synopsis / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter synopsis..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Genre, Year, Language, Cast */}
          {(!isEpisodeMode || contentType !== 'series') && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Genres (Comma separated)
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Action, Thriller, Drama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {(!isEpisodeMode || contentType !== 'series') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Cast / Artists (Comma separated)
              </label>
              <input
                type="text"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                placeholder="Cast or Artist names"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Media & Thumbnail Picker Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Thumbnail Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Thumbnail / Poster Image
              </label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 text-center cursor-pointer bg-surface/50 transition-all flex flex-col items-center justify-center min-h-[160px]"
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && handleThumbnailSelect(e.target.files[0])}
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-white/10">
                    <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-7 h-7 mx-auto text-gray-400" />
                    <p className="text-xs text-gray-300">Choose poster/thumbnail (JPG, PNG, WebP)</p>
                    <p className="text-[10px] text-gray-500">Auto-captured from video if left blank</p>
                  </div>
                )}
              </div>
            </div>

            {/* Media File Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Media File (Video or Audio)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/40 hover:border-primary rounded-xl p-4 text-center cursor-pointer bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[160px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    contentType === 'song'
                      ? 'audio/*,.mp3,.wav,.flac,.m4a,.aac'
                      : 'video/*,.mp4,.mkv,.webm,.mov'
                  }
                  onChange={(e) => e.target.files && handleMediaSelect(e.target.files[0])}
                  className="hidden"
                />
                {mediaFile ? (
                  <div className="space-y-1 text-left w-full p-2 bg-surface rounded-lg border border-white/10">
                    <div className="flex items-center space-x-2">
                      {contentType === 'song' ? (
                        <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <FileVideo className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {mediaFile.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Size: {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                      {mediaFile.size > 50 * 1024 * 1024 ? ' (Multipart Chunking Mode)' : ' (Direct PUT Mode)'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-7 h-7 mx-auto text-primary" />
                    <p className="text-xs text-gray-200 font-medium">Select Media File (Up to 10 GB)</p>
                    <p className="text-[10px] text-gray-400">MP4, MKV, WebM, MOV / MP3, WAV, FLAC</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Upload Progress with Speed, ETA, and Pause/Resume */}
          {uploadProgress && (
            <div className="p-4 rounded-xl bg-surface border border-primary/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">
                    {uploadProgress.status === 'paused'
                      ? 'Upload Paused'
                      : uploadProgress.status === 'completed'
                      ? 'Upload Completed!'
                      : 'Uploading media file...'}
                  </span>
                  <span className="text-gray-400 font-mono">({uploadProgress.percent}%)</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-gray-400">
                  {uploadProgress.speedMBs > 0 && <span>Speed: {uploadProgress.speedMBs} MB/s</span>}
                  {uploadProgress.etaSeconds > 0 && <span>ETA: {uploadProgress.etaSeconds}s</span>}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 transition-all duration-200 shadow-red-glow"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>

              {/* Pause, Resume, Abort Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                {uploadProgress.status === 'uploading' && (
                  <button
                    type="button"
                    onClick={() => currentUploader?.pause()}
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white flex items-center space-x-1"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                )}
                {uploadProgress.status === 'paused' && (
                  <button
                    type="button"
                    onClick={() => currentUploader?.resume()}
                    className="px-3 py-1 rounded bg-primary text-xs text-white flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Resume</span>
                  </button>
                )}
                {(uploadProgress.status === 'uploading' || uploadProgress.status === 'paused') && (
                  <button
                    type="button"
                    onClick={() => currentUploader?.abort()}
                    className="px-3 py-1 rounded bg-red-950/60 text-xs text-red-400 hover:text-white"
                  >
                    Abort
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
            <Link
              href="/admin/manage"
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !mediaFile}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold uppercase tracking-wider shadow-red-glow transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Uploading Media...' : 'Publish to Streaming'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
