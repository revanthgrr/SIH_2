import json
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.transformation import TransformationResult
from app.services.auth_service import get_current_user
from app.services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["Export"])

def get_transformation_data(doc_id: int, user_id: int, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or doc.project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized.")
    
    trans = db.query(TransformationResult).filter(TransformationResult.document_id == doc_id).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transformation result not found.")
        
    data = {
        "summary": trans.summary,
        "structured_article": trans.structured_article,
        "qa_pairs": json.loads(trans.qa_pairs) if trans.qa_pairs else [],
        "key_facts": json.loads(trans.key_facts) if trans.key_facts else [],
        "citations": json.loads(trans.citations) if trans.citations else [],
        "extracted_metadata": json.loads(trans.extracted_metadata) if trans.extracted_metadata else {},
        "model_used": trans.model_used
    }
    return doc, data

@router.get("/{document_id}/markdown")
def export_markdown(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, data = get_transformation_data(document_id, current_user.id, db)
    md_content = ExportService.generate_markdown(doc.filename, data)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="parivartan_{doc.id}_article.md"'}
    )

@router.get("/{document_id}/html")
def export_html(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, data = get_transformation_data(document_id, current_user.id, db)
    html_content = ExportService.generate_html(doc.filename, data)
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="parivartan_{doc.id}_brief.html"'}
    )

@router.get("/{document_id}/json")
def export_json(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, data = get_transformation_data(document_id, current_user.id, db)
    payload = {
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "created_at": str(doc.created_at)
        },
        "transformation": data
    }
    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="parivartan_{doc.id}_data.json"'}
    )

@router.get("/{document_id}/docx")
def export_docx(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc, data = get_transformation_data(document_id, current_user.id, db)
    docx_stream = ExportService.generate_docx(doc.filename, data)
    return StreamingResponse(
        docx_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="parivartan_{doc.id}_document.docx"'}
    )
