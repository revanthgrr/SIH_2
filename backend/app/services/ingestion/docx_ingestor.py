from typing import Dict, Any, List
import docx

def extract_from_docx(file_path: str) -> Dict[str, Any]:
    """Extracts raw text, headings, paragraphs, and tables from DOCX files."""
    try:
        doc = docx.Document(file_path)
        paragraphs_text = []
        headings = []
        
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            if p.style and "Heading" in p.style.name:
                headings.append(text)
                paragraphs_text.append(f"## {text}")
            else:
                paragraphs_text.append(text)
                
        # Also extract table cells if any
        table_rows = []
        for table in doc.tables:
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    table_rows.append(" | ".join(cells))
                    
        if table_rows:
            paragraphs_text.append("\n[Extracted Table Data]:\n" + "\n".join(table_rows))
            
        full_text = "\n\n".join(paragraphs_text)
        word_count = len(full_text.split())
        
        return {
            "success": True,
            "text": full_text,
            "word_count": word_count,
            "headings": headings,
            "metadata": {
                "headings_count": len(headings),
                "tables_count": len(doc.tables)
            },
            "file_type": "docx"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": f"Error parsing DOCX: {str(e)}",
            "word_count": 0,
            "headings": [],
            "metadata": {},
            "file_type": "docx"
        }
