'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Tv } from 'lucide-react';
import FilmStripBg from '@/components/backgrounds/FilmStripBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

const industries = [
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'hollywood', name: 'Hollywood' },
  { id: 'bhojpuri', name: 'Bhojpuri' },
  { id: 'tollywood', name: 'Tollywood' },
];

export default function IndustrySeriesPage() {
  const params = useParams();
  const currentIndustry = (params.industry as string) || 'bollywood';

  const [seriesList, setSeriesList] = useState<ContentCardItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('type', 'series');
      q.set('industry', currentIndustry);
      if (search) q.set('search', search);

      const res = await fetch(`/api/content?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setSeriesList(d.items || []);
      }
    } catch (err) {
      console.error('Failed to load industry series', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentIndustry, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSeries();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchSeries]);

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      <FilmStripBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Industry Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-primary">
              Episodic Catalog
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {currentIndustry} Web Series
            </h1>
          </div>

          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-surface-card border border-white/10 self-start sm:self-auto overflow-x-auto">
            {industries.map((ind) => {
              const isActive = ind.id === currentIndustry.toLowerCase();
              return (
                <Link
                  key={ind.id}
                  href={`/series/${ind.id}`}
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

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search series by title or star cast..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary shadow-lg"
          />
        </div>

        {/* Series Poster Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : seriesList.length === 0 ? (
                <div className="col-span-full py-24 text-center text-xs text-gray-500 bg-surface-card/40 border border-white/5 rounded-2xl">
                  No series found in {currentIndustry}.
                </div>
              ) : (
                seriesList.map((series) => (
                  <ContentCard key={series._id} item={series} />
                ))
              )}
        </div>
      </div>
    </div>
  );
}
