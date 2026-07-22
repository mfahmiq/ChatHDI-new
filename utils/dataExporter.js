import * as XLSX from 'xlsx';

/**
 * Parses markdown table content into an array of objects
 * @param {string} markdown - Markdown text containing a table
 * @returns {Array} - Array of objects representing the table
 */
export const parseMarkdownTable = (markdown) => {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 3) return [];

    // Find table start and end
    let tableStart = -1;
    let tableEnd = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('|') && lines[i].includes('---')) {
            tableStart = i - 1;
            // Continue to find end
            for (let j = i + 1; j < lines.length; j++) {
                if (!lines[j].includes('|')) {
                    tableEnd = j;
                    break;
                }
            }
            if (tableEnd === -1) tableEnd = lines.length;
            break;
        }
    }

    if (tableStart === -1) return [];

    const headers = lines[tableStart].split('|')
        .map(h => h.trim())
        .filter(h => h !== '');

    // Skip separator line (tableStart + 1)

    const data = [];
    for (let i = tableStart + 2; i < tableEnd; i++) {
        const row = lines[i].split('|').map(c => c.trim());
        // Remove empty first/last elements from split if pipe is at edges
        if (lines[i].trim().startsWith('|')) row.shift();
        if (lines[i].trim().endsWith('|')) row.pop();

        if (row.length === headers.length) {
            const obj = {};
            headers.forEach((h, index) => {
                obj[h] = row[index];
            });
            data.push(obj);
        }
    }

    return data;
};

/**
 * Detects if a string contains a markdown table
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export const hasMarkdownTable = (text) => {
    return text.includes('|') && text.includes('---') && (text.match(/\|/g) || []).length >= 4;
};

/**
 * Exports data to Excel
 * @param {Array} data - Array of objects
 * @param {string} filename 
 */
export const exportToExcel = (data, filename = 'data_export.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, filename);
};

/**
 * Exports data to CSV
 * @param {Array} data - Array of objects
 * @param {string} filename 
 */
export const exportToCSV = (data, filename = 'data_export.csv') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
