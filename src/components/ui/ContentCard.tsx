'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Heart, Film, Music, Tv, Star } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';

export interface ContentCardItem {
  _id: string;
  type: 'movie' | 'song' | 'series';
  industry: 'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood' | 'srajen-dj';
  title: string;
  description?: string;
  genre: string[];
  year: number;
  language?: string;
  cast?: string[];
  thumbnailUrl: string;
  mediaUrl: string;
  duration?: string;
  rating?: number;
  views?: number;
  episodesCount?: number;
  remixName?: string;
  bpm?: number;
}

interface ContentCardProps {
  item: ContentCardItem;
  playlistContext?: ContentCardItem[];
}

export default function ContentCard({ item, playlistContext }: ContentCardProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const { toggleWatchlist, isInWatchlist } = useAuth();

  const isCurrentPlayingSong =
    item.type === 'song' && currentTrack?._id === item._id && isPlaying;

  const targetLink =
    item.type === 'song'
      ? `/songs/${item.industry}`
      : item.type === 'series'
      ? `/series/show/${item._id}`
      : `/watch/${item._id}`;

  const handleActionClick = (e: React.MouseEvent) => {
    if (item.type === 'song') {
      e.preventDefault();
      const audioQueue = (playlistContext || [item])
        .filter((i) => i.type === 'song')
        .map((i) => ({
          _id: i._id,
          title: i.title,
          artist: i.cast?.join(', ') || i.language,
          thumbnailUrl: i.thumbnailUrl,
          mediaUrl: i.mediaUrl,
          duration: i.duration,
          industry: i.industry,
        }));

      playTrack(
        {
          _id: item._id,
          title: item.title,
          artist: item.cast?.join(', ') || item.language,
          thumbnailUrl: item.thumbnailUrl,
          mediaUrl: item.mediaUrl,
          duration: item.duration,
          industry: item.industry,
        },
        audioQueue
      );
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(item._id);
  };

  const inWatchlist = isInWatchlist(item._id);

  return (
    <div className="group relative rounded-xl overflow-hidden bg-surface-card border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-red-glow flex flex-col h-full">
      {/* Poster Image Container */}
      <Link
        href={targetLink}
        onClick={item.type === 'song' ? handleActionClick : undefined}
        className="relative block aspect-[16/10] sm:aspect-[3/4] w-full overflow-hidden bg-surface"
      >
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Ambient Dark-Red Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
            item.industry === 'srajen-dj'
              ? 'bg-red-950/90 border border-primary text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : 'bg-black/75 border border-primary/40 text-red-300'
          }`}>
            {item.industry === 'srajen-dj' ? 'Srajen Dj' : item.industry}
          </span>

          <button
            onClick={handleWatchlistClick}
            aria-label="Add to favourites"
            className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
              inWatchlist
                ? 'bg-primary text-white'
                : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/90'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        {/* Center Hover Action Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <div
            onClick={item.type === 'song' ? handleActionClick : undefined}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-red-glow transform scale-75 group-hover:scale-100 transition-all ${
              isCurrentPlayingSong
                ? 'bg-white text-primary animate-pulse'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Duration / Episode Tag */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-gray-300 backdrop-blur-sm border border-white/5">
            {item.duration}
          </div>
        )}
      </Link>

      {/* Content Metadata */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 mb-1">
            <span>{item.year}</span>
            <span>&bull;</span>
            <span className="capitalize">{item.type}</span>
            {item.rating && (
              <>
                <span>&bull;</span>
                <span className="flex items-center text-amber-400 font-medium">
                  <Star className="w-3 h-3 mr-0.5 fill-current" />
                  {item.rating}
                </span>
              </>
            )}
          </div>

          <Link href={targetLink}>
            <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors line-clamp-1">
              {item.title}
            </h3>
          </Link>

          {item.cast && item.cast.length > 0 && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
              {item.cast.join(', ')}
            </p>
          )}

          {/* Optional DJ Remix Name & BPM Badges */}
          {(item.remixName || item.bpm) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {item.remixName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/70 border border-primary/40 text-red-300">
                  {item.remixName}
                </span>
              )}
              {item.bpm && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/60 border border-white/10 text-gray-300">
                  {item.bpm} BPM
                </span>
              )}
            </div>
          )}
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {item.genre?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 border border-white/5"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
