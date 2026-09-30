from typing import Dict, Any, List
import pypdf

def extract_from_pdf(file_path: str) -> Dict[str, Any]:
    """Extracts raw text, pages, word count and metadata from PDF files."""
    pages_text: List[Dict[str, Any]] = []
    full_text_chunks = []
    
    try:
        reader = pypdf.PdfReader(file_path)
        total_pages = len(reader.pages)
        
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                pages_text.append({
                    "page_number": idx + 1,
                    "text": text,
                    "char_count": len(text)
                })
                full_text_chunks.append(f"--- Page {idx + 1} ---\n{text}")
                
        full_text = "\n\n".join(full_text_chunks)
        word_count = len(full_text.split())
        
        metadata = {}
        if reader.metadata:
            metadata = {
                "title": reader.metadata.title or "",
                "author": reader.metadata.author or "",
                "producer": reader.metadata.producer or "",
            }
            
        return {
            "success": True,
            "text": full_text,
            "total_pages": total_pages,
            "word_count": word_count,
            "pages": pages_text,
            "metadata": metadata,
            "file_type": "pdf"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": f"Error parsing PDF: {str(e)}",
            "total_pages": 0,
            "word_count": 0,
            "pages": [],
            "metadata": {},
            "file_type": "pdf"
        }
