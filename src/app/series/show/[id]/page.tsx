'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Star, Calendar, Heart, Share2, Layers, Tv } from 'lucide-react';
import FilmStripBg from '@/components/backgrounds/FilmStripBg';
import { useAuth } from '@/context/AuthContext';
import { SeedContent, SeedEpisode } from '@/lib/initialData';

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesId = params.id as string;

  const { toggleWatchlist, isInWatchlist } = useAuth();

  const [series, setSeries] = useState<SeedContent | null>(null);
  const [episodes, setEpisodes] = useState<SeedEpisode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadShowDetails() {
      try {
        const res = await fetch(`/api/content/${seriesId}`);
        if (res.ok) {
          const data = await res.json();
          setSeries(data.content);
          setEpisodes(data.episodes || []);
        }
      } catch (err) {
        console.error('Failed to load series details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadShowDetails();
  }, [seriesId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Series Not Found</h2>
        <Link href="/series" className="text-sm text-primary underline">
          &larr; Return to Web Series Hub
        </Link>
      </div>
    );
  }

  const seasonsList = Array.from(
    { length: Math.max(1, series.seasonsCount || 1) },
    (_, i) => i + 1
  );

  const filteredEpisodes = episodes.filter((ep) => ep.season === selectedSeason);
  const inWatchlist = isInWatchlist(series._id);

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      <FilmStripBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Link href="/series" className="hover:text-white">Web Series</Link>
          <span>/</span>
          <Link href={`/series/${series.industry}`} className="hover:text-white capitalize">
            {series.industry}
          </Link>
          <span>/</span>
          <span className="text-white truncate">{series.title}</span>
        </div>

        {/* Hero Backdrop Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-surface-card shadow-2xl">
          <div className="relative h-[360px] sm:h-[440px] w-full">
            <Image
              src={series.thumbnailUrl}
              alt={series.title}
              fill
              className="object-cover filter brightness-[0.35]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-card via-surface-card/40 to-transparent" />

            {/* Floating Meta */}
            <div className="absolute bottom-8 left-8 right-8 z-10 space-y-4 max-w-3xl">
              <div className="flex items-center space-x-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/80 border border-primary/50 text-red-400 backdrop-blur-md">
                  {series.industry} Original
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  {series.year} &bull; {series.seasonsCount || 1} Seasons
                </span>
                {series.rating && (
                  <span className="flex items-center text-xs font-semibold text-amber-400">
                    <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                    {series.rating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {series.title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
                {series.description}
              </p>

              {series.cast && (
                <p className="text-xs text-gray-400">
                  <span className="text-gray-200 font-semibold">Starring:</span>{' '}
                  {series.cast.join(', ')}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <Link
                  href={`/watch/${filteredEpisodes[0]?._id || series._id}`}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider shadow-red-glow flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Episode 1</span>
                </Link>

                <button
                  onClick={() => toggleWatchlist(series._id)}
                  className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                    inWatchlist
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Save to favourites"
                >
                  <Heart className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Season Selector & Episodes List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Episodes
              </h2>
            </div>

            {/* Season Tabs */}
            <div className="flex items-center space-x-2">
              {seasonsList.map((season) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedSeason === season
                      ? 'bg-primary text-white shadow-red-glow'
                      : 'bg-surface-card border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Season {season}
                </button>
              ))}
            </div>
          </div>

          {/* Episode Cards Grid */}
          {filteredEpisodes.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500 bg-surface-card/40 border border-white/5 rounded-2xl">
              No episodes listed for Season {selectedSeason} yet. Admin can upload episodes in the Admin Panel!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEpisodes.map((ep) => (
                <Link
                  key={ep._id}
                  href={`/watch/${ep._id}`}
                  className="group rounded-2xl overflow-hidden bg-surface-card border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-red-glow flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-surface overflow-hidden">
                    <Image
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-red-glow transform scale-75 group-hover:scale-100 transition-all">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 text-gray-300">
                      {ep.duration}
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-white">
                      EP {ep.episodeNumber}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {ep.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {ep.description || 'Watch full streaming episode in HD.'}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center text-xs font-semibold text-primary">
                      <span>Stream Episode &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
