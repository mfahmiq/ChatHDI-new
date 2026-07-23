import { NextResponse } from 'next/server';
import { generateEmbeddings, getEmbeddingConfig } from '@/lib/rag/embeddingService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { input } = await request.json();
    const texts = Array.isArray(input) ? input : [input];
    if (texts.length > 50) {
      return NextResponse.json({ error: 'Maksimal 50 potongan teks per permintaan.' }, { status: 400 });
    }

    const embeddings = await generateEmbeddings(input);
    const config = getEmbeddingConfig();
    return NextResponse.json({
      embeddings,
      model: config.model,
      dimensions: config.dimensions,
    });
  } catch (error) {
    console.error('[POST /api/embeddings] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
