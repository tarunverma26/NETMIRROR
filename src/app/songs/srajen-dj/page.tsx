'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Music, Play, Pause, Disc, Heart, Volume2, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import EqualizerBg from '@/components/backgrounds/EqualizerBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';

const industries = [
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'hollywood', name: 'Hollywood' },
  { id: 'bhojpuri', name: 'Bhojpuri' },
  { id: 'tollywood', name: 'Tollywood' },
  { id: 'srajen-dj', name: 'Srajen Dj' },
];

export default function SrajenDjPage() {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();
  const { toggleWatchlist, isInWatchlist } = useAuth();

  const [songs, setSongs] = useState<ContentCardItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortOption, setSortOption] = useState<'latest' | 'rating' | 'views' | 'year' | 'bpm'>('latest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('type', 'song');
      q.set('industry', 'srajen-dj');
      if (search) q.set('search', search);
      if (selectedGenre) q.set('genre', selectedGenre);
      if (sortOption !== 'bpm') q.set('sort', sortOption);

      const res = await fetch(`/api/content?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        let items: ContentCardItem[] = d.items || [];
        if (sortOption === 'bpm') {
          items = [...items].sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
        }
        setSongs(items);
      }
    } catch (err) {
      console.error('Failed to load Srajen Dj songs', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedGenre, sortOption]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSongs();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchSongs]);

  const handleTrackClick = (song: ContentCardItem) => {
    if (currentTrack?._id === song._id) {
      togglePlay();
      return;
    }

    const queueList = songs.map((s) => ({
      _id: s._id,
      title: s.title,
      artist: s.cast?.join(', ') || 'Srajen Dj',
      thumbnailUrl: s.thumbnailUrl,
      mediaUrl: s.mediaUrl,
      duration: s.duration,
      industry: s.industry,
    }));

    playTrack(
      {
        _id: song._id,
        title: song.title,
        artist: song.cast?.join(', ') || 'Srajen Dj',
        thumbnailUrl: song.thumbnailUrl,
        mediaUrl: song.mediaUrl,
        duration: song.duration,
        industry: song.industry,
      },
      queueList
    );
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const queueList = songs.map((s) => ({
      _id: s._id,
      title: s.title,
      artist: s.cast?.join(', ') || 'Srajen Dj',
      thumbnailUrl: s.thumbnailUrl,
      mediaUrl: s.mediaUrl,
      duration: s.duration,
      industry: s.industry,
    }));

    playTrack(queueList[0], queueList);
  };

  return (
    <div className="relative min-h-screen pb-36 overflow-hidden">
      <EqualizerBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Industry Pill Switcher */}
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
          <Link
            href="/songs"
            className="text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <span>&larr; Back to Soundstage</span>
          </Link>

          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-card border border-white/10 overflow-x-auto">
            {industries.map((ind) => {
              const isActive = ind.id === 'srajen-dj';
              return (
                <Link
                  key={ind.id}
                  href={`/songs/${ind.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-red-glow'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {ind.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Short Banner with title, one-line description, and Play all button */}
        <div className="relative rounded-3xl overflow-hidden border border-red-500/30 bg-gradient-to-r from-black via-red-950/40 to-black p-6 sm:p-10 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          {/* Subtle Ambient Red Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono uppercase tracking-wider shadow-sm">
                <Disc className="w-3.5 h-3.5 animate-[spin_5s_linear_infinite] text-primary" />
                <span>Exclusive DJ Console</span>
                <span className="text-gray-400">&bull;</span>
                <span className="text-red-400 font-bold">Bass Boosted</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase flex items-center space-x-3">
                <span>Srajen Dj</span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed">
                Exclusive club remixes, high-energy festival drops, and bass-boosted party anthems curated by Srajen Dj.
              </p>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  onClick={handlePlayAll}
                  disabled={songs.length === 0}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-red-glow hover:shadow-red-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                  <span>Play All Tracks</span>
                </button>

                <span className="text-xs font-mono text-gray-400">
                  {songs.length} {songs.length === 1 ? 'Track' : 'Tracks'} Loaded
                </span>
              </div>
            </div>

            {/* Turntable / DJ Art Accent */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <div className="relative w-36 h-36 rounded-full bg-black/80 border-2 border-red-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <div className="absolute inset-2 rounded-full border border-red-900/40 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-6 rounded-full border border-dashed border-red-500/30 animate-[spin_6s_linear_infinite_reverse]" />
                <Disc className="w-16 h-16 text-primary animate-[spin_4s_linear_infinite]" />
                <div className="absolute w-4 h-4 rounded-full bg-red-400 shadow-[0_0_10px_#ef4444]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-card/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by track title, remix style, or singer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All DJ Styles</option>
              <option value="EDM">EDM / Festival</option>
              <option value="Club">Club VIP Mix</option>
              <option value="Bass Boosted">Bass Boosted</option>
              <option value="Desi Bass">Desi Bass / Dholak</option>
              <option value="Mashup">Mashup & Edits</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            >
              <option value="latest">Sort: Latest</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="views">Sort: Most Played</option>
              <option value="bpm">Sort: Fast BPM</option>
              <option value="year">Sort: Year</option>
            </select>

            <div className="flex items-center rounded-xl bg-surface border border-white/10 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Table or Grid */}
        {isLoading ? (
          <div className="py-24 text-center text-xs text-gray-500 animate-pulse">
            Loading Srajen Dj playlist...
          </div>
        ) : songs.length === 0 ? (
          <div className="py-24 text-center bg-surface-card border border-white/10 rounded-2xl p-8 space-y-3">
            <Disc className="w-8 h-8 text-red-500/50 mx-auto" />
            <p className="text-sm font-semibold text-white">No tracks found matching your query</p>
            <p className="text-xs text-gray-400">Try clearing your search term or upload a new track through the Admin Panel.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {songs.map((song) => (
              <ContentCard key={song._id} item={song} playlistContext={songs} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-card/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                    <th className="py-3 px-4 font-semibold">Track & Artist</th>
                    <th className="py-3 px-4 font-semibold">Remix Details</th>
                    <th className="py-3 px-4 font-semibold">BPM</th>
                    <th className="py-3 px-4 font-semibold">Genre</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {songs.map((song, idx) => {
                    const isCurrent = currentTrack?._id === song._id;
                    const isTrackPlaying = isCurrent && isPlaying;
                    const inFav = isInWatchlist(song._id);

                    return (
                      <tr
                        key={song._id}
                        onClick={() => handleTrackClick(song)}
                        className={`group cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-primary/10 text-white'
                            : 'hover:bg-white/[0.03] text-gray-300'
                        }`}
                      >
                        {/* Play/Number Cell */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackClick(song);
                            }}
                            className="w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all"
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <span className="group-hover:hidden text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </span>
                            )}
                            <Play className={`w-3.5 h-3.5 text-primary ml-0.5 fill-current hidden ${!isTrackPlaying ? 'group-hover:block' : ''}`} />
                          </button>
                        </td>

                        {/* Title & Cover Art */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                              <Image
                                src={song.thumbnailUrl}
                                alt={song.title}
                                fill
                                className="object-cover"
                              />
                              {isTrackPlaying && (
                                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`font-semibold text-sm truncate ${
                                  isCurrent ? 'text-primary' : 'text-white group-hover:text-red-300'
                                }`}
                              >
                                {song.title}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {song.cast?.join(', ') || 'Srajen Dj'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Remix Name */}
                        <td className="py-3 px-4">
                          {song.remixName ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/70 border border-primary/40 text-red-300">
                              {song.remixName}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[11px]">Original</span>
                          )}
                        </td>

                        {/* BPM */}
                        <td className="py-3 px-4 font-mono">
                          {song.bpm ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 border border-white/10 text-gray-300">
                              {song.bpm} BPM
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Genre */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {song.genre?.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-400 border border-white/5"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-mono text-gray-400">
                          {song.duration || '3:30'}
                        </td>

                        {/* Favourite Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(song._id);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${
                              inFav
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-white'
                            }`}
                            aria-label="Add to favourites"
                          >
                            <Heart className={`w-4 h-4 ${inFav ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
