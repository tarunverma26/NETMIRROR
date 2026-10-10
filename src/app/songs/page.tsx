'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, Play, Pause, ChevronRight, Disc, Volume2 } from 'lucide-react';
import EqualizerBg from '@/components/backgrounds/EqualizerBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { useAudio } from '@/context/AudioContext';

export default function SongsHubPage() {
  const [songs, setSongs] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  useEffect(() => {
    async function loadSongs() {
      try {
        const res = await fetch('/api/content?type=song&limit=12');
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
    },
    {
      id: 'hollywood',
      name: 'Hollywood Tracks',
      subtitle: 'Synthwave hits, electro-pop anthems & ambient rock',
      poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900&auto=format&fit=crop',
    },
    {
      id: 'bhojpuri',
      name: 'Bhojpuri Beats',
      subtitle: 'High-energy desi brass, festive melodies & rustic soul',
      poster: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=900&auto=format&fit=crop',
    },
    {
      id: 'tollywood',
      name: 'Tollywood Rhythms',
      subtitle: 'Thunderous mass anthems, nadaswaram drops & soulful melodies',
      poster: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=900&auto=format&fit=crop',
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

        {/* 4 Industry Music Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={`/songs/${ind.id}`}
              className="group relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 bg-surface-card transition-all duration-300 hover:shadow-red-glow"
            >
              <Image
                src={ind.poster}
                alt={ind.name}
                fill
                className="object-cover filter brightness-[0.4] group-hover:brightness-[0.6] group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

              <div className="relative z-10 h-full p-6 flex flex-col justify-end space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-red-400">
                  Audio Catalog
                </span>
                <h3 className="text-2xl font-black text-white group-hover:text-red-300 transition-colors">
                  {ind.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {ind.subtitle}
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
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
