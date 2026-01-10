import io
import logging
import PyPDF2
import docx
import pandas as pd
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class DocumentService:
    async def parse_document(self, file: UploadFile) -> str:
        """Parse uploaded file and return extracted text"""
        filename = file.filename.lower()
        content = await file.read()
        file_obj = io.BytesIO(content)

        try:
            if filename.endswith('.pdf'):
                return self._parse_pdf(file_obj)
            elif filename.endswith('.docx'):
                return self._parse_docx(file_obj)
            elif filename.endswith('.xlsx') or filename.endswith('.xls'):
                return self._parse_excel(file_obj)
            elif filename.endswith('.csv'):
                # Handle CSV as text first to detect encoding if needed, but pandas is robust
                file_obj.seek(0)
                return self._parse_csv(file_obj)
            elif filename.endswith('.txt') or filename.endswith('.md') or filename.endswith('.py') or filename.endswith('.js') or filename.endswith('.json'):
                return content.decode('utf-8', errors='ignore')
            else:
                # Try to decode as text for unknown types, fallback to error message
                try:
                    return content.decode('utf-8')
                except:
                    return f"[Unsupported binary file: {filename}]"
        except Exception as e:
            logger.error(f"Error parsing {filename}: {e}")
            return f"Error parsing file {filename}: {str(e)}"

    def _parse_pdf(self, file_obj) -> str:
        reader = PyPDF2.PdfReader(file_obj)
        text = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            text.append(f"--- Page {i+1} ---\n{page_text}")
        return "\n".join(text)

    def _parse_docx(self, file_obj) -> str:
        doc = docx.Document(file_obj)
        return "\n".join([para.text for para in doc.paragraphs])

    def _parse_excel(self, file_obj) -> str:
        # Read all sheets or just the first one? Let's read the first one for simplicity or concat all
        # For simplicity, default to first sheet
        df = pd.read_excel(file_obj)
        return df.to_string(index=False)

    def _parse_csv(self, file_obj) -> str:
        df = pd.read_csv(file_obj)
        return df.to_string(index=False)

document_service = DocumentService()
