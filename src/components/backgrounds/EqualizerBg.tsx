'use client';

import React from 'react';

export default function EqualizerBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark Ambient Gradients */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.15)_0%,transparent_60%)]" />

      {/* Slowly Spinning Vinyl Record in background */}
      <div className="absolute -right-24 -top-24 sm:right-10 sm:top-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-white/5 bg-neutral-950 shadow-[0_0_80px_rgba(229,9,20,0.2)] opacity-35 animate-spin-slow">
        {/* Grooves */}
        <div className="absolute inset-4 rounded-full border border-white/5" />
        <div className="absolute inset-10 rounded-full border border-white/5" />
        <div className="absolute inset-16 rounded-full border border-white/5" />
        <div className="absolute inset-24 rounded-full border border-white/5" />
        {/* Red Center Label */}
        <div className="absolute inset-32 rounded-full bg-gradient-to-tr from-primary-muted to-primary border-4 border-black flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-black border border-white/20" />
        </div>
      </div>

      {/* Animated Red Audio Equalizer Bars at bottom */}
      <div className="absolute bottom-24 left-0 right-0 h-40 flex items-end justify-between px-4 sm:px-12 opacity-25 gap-1 sm:gap-2">
        {Array.from({ length: 48 }).map((_, i) => {
          // Dynamic varying delays and durations
          const dur = 1.2 + (i % 7) * 0.2;
          const delay = (i % 9) * 0.15;
          return (
            <div
              key={i}
              className="flex-1 max-w-[8px] bg-gradient-to-t from-primary/20 via-primary to-primary-light rounded-t-sm"
              style={{
                height: `${20 + ((i * 17) % 75)}%`,
                animation: `bounceHeight ${dur}s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          );
        })}
      </div>

      {/* Vignette Blur Mask */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background pointer-events-none" />

      <style jsx>{`
        @keyframes bounceHeight {
          0% {
            height: 12%;
            opacity: 0.3;
          }
          50% {
            height: 85%;
            opacity: 0.9;
          }
          100% {
            height: 35%;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
