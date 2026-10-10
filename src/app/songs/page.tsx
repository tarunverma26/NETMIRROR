'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, Play, Pause, ChevronRight, Disc, Volume2 } from 'lucide-react';
import EqualizerBg from '@/components/backgrounds/EqualizerBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { useAudio } from '@/context/AudioContext';

export const dynamic = 'force-dynamic';

export default function SongsHubPage() {
  const [songs, setSongs] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  useEffect(() => {
    async function loadSongs() {
      try {
        const res = await fetch('/api/content?type=song&limit=12', { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setSongs(d.items || []);
        }
      } catch (err) {
        console.error('Failed to load songs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSongs();
  }, []);

  const industries = [
    {
      id: 'bollywood',
      name: 'Bollywood Music',
      subtitle: 'Sufi ballads, indie synthpop & timeless romantic duets',
      poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900&auto=format&fit=crop',
      isDj: false,
    },
    {
      id: 'hollywood',
      name: 'Hollywood Tracks',
      subtitle: 'Synthwave hits, electro-pop anthems & ambient rock',
      poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900&auto=format&fit=crop',
      isDj: false,
    },
    {
      id: 'bhojpuri',
      name: 'Bhojpuri Beats',
      subtitle: 'High-energy desi brass, festive melodies & rustic soul',
      poster: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=900&auto=format&fit=crop',
      isDj: false,
    },
    {
      id: 'tollywood',
      name: 'Tollywood Rhythms',
      subtitle: 'Thunderous mass anthems, nadaswaram drops & soulful melodies',
      poster: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=900&auto=format&fit=crop',
      isDj: false,
    },
    {
      id: 'srajen-dj',
      name: 'Srajen Dj',
      subtitle: 'Bass-boosted club edits, nonstop EDM drops & exclusive party remixes',
      poster: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=900&auto=format&fit=crop',
      isDj: true,
    },
  ];

  return (
    <div className="relative min-h-screen pb-32 overflow-hidden">
      {/* Dynamic Animated Equalizer & Vinyl Record Background */}
      <EqualizerBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-primary/40 text-red-400 text-xs font-mono uppercase tracking-wider backdrop-blur-md shadow-red-glow">
            <Music className="w-3.5 h-3.5" />
            <span>Lossless Soundwave</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            THE SOUNDSTAGE
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-300">
            Immerse yourself in lossless audio. Select an industry to browse curated
            tracklists or start playing instantly—audio keeps playing as you explore.
          </p>
        </div>

        {/* 5 Industry Music Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={`/songs/${ind.id}`}
              className={`group relative h-80 rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                ind.isDj
                  ? 'border-primary/60 bg-gradient-to-b from-red-950/40 via-surface-card to-black shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:border-red-400'
                  : 'border-white/10 hover:border-primary/50 bg-surface-card hover:shadow-red-glow'
              }`}
            >
              <Image
                src={ind.poster}
                alt={ind.name}
                fill
                className={`object-cover transition-all duration-500 ${
                  ind.isDj
                    ? 'filter brightness-[0.45] group-hover:brightness-[0.7] group-hover:scale-110'
                    : 'filter brightness-[0.4] group-hover:brightness-[0.6] group-hover:scale-105'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

              {/* DJ Badge / Spinning Turntable Visual for Srajen Dj */}
              {ind.isDj && (
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-primary/60 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    <span>DJ Console</span>
                  </span>

                  <div className="w-9 h-9 rounded-full bg-black/80 border border-primary/60 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform">
                    <Disc className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
                  </div>
                </div>
              )}

              <div className={`relative z-10 p-5 flex flex-col justify-end space-y-2 ${ind.isDj ? 'mt-auto' : 'h-full'}`}>
                <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 flex items-center space-x-1">
                  {ind.isDj ? (
                    <>
                      <Volume2 className="w-3 h-3 text-red-400 inline" />
                      <span>Club Remixes & Edits</span>
                    </>
                  ) : (
                    <span>Audio Catalog</span>
                  )}
                </span>
                <h3 className={`text-xl sm:text-2xl font-black text-white transition-colors ${
                  ind.isDj ? 'text-red-300 group-hover:text-red-200 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'group-hover:text-red-300'
                }`}>
                  {ind.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {ind.subtitle}
                </p>
                <div className="pt-1 flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Open Tracklist</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Trending Songs Grid */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Trending Tracks Worldwide
              </h2>
              <p className="text-xs text-gray-400">
                Click any song to launch the persistent bottom audio player
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : songs.map((song) => (
                  <ContentCard key={song._id} item={song} playlistContext={songs} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
