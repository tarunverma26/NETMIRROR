import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';
import { STORAGE_PROVIDER } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const isMongo = await connectToDatabase();

    if (isMongo) {
      const [movies, songs, series, episodes, recentUploads, industryAgg, contentStorageAgg, epStorageAgg] =
        await Promise.all([
          Content.countDocuments({ type: 'movie' }),
          Content.countDocuments({ type: 'song' }),
          Content.countDocuments({ type: 'series' }),
          Episode.countDocuments(),
          Content.find().sort({ createdAt: -1 }).limit(6).lean(),
          Content.aggregate([
            { $group: { _id: '$industry', count: { $sum: 1 } } },
          ]),
          Content.aggregate([
            { $group: { _id: null, total: { $sum: { $ifNull: ['$fileSize', 0] } } } },
          ]),
          Episode.aggregate([
            { $group: { _id: null, total: { $sum: { $ifNull: ['$fileSize', 0] } } } },
          ]),
        ]);

      const totalContent = movies + songs + series;

      const byIndustry: Record<string, number> = {
        bollywood: 0,
        hollywood: 0,
        bhojpuri: 0,
        tollywood: 0,
      };
      for (const row of industryAgg) {
        if (row._id && byIndustry[row._id] !== undefined) {
          byIndustry[row._id] = row.count;
        }
      }

      const totalStorageBytes =
        (contentStorageAgg[0]?.total || 0) + (epStorageAgg[0]?.total || 0);

      const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      return applySecurityHeaders(
        NextResponse.json({
          stats: {
            movies,
            songs,
            series,
            episodes,
            totalContent,
            byType: { movie: movies, song: songs, series: series, episodes },
            byIndustry,
            totalStorageBytes,
            totalStorageFormatted: formatBytes(totalStorageBytes),
          },
          recentUploads,
          storageMode: 'MongoDB',
          storageProvider: STORAGE_PROVIDER,
        })
      );
    }

    const stats = dataStore.getStats();
    return applySecurityHeaders(
      NextResponse.json({
        stats: {
          movies: stats.movies,
          songs: stats.songs,
          series: stats.series,
          episodes: stats.episodes,
          totalContent: stats.totalContent,
          byType: stats.byType,
          byIndustry: stats.byIndustry,
          totalStorageBytes: stats.totalStorageBytes,
          totalStorageFormatted: stats.totalStorageFormatted,
        },
        recentUploads: stats.recentUploads,
        storageMode: 'High-Performance Store',
        storageProvider: STORAGE_PROVIDER,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching admin stats';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
