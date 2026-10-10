'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Film,
  Music,
  Tv,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { SeedContent } from '@/lib/initialData';
import { uploadMediaFile } from '@/lib/r2Uploader';

export default function AdminManagePage() {
  const [items, setItems] = useState<SeedContent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SeedContent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editYear, setEditYear] = useState(2024);
  const [editDuration, setEditDuration] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editRemixName, setEditRemixName] = useState('');
  const [editBpm, setEditBpm] = useState('');
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.set('type', selectedType);
      if (selectedIndustry !== 'all') params.set('industry', selectedIndustry);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/content?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch catalog', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedIndustry, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isPublished: !currentStatus } : item
          )
        );
        setToast({
          type: 'success',
          message: `Status updated to ${!currentStatus ? 'Published' : 'Unpublished'}`,
        });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to update publication status' });
    }
  };

  const deleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
        setToast({ type: 'success', message: `"${title}" removed from catalog` });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const startEdit = (item: SeedContent) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditGenre(item.genre.join(', '));
    setEditYear(item.year);
    setEditDuration(item.duration);
    setEditThumbnailUrl(item.thumbnailUrl || '');
    setEditRemixName((item as any).remixName || '');
    setEditBpm((item as any).bpm ? String((item as any).bpm) : '');
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setIsUploadingThumb(true);
    try {
      const res = await uploadMediaFile(file, editingItem.type, editingItem.industry);
      setEditThumbnailUrl(res.publicUrl);
      setToast({ type: 'success', message: 'New thumbnail uploaded successfully' });
    } catch {
      setToast({ type: 'error', message: 'Failed to upload replacement thumbnail' });
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updatePayload: Record<string, unknown> = {
        title: editTitle.trim(),
        genre: editGenre.split(',').map((s) => s.trim()),
        year: Number(editYear),
        duration: editDuration.trim(),
        thumbnailUrl: editThumbnailUrl.trim(),
      };

      if (editingItem.type === 'song') {
        updatePayload.remixName = editRemixName.trim();
        updatePayload.bpm = editBpm ? Number(editBpm) : null;
      }

      const res = await fetch(`/api/admin/content/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) =>
            item._id === editingItem._id ? { ...item, ...data.content } : item
          )
        );
        setToast({ type: 'success', message: 'Content details saved successfully' });
        setEditingItem(null);
      }
    } catch {
      setToast({ type: 'error', message: 'Error saving changes' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Manage Media Catalog
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, edit, toggle visibility, and maintain streaming releases.
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-red-glow self-start sm:self-auto"
        >
          <span>Upload Media</span>
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs ${
            toast.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-card border border-white/10 rounded-2xl p-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search titles, actors, genres..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="song">Songs</option>
            <option value="series">Web Series</option>
          </select>
        </div>

        <div>
          <select
            value={selectedIndustry}
            onChange={(e) => {
              setSelectedIndustry(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
          >
            <option value="all">All Industries</option>
            <option value="bollywood">Bollywood</option>
            <option value="hollywood">Hollywood</option>
            <option value="bhojpuri">Bhojpuri</option>
            <option value="tollywood">Tollywood</option>
            <option value="srajen-dj">Srajen Dj</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-surface-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-gray-500 animate-pulse">
            Loading catalog data...
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-xs text-gray-500">
            No matching media items found.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4 font-semibold">Poster & Title</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Industry</th>
                    <th className="py-3 px-4 font-semibold">Year</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Visibility</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((item) => (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 border border-white/10">
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-xs flex items-center">
                                <span className="truncate">{item.title}</span>
                                {(item as any).remixName && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-red-950/80 border border-primary/40 text-red-300 font-mono font-medium flex-shrink-0">
                                    {(item as any).remixName}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {item.genre?.join(', ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-red-300">
                          {item.industry === 'srajen-dj' ? 'Srajen Dj' : item.industry}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-400">{item.year}</td>
                        <td className="py-3 px-4 font-mono text-gray-400">{item.duration}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => togglePublish(item._id, item.isPublished)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                              item.isPublished
                                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {item.isPublished ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                <span>Live</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={
                                item.type === 'song'
                                  ? `/songs/${item.industry}`
                                  : item.type === 'series'
                                  ? `/series/show/${item._id}`
                                  : `/watch/${item._id}`
                              }
                              target="_blank"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                              title="Open streaming view"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                              title="Edit metadata"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id, item.title)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Delete content"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <div>
                Showing{' '}
                <span className="text-white font-mono font-medium">
                  {Math.min((currentPage - 1) * pageSize + 1, items.length)}
                </span>{' '}
                to{' '}
                <span className="text-white font-mono font-medium">
                  {Math.min(currentPage * pageSize, items.length)}
                </span>{' '}
                of <span className="text-white font-mono font-medium">{items.length}</span> titles
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1.5 rounded-lg bg-surface border border-white/10 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="font-mono text-gray-400 text-xs px-2">
                  Page {currentPage} of {Math.max(1, Math.ceil(items.length / pageSize))}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.max(1, Math.ceil(items.length / pageSize)), p + 1)
                    )
                  }
                  disabled={currentPage >= Math.ceil(items.length / pageSize)}
                  className="px-2.5 py-1.5 rounded-lg bg-surface border border-white/10 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Edit Content Metadata</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Thumbnail replacement */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Poster / Thumbnail
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  {editThumbnailUrl && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-neutral-900 flex-shrink-0">
                      <Image
                        src={editThumbnailUrl}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={editThumbnailUrl}
                      onChange={(e) => setEditThumbnailUrl(e.target.value)}
                      placeholder="Thumbnail Image URL"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary font-mono text-[11px]"
                    />
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5 text-red-400" />
                      <span>{isUploadingThumb ? 'Uploading...' : 'Replace with Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingThumb}
                        onChange={handleThumbnailUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Genres (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {editingItem.type === 'song' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-red-950/20 border border-primary/20">
                  <div>
                    <label className="block text-xs font-semibold text-red-300 mb-1">
                      Remix Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={editRemixName}
                      onChange={(e) => setEditRemixName(e.target.value)}
                      placeholder="e.g. Club VIP Mix"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-300 mb-1">
                      BPM (Optional)
                    </label>
                    <input
                      type="number"
                      value={editBpm}
                      onChange={(e) => setEditBpm(e.target.value)}
                      placeholder="e.g. 128"
                      className="w-full px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingThumb}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-xs font-semibold text-white shadow-red-glow disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
