import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const sourcePath = join(projectRoot, 'knowledge', 'company.md');
const outputPath = join(projectRoot, 'knowledge', 'index', 'company-index.json');

const config = {
  baseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
  model: process.env.OLLAMA_EMBEDDING_MODEL || 'embeddinggemma',
  dimensions: Number.parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || '384', 10),
};

const chunkMarkdown = (text) => text
  .replace(/\r\n/g, '\n')
  .trim()
  .split(/(?=^#{1,3}\s)/m)
  .filter(Boolean)
  .map(section => ({
    heading: section.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() || 'Knowledge',
    content: section.trim(),
  }))
  .filter(chunk => chunk.content.replace(/^#{1,3}\s+.+$/m, '').trim().length > 0);

const generateEmbeddings = async (texts) => {
  const response = await fetch(`${config.baseUrl}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      input: texts,
      dimensions: config.dimensions,
      truncate: true,
      keep_alive: 0,
    }),
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.embeddings;
};

const source = await readFile(sourcePath, 'utf8');
const chunks = chunkMarkdown(source);
const embeddings = await generateEmbeddings(chunks.map(chunk => chunk.content));
const index = {
  version: 1,
  sourceHash: createHash('sha256').update(source).digest('hex'),
  createdAt: new Date().toISOString(),
  model: config.model,
  dimensions: config.dimensions,
  chunks: chunks.map((chunk, chunkIndex) => ({
    id: `company-${chunkIndex}`,
    source: 'company.md',
    heading: chunk.heading,
    content: chunk.content,
    embedding: embeddings[chunkIndex],
  })),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(index)}\n`, 'utf8');
process.stdout.write(`Indexed ${index.chunks.length} chunks with ${index.model} (${index.dimensions} dimensions).\n`);
