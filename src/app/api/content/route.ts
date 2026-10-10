import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import { dataStore, normalizeIndustrySlug } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const search = searchParams.get('search') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const sort = searchParams.get('sort') || 'latest';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 24));

    const isMongo = await connectToDatabase();

    if (isMongo) {
      // Build MongoDB query: tolerant of explicit true or missing isPublished
      const query: Record<string, unknown> = { isPublished: { $ne: false } };

      if (type) {
        query.type = { $regex: new RegExp(`^${type.trim()}$`, 'i') };
      }

      if (industry) {
        const slug = normalizeIndustrySlug(industry);
        const pattern = `^${slug.replace(/-/g, '[- ]?')}$`;
        query.industry = { $regex: new RegExp(pattern, 'i') };
      }

      if (year) query.year = year;
      if (genre) query.genre = { $in: [new RegExp(genre.trim(), 'i')] };

      if (search) {
        const searchRegex = { $regex: search.trim(), $options: 'i' };
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { cast: searchRegex },
          { genre: searchRegex },
          { remixName: searchRegex },
          { industry: searchRegex },
        ];
      }

      let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === 'rating') sortOptions = { rating: -1 };
      if (sort === 'views') sortOptions = { views: -1 };
      if (sort === 'bpm') sortOptions = { bpm: -1 };
      if (sort === 'year') sortOptions = { year: -1 };

      const total = await Content.countDocuments(query);
      const items = await Content.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const response = NextResponse.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });

      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return applySecurityHeaders(response);
    }

    // High performance fallback data store
    const result = dataStore.getContentList({
      type,
      industry: industry ? normalizeIndustrySlug(industry) : undefined,
      search,
      genre,
      year,
      sort,
      page,
      limit,
      isPublished: true,
    });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return applySecurityHeaders(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching content';
    return applySecurityHeaders(
      NextResponse.json({ error: message, items: [], total: 0 }, { status: 500 })
    );
  }
}
