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

const provider = process.env.STORAGE_PROVIDER || 'local';
console.log(`--- STORAGE PROVIDER: ${provider.toUpperCase()} ---`);

if (provider === 'local') {
  console.log('✅ Local storage mode active (STORAGE_PROVIDER=local).');
  const storageDir = path.resolve(process.cwd(), process.env.STORAGE_PATH || 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const testFile = path.join(storageDir, `.test-write-${Date.now()}.txt`);
  const testContent = 'ReelBeat Local Disk Storage Test Payload';

  try {
    console.log(`1. Testing write to disk: ${testFile}`);
    fs.writeFileSync(testFile, testContent, 'utf8');
    console.log('   ✅ Write successful!');

    console.log('2. Testing read from disk...');
    const read = fs.readFileSync(testFile, 'utf8');
    if (read === testContent) {
      console.log('   ✅ Read verified successfully!');
    } else {
      throw new Error('Read content mismatch');
    }

    console.log('3. Testing deletion...');
    fs.unlinkSync(testFile);
    console.log('   ✅ Deletion verified successfully!');

    let freeGB = 'Unknown';
    try {
      const stats = fs.statfsSync(storageDir);
      freeGB = `${((stats.bavail * stats.bsize) / 1024 / 1024 / 1024).toFixed(2)} GB`;
      console.log(`4. Available Disk Space: ${freeGB}`);
    } catch {
      // ignore
    }

    console.log('\n🎉 LOCAL STORAGE VERIFICATION PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Local storage test failed:', err.message);
    process.exit(1);
  }
}

// If R2 is explicitly selected
console.log('--- R2 CONFIGURATION AUDIT ---');
const required = ['R2_BUCKET', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'];
let hasAll = true;

for (const k of required) {
  const val = process.env[k];
  if (!val || !val.trim()) {
    console.log(`❌ ${k}: Missing or empty in .env`);
    hasAll = false;
  } else {
    console.log(`✅ ${k}: Present`);
  }
}

if (!hasAll) {
  console.log('\n⚠️ R2 variables missing. To use local storage instead, set STORAGE_PROVIDER=local in .env');
  process.exit(1);
}
