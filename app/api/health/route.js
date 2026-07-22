import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "2.3.0",
    mode: "demo",
    database: "in-memory"
  });
}
