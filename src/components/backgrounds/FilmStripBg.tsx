'use client';

import React from 'react';

export default function FilmStripBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-background" />

      {/* Red Ambient Glow Spots */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      {/* Repeating Film Episode Sprocket Strip */}
      <div className="absolute inset-y-0 left-0 w-8 border-r border-white/5 opacity-20 flex flex-col justify-around py-4">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-4 h-3 mx-auto rounded-sm bg-primary/40 border border-primary/60" />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 w-8 border-l border-white/5 opacity-20 flex flex-col justify-around py-4">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-4 h-3 mx-auto rounded-sm bg-primary/40 border border-primary/60" />
        ))}
      </div>

      {/* Horizontal Episode Strip Ribbon */}
      <div className="absolute top-36 -left-10 -right-10 h-28 transform -rotate-2 opacity-15 overflow-hidden flex items-center space-x-6 border-y border-red-900/30">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-44 h-24 rounded border border-red-500/30 bg-surface-card flex items-center justify-center"
          >
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase">
              EP-0{i + 1} REEL
            </span>
          </div>
        ))}
      </div>

      {/* Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/90" />
    </div>
  );
}
