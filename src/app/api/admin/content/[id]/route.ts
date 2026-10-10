import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import Episode from '@/models/Episode';
import { dataStore } from '@/lib/dataStore';
import { applySecurityHeaders } from '@/lib/security';
import { deleteStorageFile } from '@/lib/storage';

import { revalidateContentPaths } from '../route';
import { normalizeIndustrySlug } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id } = params;
    const body = await req.json();
    if (body.industry) {
      body.industry = normalizeIndustrySlug(body.industry);
    }
    const isMongo = await connectToDatabase();

    if (isMongo && mongoose.isValidObjectId(id)) {
      const updated = await Content.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Content not found' }, { status: 404 })
        );
      }

      revalidateContentPaths(updated.type, updated.industry);

      return applySecurityHeaders(
        NextResponse.json({ message: 'Content updated successfully', content: updated })
      );
    }

    const updated = dataStore.updateContent(id, body);
    if (!updated) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Content not found' }, { status: 404 })
      );
    }

    revalidateContentPaths(updated.type, updated.industry);

    return applySecurityHeaders(
      NextResponse.json({ message: 'Content updated successfully', content: updated })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating content';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}

function extractKeyFromUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('/api/media/')) {
    return decodeURIComponent(url.replace('/api/media/', ''));
  }
  return null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAdminSession(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id } = params;
    const isMongo = await connectToDatabase();

    if (isMongo && mongoose.isValidObjectId(id)) {
      const itemToDelete = await Content.findById(id);
      if (!itemToDelete) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Content not found' }, { status: 404 })
        );
      }

      // Delete main media file from storage only if not shared by other records
      const isMediaShared = itemToDelete.mediaUrl
        ? (await Content.countDocuments({ _id: { $ne: id }, mediaUrl: itemToDelete.mediaUrl })) > 0
        : false;
      if (!isMediaShared) {
        if (itemToDelete.storageKey) {
          await deleteStorageFile(itemToDelete.storageKey);
        } else {
          const urlKey = extractKeyFromUrl(itemToDelete.mediaUrl);
          if (urlKey) await deleteStorageFile(urlKey);
        }
      }

      // Delete thumbnail if it was uploaded to storage
      const thumbKey = extractKeyFromUrl(itemToDelete.thumbnailUrl);
      if (thumbKey) {
        await deleteStorageFile(thumbKey);
      }

      // If series, delete all episode files from storage as well
      const seriesEpisodes = await Episode.find({ seriesId: id });
      for (const ep of seriesEpisodes) {
        if (ep.storageKey) {
          await deleteStorageFile(ep.storageKey);
        } else {
          const epUrlKey = extractKeyFromUrl(ep.mediaUrl);
          if (epUrlKey) await deleteStorageFile(epUrlKey);
        }
      }

      await Content.findByIdAndDelete(id);
      await Episode.deleteMany({ seriesId: id });

      revalidateContentPaths(itemToDelete.type, itemToDelete.industry);

      return applySecurityHeaders(
        NextResponse.json({ message: 'Content and associated storage files deleted successfully' })
      );
    }

    const item = dataStore.getContentById(id);
    if (!item) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Content not found' }, { status: 404 })
      );
    }

    // Delete from storage only if not shared by other records
    const allStoreItems = dataStore.getContentList({ limit: 1000 }).items;
    const isShared = item.mediaUrl
      ? allStoreItems.some((c) => c._id !== id && c.mediaUrl === item.mediaUrl)
      : false;

    if (!isShared) {
      if ((item as any).storageKey) {
        await deleteStorageFile((item as any).storageKey);
      } else {
        const urlKey = extractKeyFromUrl(item.mediaUrl);
        if (urlKey) await deleteStorageFile(urlKey);
      }
    }

    const thumbKey = extractKeyFromUrl(item.thumbnailUrl);
    if (thumbKey) {
      await deleteStorageFile(thumbKey);
    }

    const episodes = dataStore.getEpisodesBySeriesId(id);
    for (const ep of episodes) {
      if ((ep as any).storageKey) {
        await deleteStorageFile((ep as any).storageKey);
      } else {
        const epUrlKey = extractKeyFromUrl(ep.mediaUrl);
        if (epUrlKey) await deleteStorageFile(epUrlKey);
      }
    }

    const deletedType = item.type;
    const deletedIndustry = item.industry;
    dataStore.deleteContent(id);

    revalidateContentPaths(deletedType, deletedIndustry);

    return applySecurityHeaders(
      NextResponse.json({ message: 'Content and associated storage files deleted successfully' })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting content';
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
}
