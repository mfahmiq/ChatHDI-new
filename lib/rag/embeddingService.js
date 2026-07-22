const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'embeddinggemma';
const DEFAULT_DIMENSIONS = 384;

export const getEmbeddingConfig = () => ({
  baseUrl: (process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
  model: process.env.OLLAMA_EMBEDDING_MODEL || DEFAULT_MODEL,
  dimensions: Number.parseInt(
    process.env.OLLAMA_EMBEDDING_DIMENSIONS || String(DEFAULT_DIMENSIONS),
    10,
  ),
});

export const generateEmbeddings = async (input) => {
  const texts = Array.isArray(input) ? input : [input];
  if (texts.length === 0 || texts.some(text => typeof text !== 'string' || !text.trim())) {
    throw new Error('Input embedding harus berupa teks yang tidak kosong.');
  }

  const { baseUrl, model, dimensions } = getEmbeddingConfig();
  const response = await fetch(`${baseUrl}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input: texts,
      dimensions,
      truncate: true,
      keep_alive: 0,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Embedding Ollama gagal (${response.status}): ${details}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
    throw new Error('Jumlah embedding dari Ollama tidak sesuai input.');
  }

  for (const embedding of data.embeddings) {
    if (!Array.isArray(embedding) || embedding.length !== dimensions) {
      throw new Error(`Dimensi embedding harus ${dimensions}.`);
    }
  }

  return data.embeddings;
};

export const generateEmbedding = async (text) => {
  const [embedding] = await generateEmbeddings(text);
  return embedding;
};
