'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tv, Sparkles, ChevronRight, Play } from 'lucide-react';
import FilmStripBg from '@/components/backgrounds/FilmStripBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function SeriesHubPage() {
  const [seriesList, setSeriesList] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSeries() {
      try {
        const res = await fetch('/api/content?type=series&limit=12');
        if (res.ok) {
          const d = await res.json();
          setSeriesList(d.items || []);
        }
      } catch (err) {
        console.error('Failed to load series', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSeries();
  }, []);

  const industries = [
    {
      id: 'bollywood',
      name: 'Bollywood Series',
      subtitle: 'Heartland mafia dynasties, gritty crime thrillers & political sagas',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=900&auto=format&fit=crop',
    },
    {
      id: 'hollywood',
      name: 'Hollywood Series',
      subtitle: 'Quantum sci-fi mysteries, high-concept heists & space sagas',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=900&auto=format&fit=crop',
    },
    {
      id: 'bhojpuri',
      name: 'Bhojpuri Series',
      subtitle: 'Courtroom crusades, grassroots justice & rural village chronicles',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop',
    },
    {
      id: 'tollywood',
      name: 'Tollywood Series',
      subtitle: 'Sprawling industrial dynasties, statecraft intrigue & mass warfare',
      poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=900&auto=format&fit=crop',
    },
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Red-Lit Episode Strip Background */}
      <FilmStripBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-primary/40 text-red-400 text-xs font-mono uppercase tracking-wider backdrop-blur-md shadow-red-glow">
            <Tv className="w-3.5 h-3.5" />
            <span>Episodic Cinema</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            WEB SERIES & SAGAS
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-300">
            Unfold deep character narratives across seasons and episodes. Select an
            industry or jump into featured original series.
          </p>
        </div>

        {/* 4 Industry Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={`/series/${ind.id}`}
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
                  Series Catalog
                </span>
                <h3 className="text-2xl font-black text-white group-hover:text-red-300 transition-colors">
                  {ind.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {ind.subtitle}
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Explore Series</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Series Grid */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Featured Original Series
              </h2>
              <p className="text-xs text-gray-400">
                Multi-season drama series available for binge watching
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : seriesList.map((series) => (
                  <ContentCard key={series._id} item={series} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
