from typing import Dict, Any
import os

def extract_from_text(content: str, filename: str = "document.txt") -> Dict[str, Any]:
    """Processes plain text, Markdown, or raw content."""
    clean_lines = [line.strip() for line in content.splitlines() if line.strip()]
    clean_text = "\n\n".join(clean_lines)
    word_count = len(clean_text.split())

    return {
        "success": True,
        "text": clean_text,
        "title": filename,
        "word_count": word_count,
        "metadata": {
            "line_count": len(clean_lines),
            "char_count": len(clean_text)
        },
        "file_type": "text"
    }

def extract_from_file_path(file_path: str) -> Dict[str, Any]:
    """Reads raw text from local file path."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return extract_from_text(content, os.path.basename(file_path))
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": f"Error reading text file: {str(e)}",
            "word_count": 0,
            "metadata": {},
            "file_type": "text"
        }
