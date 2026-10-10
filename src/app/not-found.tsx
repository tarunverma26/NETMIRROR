import React from 'react';
import Link from 'next/link';
import { Film, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.1)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-md space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-surface-card border border-primary/30 flex items-center justify-center text-primary shadow-red-glow">
          <Film className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-primary">
            Error 404 &bull; Reel Interrupted
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            FRAME NOT FOUND
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            The film reel or soundtrack you were seeking appears to have left the
            projector room. Let&apos;s get you back to the main stage.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-red-glow flex items-center space-x-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/movies"
            className="px-6 py-2.5 rounded-xl bg-surface-card border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-medium transition-all"
          >
            <span>Explore Movies</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
