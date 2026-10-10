'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Film, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import MovieGalleryBg from '@/components/backgrounds/MovieGalleryBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

const industries = [
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'hollywood', name: 'Hollywood' },
  { id: 'bhojpuri', name: 'Bhojpuri' },
  { id: 'tollywood', name: 'Tollywood' },
];

export default function IndustryMoviesPage() {
  const params = useParams();
  const currentIndustry = (params.industry as string) || 'bollywood';

  const [movies, setMovies] = useState<ContentCardItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sort, setSort] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('type', 'movie');
      q.set('industry', currentIndustry);
      if (search) q.set('search', search);
      if (selectedGenre) q.set('genre', selectedGenre);
      if (selectedYear) q.set('year', selectedYear);
      if (sort) q.set('sort', sort);

      const res = await fetch(`/api/content?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setMovies(d.items || []);
      }
    } catch (err) {
      console.error('Failed to load industry movies', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentIndustry, search, selectedGenre, selectedYear, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchMovies]);

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      <MovieGalleryBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Top Header & Industry Switcher Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                Film Catalog
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {currentIndustry} Movies
              </h1>
            </div>

            {/* Quick Industry Pill Switcher */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-card border border-white/10 self-start sm:self-auto overflow-x-auto">
              {industries.map((ind) => {
                const isActive = ind.id === currentIndustry.toLowerCase();
                return (
                  <Link
                    key={ind.id}
                    href={`/movies/${ind.id}`}
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
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-card/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, actor, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Genre Filter */}
          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All Genres</option>
              <option value="Action">Action</option>
              <option value="Thriller">Thriller</option>
              <option value="Romance">Romance</option>
              <option value="Drama">Drama</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Crime">Crime</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
            >
              <option value="latest">Sort: Latest Releases</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="views">Sort: Most Popular</option>
              <option value="year">Sort: By Year</option>
            </select>
          </div>
        </div>

        {/* Movies Poster Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Showing {movies.length} titles in {currentIndustry}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : movies.length === 0 ? (
                  <div className="col-span-full py-24 text-center text-xs text-gray-500 bg-surface-card/40 border border-white/5 rounded-2xl">
                    No movies found matching your search and filter criteria.
                  </div>
                ) : (
                  movies.map((movie) => (
                    <ContentCard key={movie._id} item={movie} />
                  ))
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
