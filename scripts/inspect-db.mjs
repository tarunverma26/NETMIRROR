import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load .env
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

async function inspect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reelbeat';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB successfully.');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`Collection ${c.name}: ${count} documents`);
    }

    if (collections.some(c => c.name === 'contents')) {
      const items = await mongoose.connection.db.collection('contents').find({}).toArray();
      console.log('\n--- MongoDB Contents List ---');
      items.forEach(i => {
        console.log({
          id: i._id,
          title: i.title,
          type: i.type,
          industry: i.industry,
          isPublished: i.isPublished,
          genres: i.genres || i.genre,
          bpm: i.bpm,
          remixName: i.remixName,
          duration: i.duration,
          mediaUrl: i.mediaUrl ? (i.mediaUrl.length > 30 ? i.mediaUrl.substring(0, 30) + '...' : i.mediaUrl) : i.videoKey,
          thumbnailUrl: i.thumbnailUrl ? (i.thumbnailUrl.length > 30 ? i.thumbnailUrl.substring(0, 30) + '...' : i.thumbnailUrl) : i.thumbnailKey,
          createdAt: i.createdAt
        });
      });
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

inspect();
