import * as pdfjsLib from 'pdfjs-dist';

// Set worker source (required for pdfjs-dist)
// Using CDN or local file depending on build system
// For create-react-app / webpack, we might need to copy the worker or use a CDN
// Using unpkg with specific version and .mjs extension for v5+ compatibility
// We use a fixed fallback version if the dynamic one fails or for stability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

/**
 * Extract text from a uploaded PDF file
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractTextFromPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Simple text concatenation - can be improved for layout preservation
            const pageText = textContent.items.map(item => item.str).join(' ');

            // Add page marker if needed, or just newline
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw new Error("Failed to read PDF file.");
    }
};

/**
 * Chunk text into overlapping segments
 * @param {string} text 
 * @param {number} chunkSize 
 * @param {number} overlap 
 * @returns {string[]}
 */
export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
    if (!text) return [];

    // Normalize whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length <= chunkSize) {
        return [cleanText];
    }

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        let end = start + chunkSize;

        if (end >= cleanText.length) {
            end = cleanText.length;
        } else {
            // Smart Boundary Detection
            // 1. Try to split at a sentence end (. ! ?) within the last 20% of the chunk
            const lookbackLimit = Math.max(start, end - Math.floor(chunkSize * 0.2));

            let bestBreak = -1;

            // Search for sentence delimiters
            const sentenceProp = cleanText.substring(lookbackLimit, end).match(/[.!?]\s/g);
            if (sentenceProp) {
                // Find last occurrence manually to get index
                for (let i = end - 1; i >= lookbackLimit; i--) {
                    const char = cleanText[i];
                    if (['.', '!', '?'].includes(char) && cleanText[i + 1] === ' ') {
                        bestBreak = i + 1; // Include the punctuation
                        break;
                    }
                }
            }

            // 2. If no sentence break, try newline or comma, or just space
            if (bestBreak === -1) {
                const spaceBreak = cleanText.lastIndexOf(' ', end);
                if (spaceBreak > start) {
                    bestBreak = spaceBreak;
                }
            }

            // 3. Apply break if found, otherwise we are forced to hard cut (rare: very long word)
            if (bestBreak !== -1) {
                end = bestBreak;
            }
        }

        const chunk = cleanText.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move start pointer for next chunk (apply overlap)
        // Ensure we don't get stuck
        const nextStart = end - overlap;
        start = (nextStart > start) ? nextStart : end;
    }

    return chunks;
};
