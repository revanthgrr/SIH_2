import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.document import Document
from app.schemas.document import DocumentResponse, UrlIngestRequest, RawTextIngestRequest
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

def get_file_extension_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower().replace(".", "")
    if ext in ["pdf"]:
        return "pdf"
    elif ext in ["docx", "doc"]:
        return "docx"
    elif ext in ["png", "jpg", "jpeg", "webp", "bmp"]:
        return "image"
    elif ext in ["mp3", "wav", "m4a", "ogg"]:
        return "audio"
    elif ext in ["txt", "md", "csv", "json"]:
        return "text"
    return "text"

@router.get("/project/{project_id}", response_model=List[DocumentResponse])
def get_project_documents(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return db.query(Document).filter(Document.project_id == project_id).order_by(Document.created_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).join(Project).filter(Document.id == document_id, Project.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.post("/upload", response_model=DocumentResponse)
async def upload_file(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    file_type = get_file_extension_type(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    doc = Document(
        project_id=project_id,
        filename=file.filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=file_path,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/url", response_model=DocumentResponse)
def ingest_url(payload: UrlIngestRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    title = payload.custom_title or payload.url.split("/")[-1] or "Web Source"
    doc = Document(
        project_id=payload.project_id,
        filename=f"URL: {title}",
        file_type="url",
        file_size=0,
        source_url=payload.url,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/text", response_model=DocumentResponse)
def ingest_raw_text(payload: RawTextIngestRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    unique_name = f"{uuid.uuid4().hex}_{payload.title}.txt"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(payload.content)

    doc = Document(
        project_id=payload.project_id,
        filename=payload.title,
        file_type="text",
        file_size=len(payload.content.encode("utf-8")),
        storage_path=file_path,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).join(Project).filter(Document.id == document_id, Project.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.storage_path and os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return None
