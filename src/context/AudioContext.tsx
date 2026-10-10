'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

export interface AudioTrack {
  _id: string;
  title: string;
  artist?: string;
  cast?: string[];
  thumbnailUrl: string;
  mediaUrl: string;
  duration?: string;
  industry?: string;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: AudioTrack[];
  currentIndex: number;
  playTrack: (track: AudioTrack, queueList?: AudioTrack[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  changeVolume: (vol: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.85;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      handleNextTrack();
    };

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playTrack = useCallback(
    (track: AudioTrack, queueList?: AudioTrack[]) => {
      if (!audioRef.current) return;

      const activeQueue = queueList && queueList.length > 0 ? queueList : [track];
      const index = activeQueue.findIndex((t) => t._id === track._id);

      setQueue(activeQueue);
      setCurrentIndex(index >= 0 ? index : 0);
      setCurrentTrack(track);

      audioRef.current.src = track.mediaUrl;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio auto-play prevented:', err);
        });
    },
    []
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) audioRef.current.play().catch(console.error);
  }, []);

  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (currentIndex + 1) % queue.length;
    const nextItem = queue[nextIdx];
    setCurrentIndex(nextIdx);
    setCurrentTrack(nextItem);
    if (audioRef.current) {
      audioRef.current.src = nextItem.mediaUrl;
      audioRef.current.play().catch(console.error);
    }
  }, [queue, currentIndex]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    const prevItem = queue[prevIdx];
    setCurrentIndex(prevIdx);
    setCurrentTrack(prevItem);
    if (audioRef.current) {
      audioRef.current.src = prevItem.mediaUrl;
      audioRef.current.play().catch(console.error);
    }
  }, [queue, currentIndex]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const changeVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted]);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        currentIndex,
        playTrack,
        togglePlay,
        pause,
        resume,
        nextTrack: handleNextTrack,
        prevTrack,
        seekTo,
        changeVolume,
        toggleMute,
        closePlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
