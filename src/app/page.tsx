'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Music, Tv, ChevronRight, Play, Flame, Sparkles } from 'lucide-react';
import ReelHeroScene from '@/components/3d/ReelHeroScene';
import TiltCard from '@/components/3d/TiltCard';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const [recentMovies, setRecentMovies] = useState<ContentCardItem[]>([]);
  const [recentSongs, setRecentSongs] = useState<ContentCardItem[]>([]);
  const [recentSeries, setRecentSeries] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [moviesRes, songsRes, seriesRes] = await Promise.all([
          fetch('/api/content?type=movie&limit=6', { cache: 'no-store' }),
          fetch('/api/content?type=song&limit=6', { cache: 'no-store' }),
          fetch('/api/content?type=series&limit=6', { cache: 'no-store' }),
        ]);

        if (moviesRes.ok) {
          const d = await moviesRes.json();
          setRecentMovies(d.items || []);
        }
        if (songsRes.ok) {
          const d = await songsRes.json();
          setRecentSongs(d.items || []);
        }
        if (seriesRes.ok) {
          const d = await seriesRes.json();
          setRecentSeries(d.items || []);
        }
      } catch (err) {
        console.error('Failed to load home catalog items', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-16 sm:space-y-24 pb-24">
      {/* ================= 1. 3D HERO SECTION ================= */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6">
        {/* React Three Fiber 3D Scene */}
        <ReelHeroScene />

        {/* Ambient Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-background/80 pointer-events-none" />

        {/* Hero Typography & CTA */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pt-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-primary/40 text-red-400 text-xs font-mono uppercase tracking-widest backdrop-blur-md shadow-red-glow">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Bollywood &bull; Hollywood &bull; Bhojpuri &bull; Tollywood</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
            CINEMA REIMAGINED. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-300 to-primary">
              EVERY BEAT. EVERY REEL.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-300 font-normal leading-relaxed">
            Experience next-generation streaming across India and the globe.
            From blockbuster motion pictures and viral hits to episodic web sagas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/movies"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-red-glow hover:shadow-red-glow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Movies</span>
            </Link>
            <Link
              href="/songs"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-surface-card hover:bg-white/10 text-white border border-white/10 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <Music className="w-4 h-4 text-primary" />
              <span>Listen to Songs</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1 opacity-60 text-xs font-mono text-gray-400">
          <span>SCROLL TO EXPLORE</span>
          <div className="w-4 h-7 rounded-full border border-gray-500 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </section>

      {/* ================= 2. THREE LARGE 3D-TILT CARDS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore By Experience
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Hover over cards to feel dynamic 3D depth and perspective response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <TiltCard
            href="/movies"
            title="Movies"
            subtitle="Blockbuster epics, action thrillers, romantic masterpieces, and indie revelations across 4 industries."
            badge="Cinema Hub"
            icon={<Film className="w-6 h-6" />}
            bgImage="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop"
            stats="4 Industries &bull; 4K UHD"
          />

          <TiltCard
            href="/songs"
            title="Songs & Music"
            subtitle="High-fidelity audio streaming with continuous playback, animated equalizer, and spinning vinyl vibe."
            badge="Music Hub"
            icon={<Music className="w-6 h-6" />}
            bgImage="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900&auto=format&fit=crop"
            stats="Lossless Audio &bull; Continuous Player"
          />

          <TiltCard
            href="/series"
            title="Web Series"
            subtitle="Binge-worthy seasonal sagas, intense criminal underworlds, and sci-fi temporal journeys."
            badge="Series Hub"
            icon={<Tv className="w-6 h-6" />}
            bgImage="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=900&auto=format&fit=crop"
            stats="Full Seasons &bull; Episodic Player"
          />
        </div>
      </section>

      {/* ================= 3. RECENTLY ADDED MOVIES ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-950/40 border border-primary/40 text-primary">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recently Added Movies
              </h2>
              <p className="text-xs text-gray-400">
                Fresh theatrical and direct-to-digital motion pictures
              </p>
            </div>
          </div>

          <Link
            href="/movies"
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-semibold group transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : recentMovies.map((movie) => (
                <ContentCard key={movie._id} item={movie} />
              ))}
        </div>
      </section>

      {/* ================= 4. RECENTLY ADDED SONGS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-950/40 border border-primary/40 text-primary">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recently Added Songs
              </h2>
              <p className="text-xs text-gray-400">
                Trending soundtracks, folk anthems, and synth beats
              </p>
            </div>
          </div>

          <Link
            href="/songs"
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-semibold group transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : recentSongs.map((song) => (
                <ContentCard
                  key={song._id}
                  item={song}
                  playlistContext={recentSongs}
                />
              ))}
        </div>
      </section>

      {/* ================= 5. RECENTLY ADDED WEB SERIES ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-950/40 border border-primary/40 text-primary">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recently Added Web Series
              </h2>
              <p className="text-xs text-gray-400">
                Compelling narratives, high-stakes drama, and episodic releases
              </p>
            </div>
          </div>

          <Link
            href="/series"
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-semibold group transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : recentSeries.map((series) => (
                <ContentCard key={series._id} item={series} />
              ))}
        </div>
      </section>
    </div>
  );
}
