import * as XLSX from 'xlsx';

/**
 * Extracts text from an Excel file (.xlsx, .xls) using SheetJS.
 * Converts all sheets to CSV format and joins them.
 * @param {File} file - The Excel file object
 * @returns {Promise<string>} - The extracted text (CSV format)
 */
export const extractTextFromExcel = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                let fullText = "";

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    // Convert sheet to CSV to preserve some structure
                    const csv = XLSX.utils.sheet_to_csv(sheet);

                    if (csv && csv.trim().length > 0) {
                        fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
                    }
                });

                resolve(fullText.trim());
            } catch (error) {
                console.error("Error parsing Excel with SheetJS:", error);
                reject(error);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
