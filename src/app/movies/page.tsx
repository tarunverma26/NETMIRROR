'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Sparkles, ChevronRight, Play } from 'lucide-react';
import MovieGalleryBg from '@/components/backgrounds/MovieGalleryBg';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';

export const dynamic = 'force-dynamic';

export default function MoviesHubPage() {
  const [movies, setMovies] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMovies() {
      try {
        const res = await fetch('/api/content?type=movie&limit=12', { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setMovies(d.items || []);
        }
      } catch (err) {
        console.error('Failed to load movies', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMovies();
  }, []);

  const industries = [
    {
      id: 'bollywood',
      name: 'Bollywood',
      subtitle: 'Heart of Hindi Cinema & Pan-Indian Spectacles',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=900&auto=format&fit=crop',
      accent: 'border-orange-500/40 hover:border-orange-500',
    },
    {
      id: 'hollywood',
      name: 'Hollywood',
      subtitle: 'Global Blockbusters, Sci-Fi Thrillers & Noir',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=900&auto=format&fit=crop',
      accent: 'border-blue-500/40 hover:border-blue-500',
    },
    {
      id: 'bhojpuri',
      name: 'Bhojpuri',
      subtitle: 'Rustic Folklore, High-Voltage Action & Cultural Roots',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop',
      accent: 'border-yellow-500/40 hover:border-yellow-500',
    },
    {
      id: 'tollywood',
      name: 'Tollywood',
      subtitle: 'Visceral Mythologies, Mass Heroes & Epic Drama',
      poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=900&auto=format&fit=crop',
      accent: 'border-red-500/40 hover:border-red-500',
    },
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Drifting Parallax Poster Wall Background */}
      <MovieGalleryBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-primary/40 text-red-400 text-xs font-mono uppercase tracking-wider backdrop-blur-md shadow-red-glow">
            <Film className="w-3.5 h-3.5" />
            <span>Cinematic Wall</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            THE MOVIE UNIVERSE
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-300">
            Select an industry below to immerse yourself in dedicated catalogs,
            or browse trending worldwide releases.
          </p>
        </div>

        {/* Four Industry Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={`/movies/${ind.id}`}
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
                  Industry Catalog
                </span>
                <h3 className="text-2xl font-black text-white group-hover:text-red-300 transition-colors">
                  {ind.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {ind.subtitle}
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Browse Catalog</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* All Trending Movies Grid */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Featured Theatrical & Streaming Films
              </h2>
              <p className="text-xs text-gray-400">
                Top rated motion pictures across all industries
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : movies.map((movie) => (
                  <ContentCard key={movie._id} item={movie} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
