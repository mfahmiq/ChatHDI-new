const normalizeText = (text) => text
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const chunkMarkdown = (text, { maxCharacters = 1400, overlapCharacters = 180 } = {}) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const sections = normalized.split(/(?=^#{1,3}\s)/m).filter(Boolean);
  const chunks = [];

  for (const section of sections) {
    const heading = section.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() || 'Knowledge';
    let cursor = 0;

    while (cursor < section.length) {
      let end = Math.min(cursor + maxCharacters, section.length);
      if (end < section.length) {
        const paragraphBreak = section.lastIndexOf('\n\n', end);
        const sentenceBreak = Math.max(
          section.lastIndexOf('. ', end),
          section.lastIndexOf('! ', end),
          section.lastIndexOf('? ', end),
        );
        const preferredBreak = Math.max(paragraphBreak, sentenceBreak);
        if (preferredBreak > cursor + Math.floor(maxCharacters * 0.55)) {
          end = preferredBreak + 1;
        }
      }

      const content = section.slice(cursor, end).trim();
      if (content) chunks.push({ heading, content });
      if (end >= section.length) break;

      cursor = Math.max(end - overlapCharacters, cursor + 1);
    }
  }

  return chunks.filter(chunk => chunk.content.replace(/^#{1,3}\s+.+$/m, '').trim().length > 0);
};
