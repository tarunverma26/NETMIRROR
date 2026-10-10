'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Search, Music, Play, Pause, Disc, Heart, Volume2 } from 'lucide-react';
import EqualizerBg from '@/components/backgrounds/EqualizerBg';
import { ContentCardItem } from '@/components/ui/ContentCard';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';

const industries = [
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'hollywood', name: 'Hollywood' },
  { id: 'bhojpuri', name: 'Bhojpuri' },
  { id: 'tollywood', name: 'Tollywood' },
  { id: 'srajen-dj', name: 'Srajen Dj' },
];

export default function IndustrySongsPage() {
  const params = useParams();
  const currentIndustry = (params.industry as string) || 'bollywood';

  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();
  const { toggleWatchlist, isInWatchlist } = useAuth();

  const [songs, setSongs] = useState<ContentCardItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('type', 'song');
      q.set('industry', currentIndustry);
      if (search) q.set('search', search);
      if (selectedGenre) q.set('genre', selectedGenre);

      const res = await fetch(`/api/content?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setSongs(d.items || []);
      }
    } catch (err) {
      console.error('Failed to load industry songs', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentIndustry, search, selectedGenre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSongs();
    }, 250);
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
      artist: s.cast?.join(', ') || s.language,
      thumbnailUrl: s.thumbnailUrl,
      mediaUrl: s.mediaUrl,
      duration: s.duration,
      industry: s.industry,
    }));

    playTrack(
      {
        _id: song._id,
        title: song.title,
        artist: song.cast?.join(', ') || song.language,
        thumbnailUrl: song.thumbnailUrl,
        mediaUrl: song.mediaUrl,
        duration: song.duration,
        industry: song.industry,
      },
      queueList
    );
  };

  return (
    <div className="relative min-h-screen pb-36 overflow-hidden">
      <EqualizerBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Industry Pill Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary">
              Lossless Tracklist
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {industries.find((i) => i.id === currentIndustry.toLowerCase())?.name || currentIndustry} Songs
            </h1>
          </div>

          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-card border border-white/10 self-start sm:self-auto overflow-x-auto">
            {industries.map((ind) => {
              const isActive = ind.id === currentIndustry.toLowerCase();
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

        {/* Search and Genre Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-card/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by track name, singer, or mood..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All Music Genres</option>
              <option value="Sufi">Sufi / Devotional</option>
              <option value="Pop">Synthwave & Pop</option>
              <option value="Electronic">Electronic</option>
              <option value="Romantic">Romantic</option>
              <option value="Mass">Mass Beat / Folk</option>
            </select>
          </div>
        </div>

        {/* Interactive Track List Table */}
        <div className="bg-surface-card/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-gray-500 animate-pulse">
              Loading audio tracks...
            </div>
          ) : songs.length === 0 ? (
            <div className="py-20 text-center text-xs text-gray-500">
              No songs found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                    <th className="py-3 px-4 font-semibold">Track & Artist</th>
                    <th className="py-3 px-4 font-semibold">Genre</th>
                    <th className="py-3 px-4 font-semibold">Year</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold text-right">Favourite</th>
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
                                {song.cast?.join(', ') || `${song.industry} Artist`}
                              </p>
                            </div>
                          </div>
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

                        {/* Year */}
                        <td className="py-3 px-4 font-mono text-gray-400">
                          {song.year}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-mono text-gray-400">
                          {song.duration || '3:30'}
                        </td>

                        {/* Favourite Heart */}
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
          )}
        </div>
      </div>
    </div>
  );
}
