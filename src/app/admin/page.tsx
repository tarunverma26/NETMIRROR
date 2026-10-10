'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Film,
  Music,
  Tv,
  Layers,
  UploadCloud,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SeedContent } from '@/lib/initialData';

interface AdminStats {
  movies: number;
  songs: number;
  series: number;
  episodes: number;
  totalContent: number;
  byIndustry?: {
    bollywood: number;
    hollywood: number;
    bhojpuri: number;
    tollywood: number;
  };
  totalStorageFormatted?: string;
  totalStorageBytes?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    movies: 0,
    songs: 0,
    series: 0,
    episodes: 0,
    totalContent: 0,
    byIndustry: {
      bollywood: 0,
      hollywood: 0,
      bhojpuri: 0,
      tollywood: 0,
    },
    totalStorageFormatted: '0 B',
    totalStorageBytes: 0,
  });
  const [recentUploads, setRecentUploads] = useState<SeedContent[]>([]);
  const [storageMode, setStorageMode] = useState<string>('Local');
  const [storageProvider, setStorageProvider] = useState<string>('local');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentUploads(data.recentUploads || []);
          if (data.storageMode) setStorageMode(data.storageMode);
          if (data.storageProvider) setStorageProvider(data.storageProvider);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Movies',
      count: stats.movies,
      icon: Film,
      href: '/movies',
      color: 'from-red-950/40 to-surface-card',
      borderColor: 'border-red-900/30',
    },
    {
      title: 'Songs',
      count: stats.songs,
      icon: Music,
      href: '/songs',
      color: 'from-red-950/40 to-surface-card',
      borderColor: 'border-red-900/30',
    },
    {
      title: 'Web Series',
      count: stats.series,
      icon: Tv,
      href: '/series',
      color: 'from-red-950/40 to-surface-card',
      borderColor: 'border-red-900/30',
    },
    {
      title: 'Episodes',
      count: stats.episodes,
      icon: Layers,
      href: '/series',
      color: 'from-red-950/40 to-surface-card',
      borderColor: 'border-red-900/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-red-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time catalog metrics and media management across all 4 industries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/upload"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-red-glow hover:shadow-red-glow-lg transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Media</span>
          </Link>
          <Link
            href="/admin/content"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-medium transition-all"
          >
            <Film className="w-4 h-4" />
            <span>Manage Catalog</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} border ${c.borderColor} shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {c.title}
                </span>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {isLoading ? '...' : c.count}
              </div>
              <div className="mt-2 flex items-center text-[11px] text-gray-500">
                <span>Active in streaming library</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage and Industry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Storage Stats */}
        <div className="p-5 rounded-2xl bg-surface-card border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400">
                Storage Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono capitalize">
                {storageProvider === 'local' ? 'Local Disk' : 'Cloudflare R2'}
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight mt-2">
              {isLoading ? '...' : stats.totalStorageFormatted || '0 B'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Total uploaded media storage consumed
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <span>
              {storageProvider === 'local' ? (
                <>Storage: <strong className="text-white font-mono">/storage</strong></>
              ) : (
                <>Bucket: <strong className="text-white font-mono">reelbeat-media</strong></>
              )}
            </span>
            <span>{storageProvider === 'local' ? 'Direct Disk Streaming' : 'Zero Egress Fees'}</span>
          </div>
        </div>

        {/* Industry Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
              Industry Catalog Distribution
            </span>
            <span className="text-[10px] text-gray-400 font-mono">4 Global Regions</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { name: 'Bollywood', count: stats.byIndustry?.bollywood ?? 0, flag: 'IN' },
              { name: 'Hollywood', count: stats.byIndustry?.hollywood ?? 0, flag: 'US' },
              { name: 'Bhojpuri', count: stats.byIndustry?.bhojpuri ?? 0, flag: 'IN-BH' },
              { name: 'Tollywood', count: stats.byIndustry?.tollywood ?? 0, flag: 'IN-TL' },
            ].map((ind) => (
              <div
                key={ind.name}
                className="p-3 rounded-xl bg-surface border border-white/5 hover:border-red-900/40 transition-colors"
              >
                <div className="text-[10px] uppercase font-mono text-gray-500">{ind.name}</div>
                <div className="text-xl font-bold text-white mt-1">
                  {isLoading ? '...' : ind.count}
                </div>
                <div className="text-[10px] text-red-400/80 mt-1">titles active</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-surface-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Recently Uploaded Media
            </h2>
          </div>
          <Link
            href="/admin/content"
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500 animate-pulse">
            Loading recent catalog items...
          </div>
        ) : recentUploads.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No media uploaded yet. Click Upload New Media to add your first title!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 uppercase font-mono text-[10px]">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Industry</th>
                  <th className="pb-3 font-semibold">Year</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentUploads.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 border border-white/5">
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-white max-w-xs truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {item.cast?.join(', ') || item.language}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 capitalize text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 capitalize text-gray-300 font-mono text-[11px]">
                      {item.industry}
                    </td>
                    <td className="py-3 text-gray-400 font-mono">{item.year}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                        Published
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={item.type === 'song' ? `/songs/${item.industry}` : `/watch/${item._id}`}
                        className="text-red-400 hover:text-white transition-colors"
                      >
                        Preview &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
