import PptxGenJS from "pptxgenjs";

// Helper to convert image URL to base64
const getLogoBase64 = async () => {
    try {
        const response = await fetch('/logo-hdi.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to load logo:', error);
        return null;
    }
};

/**
 * Generates a PowerPoint presentation from Markdown-like text.
 * @param {string} text - The text content to convert (usually from AI response).
 * @param {string} filename - The output filename.
 */
export const generatePPTFromText = async (text, filename = "presentation.pptx") => {
    const pptx = new PptxGenJS();

    // Load logo
    const logoBase64 = await getLogoBase64();

    // Define Master Slide (Template)
    const masterObjects = [
        // Header Bar
        { rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: "00Bfa5" } } }, // Emerald accent
        { rect: { x: 0, y: 0.15, w: "100%", h: 0.85, fill: { color: "1F2937" } } }, // Dark header
        // Footer Bar
        { rect: { x: 0, y: "92%", w: "100%", h: 0.6, fill: { color: "1F2937" } } },
        // Brand Text (Bottom Right)
        { text: { text: "ChatHDI AI Presentation", options: { x: 7, y: 5.1, w: 3, h: 0.4, align: "right", color: "9CA3AF", fontSize: 10, fontFace: "Arial" } } }
    ];

    // Add logo to master if available
    if (logoBase64) {
        masterObjects.push({
            image: { x: 9.2, y: 0.2, w: 0.5, h: 0.5, data: logoBase64 }
        });
    }

    pptx.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: "F3F4F6" }, // Light gray background
        objects: masterObjects,
        slideNumber: { x: 0.3, y: 5.1, color: "9CA3AF", fontSize: 10 }
    });

    // Parse the text into lines
    const lines = text.split('\n');
    let currentSlide = null;
    let contentBuffer = [];

    // Helper to flush content to current slide
    const flushContent = () => {
        if (currentSlide && contentBuffer.length > 0) {
            // Process content items
            const items = contentBuffer.map(line => {
                let cleanLine = line.trim();
                let indent = 0;

                // Check indentation/bullets
                if (cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
                    cleanLine = cleanLine.substring(2);
                } else if (cleanLine.startsWith('  - ') || cleanLine.startsWith('\t- ')) {
                    indent = 1;
                    cleanLine = cleanLine.substring(4).trim();
                }

                return {
                    text: cleanLine,
                    options: {
                        breakLine: true,
                        indentLevel: indent,
                        bullet: true,
                        fontSize: 18,
                        color: '374151', // Dark text
                        valign: 'top',
                        paraSpaceBefore: 10,
                        fontFace: "Arial"
                    }
                };
            });

            currentSlide.addText(items, {
                x: 0.5, y: 1.3, w: '90%', h: '75%',
                valign: 'top'
            });

            contentBuffer = [];
        }
    };

    // Title Slide Creation (First Slide)
    let titleSlide = pptx.addSlide();
    titleSlide.background = { color: "1F2937" }; // Dark background for title
    titleSlide.addText("ChatHDI Generated", { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: "00Bfa5" }, align: 'center', fontSize: 14, color: 'FFFFFF', fontFace: "Arial" });

    // Add logo to title slide
    if (logoBase64) {
        titleSlide.addImage({ x: 4.25, y: 1.5, w: 1.5, h: 1.5, data: logoBase64 });
    }

    titleSlide.addText(filename.replace('.pptx', '').replace(/_/g, ' '), {
        x: 0.5, y: '45%', w: '90%', align: 'center',
        fontSize: 44, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });
    titleSlide.addText(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }), {
        x: 0, y: '60%', w: '100%', align: 'center', fontSize: 18, color: '9CA3AF', fontFace: "Arial"
    });

    // Iterating through lines
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Detect Slide Titles (Headers like #, ##, or "Slide X:")
        const isHeader = /^#{1,2}\s/.test(trimmed) || /^Slide\s+\d+[:.]/i.test(trimmed) || /^Judul:/i.test(trimmed);

        if (isHeader) {
            flushContent();

            const titleText = trimmed.replace(/^#{1,2}\s/, '').replace(/^Slide\s+\d+[:.]\s*/i, '').replace(/^Judul:\s*/i, '');

            currentSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });

            // Add Title using master styling
            currentSlide.addText(titleText, {
                x: 0.5, y: 0.25, w: '90%', h: 0.6,
                fontSize: 28, bold: true, color: 'FFFFFF', fontFace: 'Arial'
            });
        } else {
            // Content
            if (currentSlide) {
                contentBuffer.push(trimmed);
            }
        }
    });

    // Flush remaining content
    flushContent();

    // Return Base64 instead of writing file
    const base64 = await pptx.write("base64");
    return base64;
};
