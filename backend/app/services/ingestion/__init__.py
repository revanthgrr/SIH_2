import os
from typing import Dict, Any
from app.services.ingestion.pdf_ingestor import extract_from_pdf
from app.services.ingestion.docx_ingestor import extract_from_docx
from app.services.ingestion.url_ingestor import extract_from_url
from app.services.ingestion.text_ingestor import extract_from_text, extract_from_file_path
from app.services.ingestion.ocr_audio_ingestor import extract_from_image, extract_from_audio

def ingest_content(file_path: str, file_type: str, source_url: str = None) -> Dict[str, Any]:
    """Unified multimodal dispatcher based on file type."""
    file_type = file_type.lower()
    
    if file_type == "url" and source_url:
        return extract_from_url(source_url)
    
    if not file_path or not os.path.exists(file_path):
        return {
            "success": False,
            "error": f"File does not exist: {file_path}",
            "text": "",
            "word_count": 0,
            "metadata": {},
            "file_type": file_type
        }
        
    if file_type == "pdf":
        return extract_from_pdf(file_path)
    elif file_type in ("docx", "doc"):
        return extract_from_docx(file_path)
    elif file_type in ("jpg", "jpeg", "png", "bmp", "webp", "image"):
        return extract_from_image(file_path)
    elif file_type in ("mp3", "wav", "m4a", "ogg", "audio"):
        return extract_from_audio(file_path)
    elif file_type in ("txt", "md", "csv", "json", "text"):
        return extract_from_file_path(file_path)
    else:
        # Fallback to plain text read
        return extract_from_file_path(file_path)
