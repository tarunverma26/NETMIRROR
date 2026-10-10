'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, Heart, Share2, Film, Tv, Calendar, Sparkles } from 'lucide-react';
import CustomVideoPlayer from '@/components/player/CustomVideoPlayer';
import ContentCard, { ContentCardItem } from '@/components/ui/ContentCard';
import { useAuth } from '@/context/AuthContext';
import { SeedContent, SeedEpisode } from '@/lib/initialData';

export default function WatchPage() {
  const params = useParams();
  const id = params.id as string;

  const { toggleWatchlist, isInWatchlist } = useAuth();

  const [content, setContent] = useState<SeedContent | null>(null);
  const [episode, setEpisode] = useState<SeedEpisode | null>(null);
  const [similarItems, setSimilarItems] = useState<ContentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/content/${id}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setSimilarItems(data.similarItems || []);
        } else {
          // If not found in content, check if this is an episode ID
          const seriesListRes = await fetch('/api/content?type=series&limit=50');
          if (seriesListRes.ok) {
            const seriesData = await seriesListRes.json();
            for (const s of seriesData.items) {
              const fullSeriesRes = await fetch(`/api/content/${s._id}`);
              if (fullSeriesRes.ok) {
                const fData = await fullSeriesRes.json();
                const ep = fData.episodes?.find((e: SeedEpisode) => e._id === id);
                if (ep) {
                  setEpisode(ep);
                  setContent(fData.content);
                  setSimilarItems(fData.similarItems || []);
                  break;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load media player item', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadItem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Title Not Found</h2>
        <Link href="/" className="text-sm text-primary underline">
          &larr; Return to REELBEAT Home
        </Link>
      </div>
    );
  }

  const mediaSource = episode ? episode.mediaUrl : content.mediaUrl;
  const posterSource = episode ? episode.thumbnailUrl : content.thumbnailUrl;
  const displayTitle = episode
    ? `${content.title}: Season ${episode.season} - ${episode.title}`
    : content.title;
  const inWatchlist = isInWatchlist(content._id);

  return (
    <div className="min-h-screen pb-24 bg-cinema-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link
            href={content.type === 'series' ? '/series' : '/movies'}
            className="hover:text-white capitalize"
          >
            {content.type}
          </Link>
          <span>/</span>
          <Link
            href={`/${content.type === 'series' ? 'series' : 'movies'}/${content.industry}`}
            className="hover:text-white capitalize"
          >
            {content.industry}
          </Link>
          <span>/</span>
          <span className="text-white truncate">{content.title}</span>
        </div>

        {/* Cinematic Custom Video Player */}
        <div className="w-full">
          <CustomVideoPlayer
            src={mediaSource}
            poster={posterSource}
            title={displayTitle}
          />
        </div>

        {/* Media Metadata and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950/40 border border-primary/50 text-red-300">
                {content.industry}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">
                {content.type}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {content.year}
              </span>
              {content.duration && (
                <span className="text-xs text-gray-400 font-mono">
                  &bull; {content.duration}
                </span>
              )}
              {content.rating && (
                <span className="flex items-center text-xs font-semibold text-amber-400">
                  <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                  {content.rating} / 10
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {displayTitle}
            </h1>

            <p className="text-sm text-gray-300 leading-relaxed">
              {episode?.description || content.description}
            </p>

            {/* Cast & Crew */}
            {content.cast && content.cast.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Cast & Creators
                </span>
                <p className="text-xs text-gray-300">
                  {content.cast.join(', ')}
                </p>
              </div>
            )}

            {/* Genre Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {content.genre?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-lg text-xs bg-surface-card border border-white/10 text-gray-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Right Action Box */}
          <div className="space-y-4">
            <div className="bg-surface-card border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Viewer Options
              </h3>

              <button
                onClick={() => toggleWatchlist(content._id)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border transition-all ${
                  inWatchlist
                    ? 'bg-primary border-primary text-white shadow-red-glow'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
                <span>{inWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <div className="text-[11px] text-gray-400 space-y-2 pt-2 border-t border-white/5">
                <p className="flex justify-between">
                  <span>Audio & Video Quality:</span>
                  <span className="text-white font-mono">1080p Full HD</span>
                </p>
                <p className="flex justify-between">
                  <span>Language Audio:</span>
                  <span className="text-white">{content.language || 'Original'}</span>
                </p>
                <p className="flex justify-between">
                  <span>HLS Adaptive Bitrate:</span>
                  <span className="text-emerald-400 font-mono">Active</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Titles Grid */}
        {similarItems.length > 0 && (
          <div className="pt-10 space-y-6 border-t border-white/5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Recommended Releases
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {similarItems.map((item) => (
                <ContentCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
