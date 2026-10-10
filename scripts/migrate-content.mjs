// scripts/migrate-content.mjs
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// 1. Load .env
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {}

function normalizeIndustrySlug(industry) {
  if (!industry) return 'bollywood';
  return String(industry).trim().toLowerCase().replace(/\s+/g, '-');
}

async function runMigration() {
  console.log('=== Running Safe Content Migration Script ===\n');
  let migratedCount = 0;

  // 1. Migrate Persistent File / DataStore
  const storeFilePath = path.join(process.cwd(), 'storage', 'content-store.json');
  console.log(`Checking local persistence file: ${storeFilePath}`);

  let storeData = null;
  if (fs.existsSync(storeFilePath)) {
    try {
      storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse existing store file:', e.message);
    }
  }

  if (storeData && Array.isArray(storeData.content)) {
    console.log(`Found ${storeData.content.length} records in content-store.json.`);
    for (const item of storeData.content) {
      const oldInd = item.industry;
      item.industry = normalizeIndustrySlug(item.industry);

      if (item.isPublished === undefined || item.isPublished === null) {
        item.isPublished = true;
      }

      if (!item.duration) {
        item.duration = item.type === 'song' ? '3:45' : '2h 15m';
      }

      if (item.type === 'song' && item.industry === 'srajen-dj') {
        if (!item.genre || item.genre.length === 0 || (item.genre.length === 1 && item.genre[0].toLowerCase() === 'cinema')) {
          item.genre = ['Club VIP Mix', 'EDM', 'Bass Boosted'];
        }
        if (!item.bpm) {
          item.bpm = 128;
        }
        if (!item.remixName || item.remixName.trim() === '') {
          item.remixName = 'Original Mix';
        }
        if (!item.thumbnailUrl) {
          item.thumbnailUrl = 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=900&auto=format&fit=crop';
        }
      }

      if (item.type === 'song' && item.industry === 'bhojpuri') {
        if (!item.genre || item.genre.length === 0 || (item.genre.length === 1 && item.genre[0].toLowerCase() === 'cinema')) {
          item.genre = ['Bhojpuri Folk', 'Desi Beats'];
        }
        if (!item.thumbnailUrl) {
          item.thumbnailUrl = 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=900&auto=format&fit=crop';
        }
      }

      migratedCount++;
    }

    fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2), 'utf-8');
    console.log(`✅ Successfully updated ${migratedCount} local records in content-store.json.`);
  } else {
    console.log('No content-store.json exists yet. Will populate from current live store.');
  }

  // 2. Migrate MongoDB (if online)
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reelbeat';
  try {
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000, bufferCommands: false });
    console.log('✅ MongoDB connected. Checking collections...');

    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.some(c => c.name === 'contents')) {
      const contentsCollection = mongoose.connection.db.collection('contents');
      const docs = await contentsCollection.find({}).toArray();
      console.log(`Found ${docs.length} documents in MongoDB 'contents' collection.`);

      let mongoMigrated = 0;
      for (const doc of docs) {
        const updates = {};
        const normalizedInd = normalizeIndustrySlug(doc.industry);
        if (doc.industry !== normalizedInd) {
          updates.industry = normalizedInd;
        }
        if (doc.isPublished === undefined || doc.isPublished === null) {
          updates.isPublished = true;
        }
        if (!doc.duration) {
          updates.duration = doc.type === 'song' ? '3:45' : '2h 15m';
        }
        if (doc.type === 'song' && normalizedInd === 'srajen-dj') {
          if (!doc.genre || doc.genre.length === 0 || (doc.genre.length === 1 && doc.genre[0].toLowerCase() === 'cinema')) {
            updates.genre = ['Club VIP Mix', 'EDM', 'Bass Boosted'];
          }
          if (!doc.bpm) updates.bpm = 128;
          if (!doc.remixName || doc.remixName.trim() === '') updates.remixName = 'Original Mix';
          if (!doc.thumbnailUrl) {
            updates.thumbnailUrl = 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=900&auto=format&fit=crop';
          }
        }
        if (doc.type === 'song' && normalizedInd === 'bhojpuri') {
          if (!doc.genre || doc.genre.length === 0 || (doc.genre.length === 1 && doc.genre[0].toLowerCase() === 'cinema')) {
            updates.genre = ['Bhojpuri Folk', 'Desi Beats'];
          }
        }

        if (Object.keys(updates).length > 0) {
          await contentsCollection.updateOne({ _id: doc._id }, { $set: updates });
          mongoMigrated++;
        }
      }
      console.log(`✅ Successfully updated ${mongoMigrated} documents in MongoDB.`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.log(`ℹ️ MongoDB notice: ${err.message}. (Migration completed on store persistence).`);
  }

  console.log('\n=== Migration Complete ===');
}

runMigration().catch(console.error);
