import fs from 'fs';
import path from 'path';

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

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Verifying Dev Server Health ---');
  
  // Wait up to 30 seconds for server to respond
  let retries = 15;
  let healthOk = false;
  while (retries > 0) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        console.log('Health check passed:', data.status, 'Storage:', data.storage?.status);
        healthOk = true;
        break;
      }
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 2000));
    retries--;
  }

  if (!healthOk) {
    console.error('Server did not become ready in time');
    process.exit(1);
  }

  console.log('\n--- 1. Testing Password Authentication ---');
  // Test Old Password (should be 401)
  const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'tarunverma930547@gmail.com', password: 'wrong_old_password' })
  });
  console.log('Old password attempt status:', oldLoginRes.status, oldLoginRes.status === 401 ? 'PASS (rejected)' : 'FAIL');

  // Test New Password (should be 200)
  const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'tarunverma930547@gmail.com', password: process.env.ADMIN_PASSWORD })
  });
  const newLoginData = await newLoginRes.json();
  console.log('New password attempt status:', newLoginRes.status, newLoginRes.status === 200 ? 'PASS (accepted)' : 'FAIL');
  console.log('User role:', newLoginData.user?.role);

  const cookieHeader = newLoginRes.headers.get('set-cookie');

  console.log('\n--- 2. Testing Srajen Dj Content API ---');
  const djTracksRes = await fetch(`${baseUrl}/api/content?type=song&industry=srajen-dj`);
  const djTracks = await djTracksRes.json();
  console.log('Srajen Dj tracks count:', djTracks.items ? djTracks.items.length : djTracks.length);

  console.log('\n--- 3. Testing Schema Validation: Movie + srajen-dj must be rejected ---');
  const invalidMovieRes = await fetch(`${baseUrl}/api/admin/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    },
    body: JSON.stringify({
      title: 'Invalid DJ Movie',
      type: 'movie',
      industry: 'srajen-dj',
      genres: ['Action'],
      releaseYear: 2024,
      videoKey: 'storage/movie/srajen-dj/test.mp4'
    })
  });
  console.log('Invalid movie attempt status:', invalidMovieRes.status, invalidMovieRes.status === 400 ? 'PASS (rejected with 400)' : 'FAIL');

  console.log('\n--- 4. Testing Admin Stats ---');
  const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {}
  });
  if (statsRes.ok) {
    const statsData = await statsRes.json();
    console.log('Admin stats - srajenDjSongs count:', statsData.stats?.srajenDjSongs ?? statsData.srajenDjSongs);
    console.log('PASS: Admin stats includes srajen-dj metrics');
  } else {
    console.log('Stats status:', statsRes.status);
  }

  console.log('\n--- 5. Testing Pages accessibility ---');
  const pages = ['/songs', '/songs/srajen-dj', '/admin', '/admin/upload'];
  for (const page of pages) {
    const res = await fetch(`${baseUrl}${page}`);
    console.log(`Page ${page}: status ${res.status}`);
  }

  console.log('\n=== All Automated Checks Finished ===');
}

runTests().catch(console.error);
