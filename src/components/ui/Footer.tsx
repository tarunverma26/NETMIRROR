import React from 'react';
import Link from 'next/link';
import { Film, Music, Tv, Shield } from 'lucide-react';

export default function Footer() {
  const industries = ['Bollywood', 'Hollywood', 'Bhojpuri', 'Tollywood'];

  return (
    <footer className="relative border-t border-white/5 bg-cinema-black text-gray-400 text-sm z-10 pt-16 pb-24 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-black text-base shadow-red-glow">
                R
              </div>
              <span className="font-extrabold text-xl text-white tracking-wider">
                REEL<span className="text-primary">BEAT</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              The premier cinematic streaming destination uniting Bollywood, Hollywood,
              Bhojpuri, and Tollywood cinema, web series, and music. Powered by modern 3D
              technology and lossless audio.
            </p>
            <div className="pt-2 flex items-center space-x-3 text-xs text-gray-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>STREAMING ONLINE &bull; 60FPS</span>
            </div>
          </div>

          {/* Movies Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Film className="w-3.5 h-3.5 text-primary" />
              <span>Movies</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {industries.map((ind) => (
                <li key={`mov-${ind}`}>
                  <Link
                    href={`/movies/${ind.toLowerCase()}`}
                    className="hover:text-white transition-colors"
                  >
                    {ind} Movies
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Songs Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Music className="w-3.5 h-3.5 text-primary" />
              <span>Songs</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {industries.map((ind) => (
                <li key={`sng-${ind}`}>
                  <Link
                    href={`/songs/${ind.toLowerCase()}`}
                    className="hover:text-white transition-colors"
                  >
                    {ind} Tracks
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Series & Admin */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Tv className="w-3.5 h-3.5 text-primary" />
              <span>Web Series</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {industries.map((ind) => (
                <li key={`ser-${ind}`}>
                  <Link
                    href={`/series/${ind.toLowerCase()}`}
                    className="hover:text-white transition-colors"
                  >
                    {ind} Series
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center space-x-1 text-primary hover:text-red-400 font-mono text-[11px]"
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin Gateway</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} REELBEAT Media Streaming. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Cloudinary CDN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
