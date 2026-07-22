import 'server-only';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateEmbedding, getEmbeddingConfig } from './embeddingService';

const INDEX_PATH = join(process.cwd(), 'knowledge', 'index', 'company-index.json');
const SOURCE_PATH = join(process.cwd(), 'knowledge', 'company.md');

const loadIndex = () => {
  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));

  const sourceHash = createHash('sha256')
    .update(readFileSync(SOURCE_PATH, 'utf8'))
    .digest('hex');
  if (sourceHash !== index.sourceHash) {
    throw new Error('company.md berubah. Jalankan npm run rag:index-company untuk memperbarui index.');
  }

  return index;
};

const cosineSimilarity = (left, right) => {
  if (left.length !== right.length) return -1;

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dotProduct / denominator : -1;
};

export const searchLocalKnowledge = async (query, options = {}) => {
  const topK = options.topK || Number.parseInt(process.env.RAG_LOCAL_TOP_K || '4', 10);
  const threshold = options.threshold || Number.parseFloat(process.env.RAG_LOCAL_THRESHOLD || '0.35');
  const index = loadIndex();
  const config = getEmbeddingConfig();

  if (index.model !== config.model || index.dimensions !== config.dimensions) {
    throw new Error('Index knowledge lokal tidak cocok dengan konfigurasi embedding. Jalankan npm run rag:index-company.');
  }

  const queryEmbedding = options.queryEmbedding || await generateEmbedding(query);
  return index.chunks
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter(chunk => chunk.similarity >= threshold)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, topK);
};

export const formatLocalRagContext = (matches) => matches
  .map(match => `[Sumber: ${match.source} — ${match.heading}]\n${match.content}`)
  .join('\n\n');
