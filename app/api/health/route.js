import { NextResponse } from 'next/server';
import { nvidiaRequestQueue } from '@/lib/nvidiaRequestQueue';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "2.3.0",
    mode: "demo",
    database: "in-memory",
    nvidia_queue: nvidiaRequestQueue.getStatus(),
  });
}
