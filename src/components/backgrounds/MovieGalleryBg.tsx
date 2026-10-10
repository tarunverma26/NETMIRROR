'use client';

import React from 'react';

const posterUrls = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
];

export default function MovieGalleryBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Drifting poster gallery wall */}
      <div className="absolute -inset-10 opacity-15 filter blur-[2px] grayscale-[40%]">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 transform -rotate-3 scale-110 animate-pulse-slow">
          {posterUrls.map((url, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-lg bg-cover bg-center shadow-2xl border border-white/5 transform hover:scale-105 transition-transform"
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
          {posterUrls.slice(0, 6).map((url, i) => (
            <div
              key={`rep-${i}`}
              className="aspect-[2/3] rounded-lg bg-cover bg-center shadow-2xl border border-white/5"
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
        </div>
      </div>

      {/* Red vignette gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.08)_0%,transparent_70%)]" />

      {/* Film grain effect overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
