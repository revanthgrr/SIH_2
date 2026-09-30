import json
import io
from typing import Dict, Any
from docx import Document as DocxDocument
from docx.shared import Inches, Pt, RGBColor

class ExportService:
    """Multi-format export generator for Parivartan.ai transformations."""

    @staticmethod
    def generate_markdown(doc_title: str, transformation: Dict[str, Any]) -> str:
        article = transformation.get("structured_article", "")
        summary = transformation.get("summary", "")
        qa_pairs = transformation.get("qa_pairs", [])
        citations = transformation.get("citations", [])

        md = []
        md.append(f"# {doc_title} — Transformed by Parivartan.ai\n")
        md.append("## Executive Summary\n")
        md.append(f"{summary}\n\n")
        md.append("## Structured Article\n")
        md.append(f"{article}\n\n")

        if qa_pairs:
            md.append("## Verified Question & Answer Matrix\n")
            for qa in qa_pairs:
                md.append(f"### Q: {qa.get('question')}")
                md.append(f"**A**: {qa.get('answer')}")
                md.append(f"*Confidence: {int(qa.get('confidence', 0.9) * 100)}%*\n")

        if citations:
            md.append("## Verified Citations & Source Traceability\n")
            for c in citations:
                md.append(f"- **[{c.get('index')}]** `{c.get('location')}`: \"{c.get('source_quote')}\" (Confidence: {int(c.get('confidence', 0.9) * 100)}%)")

        return "\n".join(md)

    @staticmethod
    def generate_html(doc_title: str, transformation: Dict[str, Any]) -> str:
        article = transformation.get("structured_article", "").replace("\n", "<br/>")
        summary = transformation.get("summary", "").replace("\n", "<br/>")
        citations = transformation.get("citations", [])
        qa_pairs = transformation.get("qa_pairs", [])

        citations_html = "".join([
            f"<li id='cite-{c.get('index')}'><strong>[{c.get('index')}]</strong> <span class='loc'>{c.get('location')}</span>: <em>\"{c.get('source_quote')}\"</em></li>"
            for c in citations
        ])

        qa_html = "".join([
            f"<div class='qa-card'><h4>{qa.get('question')}</h4><p>{qa.get('answer')}</p><span class='badge'>{int(qa.get('confidence', 0.9)*100)}% Confidence</span></div>"
            for qa in qa_pairs
        ])

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{doc_title} | Parivartan.ai</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px 20px;
    }}
    .container {{
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }}
    h1 {{ color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 12px; }}
    h2 {{ color: #1e1b4b; margin-top: 32px; }}
    .badge {{ display: inline-block; background: #e0e7ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; font-size: 12px; }}
    .qa-card {{ background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; margin: 16px 0; border-radius: 4px; }}
    .citations {{ background: #f1f5f9; padding: 20px 28px; border-radius: 8px; margin-top: 36px; }}
    .loc {{ font-weight: 600; color: #4f46e5; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>{doc_title}</h1>
    <p><em>Synthesized & Verified with Parivartan.ai Multimodal Platform</em></p>
    
    <h2>Executive Summary</h2>
    <p>{summary}</p>

    <h2>Structured Document</h2>
    <div>{article}</div>

    <h2>Verified Q&A Matrix</h2>
    {qa_html}

    <div class="citations">
      <h3>Verified Citations & Evidence Trace</h3>
      <ol>{citations_html}</ol>
    </div>
  </div>
</body>
</html>"""

    @staticmethod
    def generate_docx(doc_title: str, transformation: Dict[str, Any]) -> io.BytesIO:
        doc = DocxDocument()

        title = doc.add_heading(f"{doc_title}", level=0)
        subtitle = doc.add_paragraph("Synthesized by Parivartan.ai Content Engine")
        subtitle.runs[0].italic = True

        doc.add_heading("Executive Summary", level=1)
        doc.add_paragraph(transformation.get("summary", ""))

        doc.add_heading("Structured Article", level=1)
        doc.add_paragraph(transformation.get("structured_article", ""))

        qa_pairs = transformation.get("qa_pairs", [])
        if qa_pairs:
            doc.add_heading("Verified Q&A Matrix", level=1)
            for qa in qa_pairs:
                doc.add_heading(f"Q: {qa.get('question')}", level=2)
                doc.add_paragraph(f"A: {qa.get('answer')}")

        citations = transformation.get("citations", [])
        if citations:
            doc.add_heading("Citations & Source Index", level=1)
            for c in citations:
                p = doc.add_paragraph()
                p.add_run(f"[{c.get('index')}] ({c.get('location')}): ").bold = True
                p.add_run(f"\"{c.get('source_quote')}\"")

        target_stream = io.BytesIO()
        doc.save(target_stream)
        target_stream.seek(0)
        return target_stream
