import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';

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
      // Build MongoDB query
      const query: Record<string, unknown> = { isPublished: true };

      if (type) query.type = type;
      if (industry) query.industry = industry;
      if (year) query.year = year;
      if (genre) query.genre = { $in: [new RegExp(genre, 'i')] };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cast: { $regex: search, $options: 'i' } },
          { genre: { $regex: search, $options: 'i' } },
          { remixName: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } },
        ];
      }

      let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === 'rating') sortOptions = { rating: -1 };
      if (sort === 'views') sortOptions = { views: -1 };
      if (sort === 'year') sortOptions = { year: -1 };

      const total = await Content.countDocuments(query);
      const items = await Content.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return applySecurityHeaders(
        NextResponse.json({
          items,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        })
      );
    }

    // High performance fallback data store
    const result = dataStore.getContentList({
      type,
      industry,
      search,
      genre,
      year,
      sort,
      page,
      limit,
      isPublished: true,
    });

    return applySecurityHeaders(NextResponse.json(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching content';
    return applySecurityHeaders(
      NextResponse.json({ error: message, items: [], total: 0 }, { status: 500 })
    );
  }
}
