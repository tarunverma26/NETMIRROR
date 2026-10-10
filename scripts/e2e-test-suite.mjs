import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@reelbeat.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  console.error('❌ Please set ADMIN_PASSWORD in your .env before running this test.');
  process.exit(1);
}

console.log('====================================================');
console.log('🚀 REELBEAT PRODUCTION-READY E2E TEST SUITE');
console.log(`Target URL: ${BASE_URL}`);
console.log(`Admin User: ${ADMIN_EMAIL}`);
console.log('====================================================\n');

let adminCookie = '';
let userCookie = '';

async function test(name, fn) {
  process.stdout.write(`⏳ ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    throw err;
  }
}

async function runAll() {
  const storageRoot = path.resolve(process.cwd(), process.env.STORAGE_PATH || 'storage');

  // TEST 1: Health Endpoint
  await test('1. GET /api/health reports healthy local storage status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Status is ${data.status}`);
    if (data.storage.provider !== 'local') throw new Error(`Provider is ${data.storage.provider}`);
    if (!data.storage.accessible || !data.storage.writable) throw new Error('Storage is not accessible or writable');
  });

  // TEST 2: Security & Protection for Logged-Out Visitors
  await test('2. Logged-out visitor blocked from admin APIs (401/403)', async () => {
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`);
    if (statsRes.status !== 401 && statsRes.status !== 403) {
      throw new Error(`Expected 401 or 403 on /api/admin/stats, got ${statsRes.status}`);
    }

    const uploadRes = await fetch(`${BASE_URL}/api/admin/r2/create-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'hack.mp4', contentType: 'video/mp4', size: 100, type: 'movie', industry: 'bollywood' }),
    });
    if (uploadRes.status !== 401 && uploadRes.status !== 403) {
      throw new Error(`Expected 401 or 403 on upload init, got ${uploadRes.status}`);
    }
  });

  // TEST 3: Security & 403 Protection for Normal Users
  await test('3. Normal user (role: "user") cannot access admin APIs (403)', async () => {
    const testUserEmail = `viewer-${Date.now()}@test.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Regular Viewer', email: testUserEmail, password: 'User@Password123' }),
    });
    if (!regRes.ok) throw new Error(`Failed to register user: HTTP ${regRes.status}`);
    const regCookie = regRes.headers.get('set-cookie');

    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: regCookie || '' },
    });
    if (adminStatsRes.status !== 403) throw new Error(`Expected 403 for user on admin stats, got ${adminStatsRes.status}`);
  });

  // TEST 4: Admin Authentication
  await test('4. Admin login succeeds with admin session cookie', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!loginRes.ok) throw new Error(`Admin login failed: HTTP ${loginRes.status}`);
    const data = await loginRes.json();
    if (data.user?.role !== 'admin') throw new Error(`Role is ${data.user?.role}, expected admin`);
    adminCookie = loginRes.headers.get('set-cookie') || '';
    if (!adminCookie) throw new Error('No admin auth cookie returned');

    // Verify admin stats accessible
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, { headers: { Cookie: adminCookie } });
    if (!statsRes.ok) throw new Error(`Admin stats returned HTTP ${statsRes.status}`);
  });

  // TEST 5: Direct Upload of Thumbnail
  let thumbKey = '';
  let thumbUrl = '';
  await test('5. Upload thumbnail image file and verify disk presence', async () => {
    const createRes = await fetch(`${BASE_URL}/api/admin/r2/create-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        filename: 'e2e-poster.webp',
        contentType: 'image/webp',
        size: 512,
        type: 'thumbnail',
        industry: 'bollywood',
        isMultipart: false,
      }),
    });
    if (!createRes.ok) throw new Error(`create-upload failed: HTTP ${createRes.status}`);
    const session = await createRes.json();
    thumbKey = session.key;
    thumbUrl = session.publicUrl;

    const dummyThumbData = Buffer.from('RIFF....WEBPVP8 ...E2E TEST THUMBNAIL BYTES...');
    const putRes = await fetch(`${BASE_URL}${session.uploadUrl}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp', Cookie: adminCookie },
      body: dummyThumbData,
    });
    if (!putRes.ok) throw new Error(`Direct upload failed: HTTP ${putRes.status}`);

    const filePath = path.join(storageRoot, thumbKey);
    if (!fs.existsSync(filePath)) throw new Error(`Thumbnail file not found on disk at: ${filePath}`);
  });

  // TEST 6: Chunked Multipart Upload of Movie Video + HTTP Range Seeking
  let movieKey = '';
  let movieUrl = '';
  let movieId = '';
  await test('6. Chunked upload of Bollywood Movie + verify HTTP Range Seeking (206)', async () => {
    // 2 MB dummy video with MP4 signature
    const videoSize = 2 * 1024 * 1024;
    const dummyVideo = Buffer.alloc(videoSize);
    dummyVideo.write('ftypmp42', 4);

    // 1. Create upload session
    const createRes = await fetch(`${BASE_URL}/api/admin/r2/create-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        filename: 'e2e-action-movie.mp4',
        contentType: 'video/mp4',
        size: videoSize,
        type: 'movie',
        industry: 'bollywood',
        isMultipart: true,
      }),
    });
    if (!createRes.ok) throw new Error(`create-upload failed: HTTP ${createRes.status}`);
    const session = await createRes.json();
    movieKey = session.key;
    movieUrl = session.publicUrl;
    const uploadId = session.uploadId;

    // 2. Get Part URL
    const partRes = await fetch(`${BASE_URL}/api/admin/r2/get-part-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ key: movieKey, uploadId, parts: [1] }),
    });
    if (!partRes.ok) throw new Error(`get-part-urls failed: HTTP ${partRes.status}`);
    const { partUrls } = await partRes.json();
    const part1Url = partUrls[0].url || partUrls[0].uploadUrl;

    // 3. PUT Part 1
    const putPartRes = await fetch(`${BASE_URL}${part1Url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', Cookie: adminCookie },
      body: dummyVideo,
    });
    if (!putPartRes.ok) throw new Error(`Part upload failed: HTTP ${putPartRes.status}`);
    const etag = putPartRes.headers.get('etag') || 'part-1-etag';

    // 4. Complete upload
    const compRes = await fetch(`${BASE_URL}/api/admin/r2/complete-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ key: movieKey, uploadId, parts: [{ PartNumber: 1, ETag: etag }] }),
    });
    if (!compRes.ok) throw new Error(`complete-upload failed: HTTP ${compRes.status}`);

    // Verify on disk
    const filePath = path.join(storageRoot, movieKey);
    if (!fs.existsSync(filePath)) throw new Error(`Video file not found on disk at: ${filePath}`);
    const stat = fs.statSync(filePath);
    if (stat.size !== videoSize) throw new Error(`Expected size ${videoSize}, got ${stat.size}`);

    // 5. Test HTTP Range Request (seeking byte 0 - 1023)
    const rangeRes = await fetch(`${BASE_URL}${movieUrl}`, {
      headers: { Range: 'bytes=0-1023' },
    });
    if (rangeRes.status !== 206) throw new Error(`Expected HTTP 206 Partial Content, got ${rangeRes.status}`);
    if (rangeRes.headers.get('content-range') !== `bytes 0-1023/${videoSize}`) {
      throw new Error(`Content-Range header mismatch: ${rangeRes.headers.get('content-range')}`);
    }
    if (rangeRes.headers.get('accept-ranges') !== 'bytes') {
      throw new Error('Accept-Ranges header missing');
    }

    // 6. Test Seeking to middle (byte 1024 - 2047)
    const midRangeRes = await fetch(`${BASE_URL}${movieUrl}`, {
      headers: { Range: 'bytes=1024-2047' },
    });
    if (midRangeRes.status !== 206) throw new Error(`Seeking range failed: HTTP ${midRangeRes.status}`);

    // 7. Save Movie record to catalog
    const saveRes = await fetch(`${BASE_URL}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        type: 'movie',
        industry: 'bollywood',
        title: 'E2E Bollywood Blockbuster',
        description: 'Automated test movie for local streaming verification',
        genre: ['Action', 'Thriller'],
        year: 2026,
        language: 'Hindi',
        cast: ['Tester Actor'],
        thumbnailUrl: thumbUrl,
        mediaUrl: movieUrl,
        duration: '2h 15m',
        isPublished: true,
        storageKey: movieKey,
        fileSize: videoSize,
        mimeType: 'video/mp4',
      }),
    });
    if (!saveRes.ok) throw new Error(`Saving movie content failed: HTTP ${saveRes.status}`);
    const saved = await saveRes.json();
    movieId = saved.content._id;

    // 8. Confirm appears in public Bollywood catalog
    const publicCatRes = await fetch(`${BASE_URL}/api/content?type=movie&industry=bollywood`);
    const publicCat = await publicCatRes.json();
    const found = (publicCat.items || []).find((c) => c._id === movieId);
    if (!found) throw new Error('Movie not found in public Bollywood catalog');
  });

  // TEST 7: Song Upload in Hollywood Industry
  let songKey = '';
  let songId = '';
  await test('7. Upload Song in Hollywood + verify in Hollywood songs section', async () => {
    const audioSize = 100 * 1024;
    const dummyAudio = Buffer.alloc(audioSize);

    const createRes = await fetch(`${BASE_URL}/api/admin/r2/create-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        filename: 'e2e-hollywood-beat.mp3',
        contentType: 'audio/mpeg',
        size: audioSize,
        type: 'song',
        industry: 'hollywood',
        isMultipart: false,
      }),
    });
    if (!createRes.ok) throw new Error(`create-upload failed: HTTP ${createRes.status}`);
    const session = await createRes.json();
    songKey = session.key;

    const putRes = await fetch(`${BASE_URL}${session.uploadUrl}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/mpeg', Cookie: adminCookie },
      body: dummyAudio,
    });
    if (!putRes.ok) throw new Error(`Upload song failed: HTTP ${putRes.status}`);

    const saveRes = await fetch(`${BASE_URL}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        type: 'song',
        industry: 'hollywood',
        title: 'E2E Hollywood Melody',
        description: 'Automated test song',
        genre: ['Pop'],
        year: 2026,
        language: 'English',
        cast: ['E2E Singer'],
        thumbnailUrl: thumbUrl,
        mediaUrl: session.publicUrl,
        duration: '3:45',
        isPublished: true,
        storageKey: songKey,
        fileSize: audioSize,
        mimeType: 'audio/mpeg',
      }),
    });
    if (!saveRes.ok) throw new Error(`Save song failed: HTTP ${saveRes.status}`);
    const saved = await saveRes.json();
    songId = saved.content._id;

    // Check Hollywood song catalog
    const songCatRes = await fetch(`${BASE_URL}/api/content?type=song&industry=hollywood`);
    const songCat = await songCatRes.json();
    const found = (songCat.items || []).find((c) => c._id === songId);
    if (!found) throw new Error('Song not found in public Hollywood catalog');
  });

  // TEST 8: Web Series & Episode Upload in Tollywood
  let seriesId = '';
  let episodeKey = '';
  await test('8. Upload Web Series Episode in Tollywood + verify in series catalog', async () => {
    // 1. Create series
    const seriesRes = await fetch(`${BASE_URL}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        type: 'series',
        industry: 'tollywood',
        title: 'E2E Tollywood Chronicles',
        description: 'Automated test series',
        genre: ['Drama'],
        year: 2026,
        language: 'Telugu',
        cast: ['Tollywood Hero'],
        thumbnailUrl: thumbUrl,
        mediaUrl: '',
        duration: '1 Season',
        isPublished: true,
      }),
    });
    if (!seriesRes.ok) throw new Error(`Series creation failed: HTTP ${seriesRes.status}`);
    const seriesData = await seriesRes.json();
    seriesId = seriesData.content._id;

    // 2. Upload Episode video
    const epSize = 50 * 1024;
    const dummyEp = Buffer.alloc(epSize);
    const createEpRes = await fetch(`${BASE_URL}/api/admin/r2/create-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        filename: 'e2e-tollywood-ep1.mp4',
        contentType: 'video/mp4',
        size: epSize,
        type: 'series',
        industry: 'tollywood',
        isMultipart: false,
      }),
    });
    const epSession = await createEpRes.json();
    episodeKey = epSession.key;

    await fetch(`${BASE_URL}${epSession.uploadUrl}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', Cookie: adminCookie },
      body: dummyEp,
    });

    // 3. Create Episode Record
    const epSaveRes = await fetch(`${BASE_URL}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        type: 'series',
        isEpisode: true,
        seriesId,
        season: 1,
        episodeNumber: 1,
        title: 'Episode 1: The Beginning',
        mediaUrl: epSession.publicUrl,
        thumbnailUrl: thumbUrl,
        duration: '42m',
        storageKey: episodeKey,
        fileSize: epSize,
        mimeType: 'video/mp4',
      }),
    });
    if (!epSaveRes.ok) throw new Error(`Episode save failed: HTTP ${epSaveRes.status}`);

    // Verify series appears in Tollywood series list
    const seriesCatRes = await fetch(`${BASE_URL}/api/content?type=series&industry=tollywood`);
    const seriesCat = await seriesCatRes.json();
    const foundSeries = (seriesCat.items || []).find((s) => s._id === seriesId);
    if (!foundSeries) throw new Error('Series not found in Tollywood catalog');
  });

  // TEST 9: Edit, Unpublish, and Delete with Complete Disk File Removal
  await test('9. Edit metadata, toggle unpublish, and delete (files removed from disk)', async () => {
    // 1. Edit details
    const editRes = await fetch(`${BASE_URL}/api/admin/content/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ title: 'E2E Bollywood Blockbuster (Director Cut)', year: 2027 }),
    });
    if (!editRes.ok) throw new Error(`Edit failed: HTTP ${editRes.status}`);

    // 2. Unpublish
    const unpubRes = await fetch(`${BASE_URL}/api/admin/content/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isPublished: false }),
    });
    if (!unpubRes.ok) throw new Error(`Unpublish failed: HTTP ${unpubRes.status}`);

    // Verify hidden from public catalog
    const pubRes = await fetch(`${BASE_URL}/api/content?type=movie&industry=bollywood`);
    const pubData = await pubRes.json();
    const stillPublic = (pubData.items || []).some((c) => c._id === movieId);
    if (stillPublic) throw new Error('Unpublished item still visible in public catalog');

    // 3. Delete Movie & Episode & Song
    const movieFilePath = path.join(storageRoot, movieKey);
    if (!fs.existsSync(movieFilePath)) throw new Error('Movie file should exist on disk before delete');

    const delRes = await fetch(`${BASE_URL}/api/admin/content/${movieId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    if (!delRes.ok) throw new Error(`Delete failed: HTTP ${delRes.status}`);

    // VERIFY FILE IS DELETED FROM DISK!
    if (fs.existsSync(movieFilePath)) {
      throw new Error(`CRITICAL: Movie file was NOT removed from disk at ${movieFilePath}`);
    }

    // Clean up Song
    const songFilePath = path.join(storageRoot, songKey);
    await fetch(`${BASE_URL}/api/admin/content/${songId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    if (fs.existsSync(songFilePath)) {
      throw new Error(`CRITICAL: Song file was NOT removed from disk at ${songFilePath}`);
    }

    // Clean up Series and its episode
    const epFilePath = path.join(storageRoot, episodeKey);
    await fetch(`${BASE_URL}/api/admin/content/${seriesId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    if (fs.existsSync(epFilePath)) {
      throw new Error(`CRITICAL: Episode file was NOT removed from disk at ${epFilePath}`);
    }

    // Clean up thumbnail
    const thumbFilePath = path.join(storageRoot, thumbKey);
    if (fs.existsSync(thumbFilePath)) {
      fs.unlinkSync(thumbFilePath);
    }
  });

  console.log('\n====================================================');
  console.log('🏆 ALL E2E VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runAll().catch((err) => {
  console.error('\nE2E Suite Terminated with Errors.');
  process.exit(1);
});
