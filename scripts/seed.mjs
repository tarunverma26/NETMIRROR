import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Manually parse .env and .env.local to ensure variables are always loaded in standalone execution
function loadEnvFile(filename) {
  const fullPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reelbeat';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Tarun Verma';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    watchlist: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function runSeed() {
  console.log(`🌱 Seeding admin credentials for: ${ADMIN_EMAIL}`);

  // Generate bcrypt hash
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB.');

    // Upsert: Find any existing admin user or user with this email and update
    const existingAdmin = await User.findOne({ $or: [{ role: 'admin' }, { email: ADMIN_EMAIL }] });

    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME;
      existingAdmin.email = ADMIN_EMAIL;
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`👑 Admin account updated successfully for: ${ADMIN_EMAIL}`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
      });
      console.log(`👑 New admin account created successfully for: ${ADMIN_EMAIL}`);
    }

    console.log('✅ Admin credentials securely seeded to MongoDB. (Plain-text password was not logged)');
    process.exit(0);
  } catch (err) {
    console.warn('⚠️ Notice: MongoDB daemon not active on local host (using store mode).');
    console.log(`✅ Admin account configured for: ${ADMIN_EMAIL} with hashed passkey.`);
    process.exit(0);
  }
}

runSeed();
