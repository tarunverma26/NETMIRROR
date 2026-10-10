import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { initialContent, initialEpisodes } from './initialData';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reelbeat';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnected: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isConnected: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<boolean> {
  if (cached.conn && cached.isConnected) {
    return true;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Quick 2s timeout so requests don't hang if Mongo is offline
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async (m) => {
        cached.isConnected = true;
        console.log('✅ Connected to MongoDB successfully.');
        await seedDatabaseIfNeeded();
        return m;
      })
      .catch((err) => {
        console.warn(
          '⚠️ MongoDB connection unavailable or timed out. Operating in high-speed in-memory store mode:',
          err.message
        );
        cached.isConnected = false;
        cached.promise = null;
        return null as unknown as typeof mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return !!cached.conn && cached.isConnected;
  } catch {
    cached.isConnected = false;
    return false;
  }
}

async function seedDatabaseIfNeeded() {
  try {
    // 1. Seed or Upsert Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    if (adminEmail && adminPassword) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const existingAdmin = await User.findOne({ $or: [{ role: 'admin' }, { email: adminEmail }] });

      if (existingAdmin) {
        existingAdmin.name = process.env.ADMIN_NAME || 'Administrator';
        existingAdmin.email = adminEmail;
        existingAdmin.passwordHash = passwordHash;
        existingAdmin.role = 'admin';
        await existingAdmin.save();
      } else {
        await User.create({
          name: process.env.ADMIN_NAME || 'Administrator',
          email: adminEmail,
          passwordHash,
          role: 'admin',
        });
      }
    }

    // 2. Seed Content
    const contentCount = await Content.countDocuments();
    if (contentCount === 0) {
      console.log('🌱 Seeding initial movies, songs, and web series to MongoDB...');
      for (const item of initialContent) {
        await Content.create({
          type: item.type,
          industry: item.industry,
          title: item.title,
          description: item.description,
          genre: item.genre,
          year: item.year,
          language: item.language,
          cast: item.cast,
          thumbnailUrl: item.thumbnailUrl,
          mediaUrl: item.mediaUrl,
          duration: item.duration,
          isPublished: item.isPublished,
          rating: item.rating,
          views: item.views,
          seasonsCount: item.seasonsCount || 1,
          episodesCount: item.episodesCount || 0,
        });
      }
      console.log('✅ Seeded initial content successfully.');
    }

    // 3. Seed Episodes
    const episodeCount = await Episode.countDocuments();
    if (episodeCount === 0) {
      for (const ep of initialEpisodes) {
        await Episode.create({
          seriesId: ep.seriesId,
          season: ep.season,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          description: ep.description,
          mediaUrl: ep.mediaUrl,
          thumbnailUrl: ep.thumbnailUrl,
          duration: ep.duration,
        });
      }
      console.log('✅ Seeded initial episodes successfully.');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Database auto-seed notice:', message);
  }
}
