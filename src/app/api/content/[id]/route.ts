import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const isMongo = await connectToDatabase();

    let contentItem = null;
    let episodes: unknown[] = [];
    let similarItems: unknown[] = [];

    if (isMongo) {
      contentItem = await Content.findById(id).lean();

      if (contentItem) {
        if (contentItem.type === 'series') {
          episodes = await Episode.find({ seriesId: id })
            .sort({ season: 1, episodeNumber: 1 })
            .lean();
        }

        // Fetch up to 6 similar items
        similarItems = await Content.find({
          _id: { $ne: contentItem._id },
          $or: [
            { industry: contentItem.industry },
            { genre: { $in: contentItem.genre } },
          ],
          type: contentItem.type,
          isPublished: true,
        })
          .limit(6)
          .lean();
      }
    } else {
      contentItem = dataStore.getContentById(id);
      if (contentItem) {
        if (contentItem.type === 'series') {
          episodes = dataStore.getEpisodesBySeriesId(id);
        }

        const list = dataStore.getContentList({
          type: contentItem.type,
          industry: contentItem.industry,
          limit: 7,
          isPublished: true,
        });
        similarItems = list.items.filter((item) => item._id !== id).slice(0, 6);
      }
    }

    if (!contentItem) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Content item not found' }, { status: 404 })
      );
    }

    return applySecurityHeaders(
      NextResponse.json({
        content: contentItem,
        episodes,
        similarItems,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching content item';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
