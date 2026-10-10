import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { checkStorageHealth } from '@/lib/storage';
import { applySecurityHeaders } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isMongoConnected = await connectToDatabase();
  const storageHealth = await checkStorageHealth();

  const isHealthy = storageHealth.accessible;

  const response = NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      provider: isMongoConnected ? 'MongoDB' : 'In-Memory Resilient Store',
      connected: isMongoConnected,
      readyState: mongoose.connection.readyState,
    },
    storage: storageHealth,
    uptime: process.uptime(),
  });

  return applySecurityHeaders(response);
}
