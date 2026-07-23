import { NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';
import { mediaService } from '@/lib/mediaService';
import { formatLocalRagContext, searchLocalKnowledge } from '@/lib/rag/localRagService';
import { generateEmbedding } from '@/lib/rag/embeddingService';
import { searchSupabaseKnowledge } from '@/lib/rag/supabaseRagService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { messages, model } = await req.json();

    console.log(`[POST /api/chat] Model requested: ${model}`);

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Check if model indicates image generation
    if (mediaService.isImageModel(model)) {
      const result = await mediaService.generateImage(lastMessage, model);
      if (result.success) {
        return NextResponse.json({
          response: `🎨 Gambar berhasil dibuat!\n\nPrompt: "${lastMessage.substring(0, 100)}${lastMessage.length > 100 ? '...' : ''}"`,
          model,
          media_type: "image",
          media_data: result.images,
          media_model: result.model,
          media_mime: result.mimeType || 'image/png',
        });
      } else {
        return NextResponse.json({
          response: `❌ **Gagal Membuat Gambar**\n\nDetail error:\n\`${result.error}\`\n\nSilakan coba lagi atau periksa konfigurasi provider image yang dipilih.`,
          model: model,
          media_type: null,
          media_data: null
        });
      }
    }

    // Check if model indicates video generation
    if (model === 'hdi-video') {
      const result = await mediaService.generateVideo(lastMessage, model);
      return NextResponse.json({
        response: result.error,
        model: model,
        media_type: null,
        media_data: null
      });
    }

    // Retrieve only the relevant parts of the local company knowledge base.
    let ragMatches = [];
    try {
      const ragQuery = lastMessage.slice(0, 4000);
      const queryEmbedding = await generateEmbedding(ragQuery);
      const [localMatches, supabaseMatches] = await Promise.all([
        searchLocalKnowledge(ragQuery, { queryEmbedding }),
        searchSupabaseKnowledge({
          query: ragQuery,
          queryEmbedding,
          authorization: req.headers.get('authorization'),
        }),
      ]);
      ragMatches = [...supabaseMatches, ...localMatches].slice(0, 6);
    } catch (ragError) {
      console.warn('[POST /api/chat] RAG skipped:', ragError.message);
    }

    const localContext = formatLocalRagContext(ragMatches);
    const enrichedMessages = localContext
      ? [
          {
            role: 'system',
            content: `KNOWLEDGE BASE LOKAL\n\n${localContext}\n\nGunakan hanya bagian yang relevan dan jangan mengarang fakta yang tidak tercantum.`,
          },
          ...messages,
        ]
      : messages;

    // Standard text chat
    const responseText = await aiService.chat(enrichedMessages, model);
    return NextResponse.json({
      response: responseText,
      model: model,
      media_type: null,
      media_data: null,
      rag_sources: ragMatches.map(match => ({
        source: match.source,
        heading: match.heading,
        similarity: Number(match.similarity.toFixed(4)),
        storage: match.storage || 'local',
      })),
    });
  } catch (error) {
    console.error('[POST /api/chat] Error:', error.message);
    return NextResponse.json(
      { response: `Maaf, terjadi kesalahan: ${error.message}`, model: 'error', media_type: null, media_data: null },
      { status: 500 }
    );
  }
}
