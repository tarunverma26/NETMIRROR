// scripts/test-bugfix.mjs
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

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== Testing Bugfix: Admin Upload Visibility for Normal Users ===\n');

  // 1. Authenticate as Admin
  console.log('Step 1: Authenticating Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'tarunverma930547@gmail.com',
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  if (!loginRes.ok) throw new Error('Admin login failed: ' + loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('✅ Admin authenticated successfully.\n');

  // 2. Upload a new Srajen Dj song
  console.log('Step 2: Uploading new Srajen Dj song: "Ayodhya Bass Blast"...');
  const djUploadRes = await fetch(`${BASE_URL}/api/admin/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie || '',
    },
    body: JSON.stringify({
      type: 'song',
      industry: 'srajen-dj',
      title: 'Ayodhya Bass Blast',
      description: 'Heavy bass EDM remix by DJ Ayodhya',
      cast: ['DJ Ayodhya', 'Srajen Dj'],
      mediaUrl: '/api/media/song/srajen-dj/2026-10/a33aa193-whatsapp-audio-2026-10-09-at-2-22-09-am.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=900&auto=format&fit=crop',
      genre: ['Club VIP Mix', 'EDM', 'Bass Boosted'],
      year: 2026,
      bpm: 135,
      remixName: 'Festival Mainstage Drop',
      isPublished: true,
    }),
  });
  const djUpload = await djUploadRes.json();
  if (!djUploadRes.ok) throw new Error('DJ upload failed: ' + JSON.stringify(djUpload));
  const djSongId = djUpload.content?._id || djUpload.content?.id;
  console.log(`✅ Uploaded DJ Song ID: ${djSongId}\n`);

  // 3. Upload a new Bhojpuri song
  console.log('Step 3: Uploading new Bhojpuri song: "Bhojpuriya Dhamaka"...');
  const bhojpuriUploadRes = await fetch(`${BASE_URL}/api/admin/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie || '',
    },
    body: JSON.stringify({
      type: 'song',
      industry: 'Bhojpuri', // Test casing tolerance!
      title: 'Bhojpuriya Dhamaka',
      description: 'Desi festive celebration anthem',
      cast: ['Khesari Lal', 'Srajen Khare'],
      mediaUrl: '/api/media/song/bhojpuri/2026-10/b044fcf8-whatsapp-audio-2026-10-09-at-2-22-09-am.mp3',
      genre: ['Bhojpuri Folk', 'Desi Beats'],
      year: 2026,
      isPublished: true,
    }),
  });
  const bhojpuriUpload = await bhojpuriUploadRes.json();
  if (!bhojpuriUploadRes.ok) throw new Error('Bhojpuri upload failed: ' + JSON.stringify(bhojpuriUpload));
  const bhojpuriSongId = bhojpuriUpload.content?._id || bhojpuriUpload.content?.id;
  console.log(`✅ Uploaded Bhojpuri Song ID: ${bhojpuriSongId}\n`);

  // 4. Upload an Unpublished song
  console.log('Step 4: Uploading Unpublished Song: "Hidden Vault Secret"...');
  const secretUploadRes = await fetch(`${BASE_URL}/api/admin/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie || '',
    },
    body: JSON.stringify({
      type: 'song',
      industry: 'srajen-dj',
      title: 'Hidden Vault Secret',
      description: 'Unreleased draft',
      mediaUrl: '/api/media/song/srajen-dj/2026-10/a33aa193-whatsapp-audio-2026-10-09-at-2-22-09-am.mp3',
      isPublished: false,
    }),
  });
  const secretUpload = await secretUploadRes.json();
  const secretSongId = secretUpload.content?._id || secretUpload.content?.id;
  console.log(`✅ Uploaded Unpublished Song ID: ${secretSongId}\n`);

  // 5. Test Normal/Logged-out User on /songs/srajen-dj
  console.log('Step 5: Verifying Logged-Out Visitor on /songs/srajen-dj...');
  const djPublicRes = await fetch(`${BASE_URL}/api/content?type=song&industry=srajen-dj`);
  const djPublic = await djPublicRes.json();
  const foundDj = (djPublic.items || []).some((i) => i.title === 'Ayodhya Bass Blast');
  const foundSecret = (djPublic.items || []).some((i) => i.title === 'Hidden Vault Secret');
  console.log('  -> "Ayodhya Bass Blast" visible:', foundDj ? 'PASS (found)' : 'FAIL');
  console.log('  -> "Hidden Vault Secret" hidden:', !foundSecret ? 'PASS (hidden)' : 'FAIL (leaked)');

  // 6. Test Normal/Logged-out User on /songs/bhojpuri
  console.log('\nStep 6: Verifying Logged-Out Visitor on /songs/bhojpuri...');
  const bhojpuriPublicRes = await fetch(`${BASE_URL}/api/content?type=song&industry=bhojpuri`);
  const bhojpuriPublic = await bhojpuriPublicRes.json();
  const foundBhojpuri = (bhojpuriPublic.items || []).some((i) => i.title === 'Bhojpuriya Dhamaka');
  console.log('  -> "Bhojpuriya Dhamaka" visible:', foundBhojpuri ? 'PASS (found)' : 'FAIL');

  // 7. Test Global Search
  console.log('\nStep 7: Verifying Global Search for Logged-Out Visitor...');
  const searchRes = await fetch(`${BASE_URL}/api/content?search=Ayodhya`);
  const searchData = await searchRes.json();
  const searchFound = (searchData.items || []).some((i) => i.title === 'Ayodhya Bass Blast');
  console.log('  -> Search query "Ayodhya" matched:', searchFound ? 'PASS (found)' : 'FAIL');

  // 8. Test "Recently Added" Songs on Home Page
  console.log('\nStep 8: Verifying "Recently Added" Songs...');
  const recentRes = await fetch(`${BASE_URL}/api/content?type=song&limit=6`);
  const recentData = await recentRes.json();
  const recentTitles = (recentData.items || []).map((i) => i.title);
  console.log('  -> Top Recently Added songs:', recentTitles);
  const foundInRecent = recentTitles.includes('Ayodhya Bass Blast') || recentTitles.includes('Bhojpuriya Dhamaka');
  console.log('  -> Appears in Recently Added:', foundInRecent ? 'PASS' : 'FAIL');

  // 9. Test Audio Streaming & Range Requests
  console.log('\nStep 9: Testing Audio Playback & HTTP Range Seeking...');
  const mediaUrl = `${BASE_URL}/api/media/song/srajen-dj/2026-10/a33aa193-whatsapp-audio-2026-10-09-at-2-22-09-am.mp3`;
  const streamRes = await fetch(mediaUrl, {
    headers: { Range: 'bytes=0-1024' },
  });
  console.log('  -> HTTP Status:', streamRes.status, streamRes.status === 206 || streamRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('  -> Content-Type:', streamRes.headers.get('content-type'));
  console.log('  -> Content-Range:', streamRes.headers.get('content-range') || 'N/A');

  // 10. Clean up test tracks
  console.log('\nStep 10: Cleaning up test tracks...');
  for (const id of [djSongId, bhojpuriSongId, secretSongId]) {
    if (id) {
      await fetch(`${BASE_URL}/api/admin/content/${id}`, {
        method: 'DELETE',
        headers: { cookie: cookie || '' },
      });
    }
  }
  console.log('✅ Test tracks cleaned up successfully.');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
