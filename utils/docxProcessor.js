import mammoth from "mammoth/mammoth.browser";

/**
 * Extracts raw text from a DOCX file using Mammoth.
 * @param {File} file - The .docx file object
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromDocx = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });

                let text = result.value; // The raw text
                const messages = result.messages; // Any warnings

                if (messages.length > 0) {
                    console.warn("Mammoth warnings:", messages);
                }

                // Basic Cleanup
                text = text.replace(/\n\s*\n/g, '\n\n').trim();

                resolve(text);
            } catch (error) {
                console.error("Error parsing DOCX with Mammoth:", error);
                reject(error);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
