'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  X,
  Music,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function StickyAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    changeVolume,
    toggleMute,
    closePlayer,
  } = useAudio();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVolume(parseFloat(e.target.value));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Minimized Pill */}
      {isMinimized ? (
        <div className="max-w-md mx-auto mb-3 px-4">
          <div className="bg-surface-card/95 backdrop-blur-xl border border-primary/40 rounded-full px-4 py-2.5 flex items-center justify-between shadow-red-glow">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 animate-spin-slow">
                <Image
                  src={currentTrack.thumbnailUrl}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {currentTrack.artist || currentTrack.industry}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-2">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 text-gray-400 hover:text-white"
                aria-label="Expand player"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Full Bottom Audio Bar */
        <div className="bg-surface/95 backdrop-blur-2xl border-t border-primary/30 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] px-4 py-2.5 sm:py-3">
          {/* Scrubber Progress Bar */}
          <div className="relative w-full mb-2 group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Audio scrubber"
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-1.5 transition-all"
            />
            {/* Red Glow Fill Indicator */}
            <div
              className="absolute left-0 top-0 h-1 group-hover:h-1.5 bg-primary rounded-lg pointer-events-none shadow-red-glow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Track Information */}
            <div className="flex items-center space-x-3 min-w-0 w-1/4">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 shadow-md">
                <Image
                  src={currentTrack.thumbnailUrl}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="truncate hidden xs:block">
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-[11px] text-gray-400 truncate">
                  {currentTrack.artist || `${currentTrack.industry} Track`}
                </p>
              </div>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-md">
              <div className="flex items-center space-x-4 sm:space-x-6">
                <button
                  onClick={prevTrack}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-red-glow hover:scale-105 transition-all"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 fill-current" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Timestamp Indicator */}
              <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Volume & Collapse Controls */}
            <div className="flex items-center justify-end space-x-3 w-1/4">
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  aria-label="Volume slider"
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-gray-400 hover:text-white"
                title="Minimize player"
                aria-label="Minimize player"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={closePlayer}
                className="p-1.5 text-gray-400 hover:text-red-400"
                title="Close player"
                aria-label="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
