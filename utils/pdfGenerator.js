import jsPDF from 'jspdf';

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
 * Generates a PDF document from chat content
 * @param {string} content - The text content to convert
 * @param {string} title - Document title
 * @returns {Promise<jsPDF>} - PDF document
 */
export const generatePDFFromText = async (content, title = "ChatHDI Export") => {
    const doc = new jsPDF();
    const logoBase64 = await getLogoBase64();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Colors
    const emerald = [0, 191, 165];
    const darkGray = [31, 41, 55];
    const lightGray = [156, 163, 175];

    // Header bar
    doc.setFillColor(...emerald);
    doc.rect(0, 0, pageWidth, 8, 'F');

    doc.setFillColor(...darkGray);
    doc.rect(0, 8, pageWidth, 20, 'F');

    // Logo and brand
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, 10, 12, 12);
        } catch (e) {
            console.warn('Could not add logo:', e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ChatHDI AI', margin + 16, 18);

    yPos = 40;

    // Title
    doc.setTextColor(...darkGray);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');

    const titleLines = doc.splitTextToSize(title, contentWidth);
    doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += titleLines.length * 10 + 5;

    // Date
    doc.setTextColor(...lightGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const dateStr = `Generated on ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Separator line
    doc.setDrawColor(...emerald);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Content
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const lines = content.split('\n');

    const addNewPageIfNeeded = () => {
        if (yPos > pageHeight - 30) {
            doc.addPage();
            // Add header to new page
            doc.setFillColor(...emerald);
            doc.rect(0, 0, pageWidth, 5, 'F');
            doc.setFillColor(...darkGray);
            doc.rect(0, 5, pageWidth, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('ChatHDI AI', margin, 13);
            yPos = 25;
            doc.setTextColor(55, 65, 81);
        }
    };

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            yPos += 5;
            return;
        }

        addNewPageIfNeeded();

        // Headers
        if (trimmed.startsWith('# ')) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            const text = trimmed.substring(2);
            const textLines = doc.splitTextToSize(text, contentWidth);
            doc.text(textLines, margin, yPos);
            yPos += textLines.length * 8 + 6;
        } else if (trimmed.startsWith('## ')) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            const text = trimmed.substring(3);
            const textLines = doc.splitTextToSize(text, contentWidth);
            doc.text(textLines, margin, yPos);
            yPos += textLines.length * 6 + 4;
        } else if (trimmed.startsWith('### ')) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            const text = trimmed.substring(4);
            const textLines = doc.splitTextToSize(text, contentWidth);
            doc.text(textLines, margin, yPos);
            yPos += textLines.length * 5 + 3;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            // Bullet point
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            doc.setFillColor(...emerald);
            doc.circle(margin + 2, yPos - 1.5, 1, 'F');
            const text = trimmed.substring(2);
            const textLines = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(textLines, margin + 8, yPos);
            yPos += textLines.length * 5 + 2;
        } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            // Bold text
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            const text = trimmed.slice(2, -2);
            const textLines = doc.splitTextToSize(text, contentWidth);
            doc.text(textLines, margin, yPos);
            yPos += textLines.length * 5 + 3;
        } else if (trimmed.startsWith('```')) {
            // Skip code block markers
            return;
        } else {
            // Regular text
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            const textLines = doc.splitTextToSize(trimmed, contentWidth);
            doc.text(textLines, margin, yPos);
            yPos += textLines.length * 5 + 2;
        }
    });

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text('Generated by ChatHDI AI - www.chathdi.com', pageWidth / 2, pageHeight - 10, { align: 'center' });

    return doc;
};

/**
 * Download PDF document
 * @param {string} content - The text content
 * @param {string} title - Document title
 * @param {string} filename - Output filename
 */
export const downloadPDF = async (content, title, filename = "ChatHDI_Export.pdf") => {
    const doc = await generatePDFFromText(content, title);
    doc.save(filename);
};
