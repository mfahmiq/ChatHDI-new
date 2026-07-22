import 'server-only';

import { createClient } from '@supabase/supabase-js';

let hasWarned = false;

export const searchSupabaseKnowledge = async ({
  query,
  queryEmbedding,
  authorization,
  threshold = 0.45,
  count = 5,
}) => {
  if (!authorization?.startsWith('Bearer ')) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data, error } = await supabase.rpc('match_document_sections_v2', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: count,
    query_text: query,
  });

  if (error) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn(`[Supabase RAG] Retrieval dilewati: ${error.message || error.code}`);
    }
    return [];
  }

  return (data || []).map(match => ({
    source: match.document_name,
    heading: match.is_shared ? 'Company Knowledge Base' : 'Dokumen pribadi',
    content: match.content,
    similarity: Number(match.similarity),
    storage: 'supabase',
  }));
};
