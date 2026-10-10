import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const contentSchema = z.object({
  type: z.enum(['movie', 'song', 'series'], {
    errorMap: () => ({ message: 'Type must be movie, song, or series' }),
  }),
  industry: z.enum(['bollywood', 'hollywood', 'bhojpuri', 'tollywood', 'srajen-dj'], {
    errorMap: () => ({
      message: 'Industry must be bollywood, hollywood, bhojpuri, tollywood, or srajen-dj',
    }),
  }),
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().optional().default(''),
  genre: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }),
  year: z.coerce.number().min(1900).max(2100).default(new Date().getFullYear()),
  language: z.string().default('Hindi'),
  cast: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }),
  thumbnailUrl: z.string().min(1, 'Thumbnail is required'),
  mediaUrl: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  isPublished: z.boolean().optional().default(true),
  seasonsCount: z.coerce.number().optional().default(1),
  episodesCount: z.coerce.number().optional().default(0),
  storageKey: z.string().optional().default(''),
  fileSize: z.coerce.number().optional().default(0),
  mimeType: z.string().optional().default(''),
  remixName: z.string().optional().default(''),
  bpm: z.union([z.number(), z.string()]).optional().transform((v) => {
    if (v === undefined || v === '' || v === null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }),
}).refine(
  (data) => {
    if (data.industry === 'srajen-dj') {
      return data.type === 'song';
    }
    return true;
  },
  {
    message: 'Srajen Dj category is only available for songs',
    path: ['industry'],
  }
);

export const episodeSchema = z.object({
  seriesId: z.string().min(1, 'Series ID is required'),
  season: z.coerce.number().min(1).default(1),
  episodeNumber: z.coerce.number().min(1).default(1),
  title: z.string().min(1, 'Episode title is required'),
  description: z.string().optional().default(''),
  mediaUrl: z.string().min(1, 'Media stream URL is required'),
  thumbnailUrl: z.string().min(1, 'Thumbnail URL is required'),
  duration: z.string().optional().default('45m'),
  storageKey: z.string().optional().default(''),
  fileSize: z.coerce.number().optional().default(0),
  mimeType: z.string().optional().default(''),
});
