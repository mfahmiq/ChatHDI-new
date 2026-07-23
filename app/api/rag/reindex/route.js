import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateEmbeddings, getEmbeddingConfig } from '@/lib/rag/embeddingService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token pengguna diperlukan.' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase URL and Key missing' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authorization } } },
    );

    const { data: sections, error: selectError } = await supabase
      .from('document_sections')
      .select('id, content')
      .order('id');
    if (selectError) throw selectError;

    const config = getEmbeddingConfig();
    let updated = 0;
    for (let index = 0; index < sections.length; index += 50) {
      const batch = sections.slice(index, index + 50);
      const embeddings = await generateEmbeddings(batch.map(section => section.content));

      for (let batchIndex = 0; batchIndex < batch.length; batchIndex += 1) {
        const { error: updateError } = await supabase
          .from('document_sections')
          .update({
            embedding_v2: embeddings[batchIndex],
            embedding_model: config.model,
          })
          .eq('id', batch[batchIndex].id);
        if (updateError) throw updateError;
        updated += 1;
      }
    }

    return NextResponse.json({ updated, model: config.model, dimensions: config.dimensions });
  } catch (error) {
    console.error('[POST /api/rag/reindex] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
