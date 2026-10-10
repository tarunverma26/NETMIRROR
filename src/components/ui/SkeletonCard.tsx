import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface-card border border-white/5 animate-pulse flex flex-col h-full">
      <div className="aspect-[16/10] sm:aspect-[3/4] w-full bg-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-950/20 to-transparent animate-shimmer" />
      </div>
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-4 bg-white/10 rounded w-4/5" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-4 w-12 bg-white/5 rounded" />
          <div className="h-4 w-12 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
