import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { dataStore } from '@/lib/dataStore';
import { contentSchema, episodeSchema } from '@/lib/validations';
import { applySecurityHeaders } from '@/lib/security';

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
    const isMongo = await connectToDatabase();

    if (isMongo) {
      const newContent = await Content.create({
        type: data.type,
        industry: data.industry,
        title: data.title,
        description: data.description,
        genre: data.genre,
        year: data.year,
        language: data.language,
        cast: data.cast,
        thumbnailUrl: data.thumbnailUrl,
        mediaUrl: data.mediaUrl,
        duration: data.duration,
        isPublished: data.isPublished,
        seasonsCount: data.seasonsCount,
        episodesCount: data.episodesCount,
        storageKey: data.storageKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        remixName: data.remixName,
        bpm: data.bpm,
        uploadedBy: auth.payload?.userId,
      });

      return applySecurityHeaders(
        NextResponse.json(
          { message: 'Content created successfully', content: newContent },
          { status: 201 }
        )
      );
    }

    const created = dataStore.createContent({
      type: data.type,
      industry: data.industry,
      title: data.title,
      description: data.description || '',
      genre: data.genre,
      year: data.year,
      language: data.language,
      cast: data.cast,
      thumbnailUrl: data.thumbnailUrl,
      mediaUrl: data.mediaUrl || '',
      duration: data.duration || '',
      isPublished: data.isPublished !== false,
      seasonsCount: data.seasonsCount || 1,
      episodesCount: data.episodesCount || 0,
      remixName: data.remixName,
      bpm: data.bpm,
    });
    (created as any).storageKey = data.storageKey;
    (created as any).fileSize = data.fileSize;
    (created as any).mimeType = data.mimeType;

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
