import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { dataStore, normalizeIndustrySlug } from '@/lib/dataStore';
import { contentSchema, episodeSchema } from '@/lib/validations';
import { applySecurityHeaders } from '@/lib/security';

export const dynamic = 'force-dynamic';

export function revalidateContentPaths(type?: string, industry?: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/songs');
    revalidatePath('/songs/srajen-dj');
    revalidatePath('/movies');
    revalidatePath('/series');
    if (industry) {
      const slug = normalizeIndustrySlug(industry);
      revalidatePath(`/songs/${slug}`);
      revalidatePath(`/movies/${slug}`);
      revalidatePath(`/series/${slug}`);
    }
    revalidatePath('/admin');
    revalidatePath('/admin/manage');
  } catch (err) {
    console.warn('revalidatePath notice:', err);
  }
}

// GET /api/admin/content: retrieve all content for admin management (includes unpublished)
export async function GET(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const search = searchParams.get('search') || undefined;

    const isMongo = await connectToDatabase();

    if (isMongo) {
      const query: Record<string, unknown> = {};
      if (type) query.type = type;
      if (industry) query.industry = industry;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { cast: { $regex: search, $options: 'i' } },
        ];
      }

      const items = await Content.find(query).sort({ createdAt: -1 }).lean();
      return applySecurityHeaders(
        NextResponse.json({ items, total: items.length })
      );
    }

    const result = dataStore.getContentList({
      type,
      industry,
      search,
      limit: 200,
    });

    return applySecurityHeaders(
      NextResponse.json({ items: result.items, total: result.total })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving admin content';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}

// POST /api/admin/content: upload new movie, song, series, or episode
export async function POST(req: NextRequest) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();

    // Check if uploading a web series episode
    if (body.isEpisode || body.seriesId) {
      const epParsed = episodeSchema.safeParse(body);
      if (!epParsed.success) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: epParsed.error.errors[0]?.message || 'Episode validation error' },
            { status: 400 }
          )
        );
      }

      const epData = epParsed.data;
      const isMongo = await connectToDatabase();

      if (isMongo) {
        const newEpisode = await Episode.create({
          seriesId: epData.seriesId,
          season: epData.season,
          episodeNumber: epData.episodeNumber,
          title: epData.title,
          description: epData.description || '',
          mediaUrl: epData.mediaUrl,
          thumbnailUrl: epData.thumbnailUrl,
          duration: epData.duration || '45m',
          storageKey: epData.storageKey || '',
          fileSize: epData.fileSize || 0,
          mimeType: epData.mimeType || '',
        });

        // Increment series episode count
        await Content.findByIdAndUpdate(epData.seriesId, {
          $inc: { episodesCount: 1 },
          $max: { seasonsCount: epData.season },
        });

        return applySecurityHeaders(
          NextResponse.json(
            { message: 'Episode created successfully', episode: newEpisode },
            { status: 201 }
          )
        );
      }

      const newEpisode = dataStore.createEpisode({
        seriesId: epData.seriesId,
        season: epData.season,
        episodeNumber: epData.episodeNumber,
        title: epData.title,
        description: epData.description || '',
        mediaUrl: epData.mediaUrl,
        thumbnailUrl: epData.thumbnailUrl,
        duration: epData.duration || '45m',
      });

      return applySecurityHeaders(
        NextResponse.json(
          { message: 'Episode created successfully', episode: newEpisode },
          { status: 201 }
        )
      );
    }

    // Standard content (Movie, Song, Series)
    if (typeof body.industry === 'string') {
      body.industry = normalizeIndustrySlug(body.industry);
    }
    if (typeof body.type === 'string') {
      body.type = body.type.trim().toLowerCase();
    }

    const parsed = contentSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: parsed.error.errors[0]?.message || 'Validation error' },
          { status: 400 }
        )
      );
    }

    const data = parsed.data;
    const normIndustry = normalizeIndustrySlug(data.industry);

    // Sensible defaults
    let resolvedGenre = data.genre && data.genre.length > 0 ? data.genre : [];
    if (resolvedGenre.length === 0 || (resolvedGenre.length === 1 && resolvedGenre[0].toLowerCase() === 'cinema' && data.type === 'song')) {
      if (normIndustry === 'srajen-dj') {
        resolvedGenre = ['Club VIP Mix', 'EDM', 'Bass Boosted'];
      } else if (data.type === 'song') {
        resolvedGenre = ['Soundtrack', 'Music'];
      } else {
        resolvedGenre = ['Cinema', 'Drama'];
      }
    }

    const fallbackThumb =
      normIndustry === 'srajen-dj'
        ? 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=900&auto=format&fit=crop'
        : data.type === 'song'
        ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900&auto=format&fit=crop'
        : data.type === 'series'
        ? 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=900&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop';

    const resolvedThumbnail = data.thumbnailUrl || fallbackThumb;
    const resolvedDuration = data.duration || (data.type === 'song' ? '3:45' : data.type === 'movie' ? '2h 15m' : '45m');
    const resolvedBpm = data.type === 'song' && normIndustry === 'srajen-dj' ? (data.bpm || 128) : data.bpm;
    const resolvedRemix = data.type === 'song' && normIndustry === 'srajen-dj' ? (data.remixName || 'Original Mix') : data.remixName;

    const isMongo = await connectToDatabase();

    if (isMongo) {
      const newContent = await Content.create({
        type: data.type,
        industry: normIndustry,
        title: data.title,
        description: data.description || '',
        genre: resolvedGenre,
        year: data.year,
        language: data.language || 'Hindi',
        cast: data.cast || [],
        thumbnailUrl: resolvedThumbnail,
        mediaUrl: data.mediaUrl,
        duration: resolvedDuration,
        isPublished: data.isPublished !== false,
        seasonsCount: data.seasonsCount,
        episodesCount: data.episodesCount,
        storageKey: data.storageKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        remixName: resolvedRemix,
        bpm: resolvedBpm,
        uploadedBy: auth.payload?.userId,
      });

      revalidateContentPaths(data.type, normIndustry);

      return applySecurityHeaders(
        NextResponse.json(
          { message: 'Content created successfully', content: newContent },
          { status: 201 }
        )
      );
    }

    const created = dataStore.createContent({
      type: data.type,
      industry: normIndustry as any,
      title: data.title,
      description: data.description || '',
      genre: resolvedGenre,
      year: data.year,
      language: data.language || 'Hindi',
      cast: data.cast || [],
      thumbnailUrl: resolvedThumbnail,
      mediaUrl: data.mediaUrl || '',
      duration: resolvedDuration,
      isPublished: data.isPublished !== false,
      seasonsCount: data.seasonsCount || 1,
      episodesCount: data.episodesCount || 0,
      remixName: resolvedRemix,
      bpm: resolvedBpm,
    });
    (created as any).storageKey = data.storageKey;
    (created as any).fileSize = data.fileSize;
    (created as any).mimeType = data.mimeType;

    revalidateContentPaths(data.type, normIndustry);

    return applySecurityHeaders(
      NextResponse.json(
        { message: 'Content created successfully', content: created },
        { status: 201 }
      )
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating content';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
