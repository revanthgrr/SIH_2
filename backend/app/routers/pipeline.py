import json
import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.pipeline import PipelineJob
from app.models.transformation import TransformationResult
from app.schemas.pipeline import PipelineTriggerRequest, PipelineJobResponse
from app.schemas.transformation import TransformationResultResponse
from app.services.auth_service import get_current_user
from app.services.ai_pipeline import AIPipelineOrchestrator

router = APIRouter(prefix="/pipeline", tags=["AI Pipeline"])

# In-memory subscription queues for Server-Sent Events (SSE)
sse_subscribers: Dict[int, List[asyncio.Queue]] = {}

def get_document_for_user(doc_id: int, user_id: int, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.project.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document.")
    return doc

async def broadcast_event(doc_id: int, data: dict):
    """Sends event to all active SSE browser connections for this document."""
    if doc_id in sse_subscribers:
        for q in list(sse_subscribers[doc_id]):
            try:
                await q.put(data)
            except Exception:
                pass

async def run_pipeline_task(
    doc_id: int,
    file_path: str,
    file_type: str,
    source_url: str,
    focus_topic: str,
    target_audience: str,
    output_tone: str
):
    """Background async worker running the 5-stage transformation pipeline."""
    db = SessionLocal()
    orchestrator = AIPipelineOrchestrator()

    job = db.query(PipelineJob).filter(PipelineJob.document_id == doc_id).order_by(PipelineJob.id.desc()).first()
    if not job:
        job = PipelineJob(document_id=doc_id, status="processing", current_stage="Initializing", progress_pct=5.0, logs="[]")
        db.add(job)
        db.commit()
        db.refresh(job)

    logs_list = []

    def handle_progress(stage: str, pct: float, message: str):
        # Read/update in fresh DB call or in memory
        nonlocal logs_list
        log_entry = {"stage": stage, "pct": pct, "message": message, "time": asyncio.get_event_loop().time()}
        logs_list.append(log_entry)

        # Broadcast SSE immediately to browser
        asyncio.create_task(broadcast_event(doc_id, {
            "type": "progress",
            "document_id": doc_id,
            "stage": stage,
            "progress_pct": pct,
            "message": message,
            "status": "completed" if pct >= 100.0 else "processing"
        }))

    try:
        job.status = "processing"
        db.commit()

        # Update doc status
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "processing"
            db.commit()

        result = await orchestrator.run_pipeline(
            document_id=doc_id,
            file_path=file_path,
            file_type=file_type,
            source_url=source_url,
            focus_topic=focus_topic,
            target_audience=target_audience,
            output_tone=output_tone,
            progress_callback=handle_progress
        )

        # Save or update TransformationResult in DB
        trans = db.query(TransformationResult).filter(TransformationResult.document_id == doc_id).first()
        if not trans:
            trans = TransformationResult(document_id=doc_id)
            db.add(trans)

        trans.raw_text = result["raw_text"]
        trans.summary = result["summary"]
        trans.structured_article = result["structured_article"]
        trans.qa_pairs = json.dumps(result["qa_pairs"])
        trans.key_facts = json.dumps(result["key_facts"])
        trans.citations = json.dumps(result["citations"])
        trans.extracted_metadata = json.dumps(result["extracted_metadata"])
        trans.model_used = result["model_used"]

        job.status = "completed"
        job.current_stage = "Completed"
        job.progress_pct = 100.0
        job.logs = json.dumps(logs_list)

        if doc:
            doc.status = "completed"

        db.commit()

        # Final broadcast
        await broadcast_event(doc_id, {
            "type": "completed",
            "document_id": doc_id,
            "status": "completed",
            "progress_pct": 100.0
        })

    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        job.logs = json.dumps(logs_list)
        if doc:
            doc.status = "error"
        db.commit()

        await broadcast_event(doc_id, {
            "type": "error",
            "document_id": doc_id,
            "status": "failed",
            "error": str(e)
        })
    finally:
        db.close()

@router.post("/{document_id}/run", response_model=PipelineJobResponse)
async def trigger_pipeline(
    document_id: int,
    background_tasks: BackgroundTasks,
    payload: PipelineTriggerRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = get_document_for_user(document_id, current_user.id, db)

    # Initialize or reset PipelineJob
    job = db.query(PipelineJob).filter(PipelineJob.document_id == document_id).first()
    if not job:
        job = PipelineJob(document_id=document_id)
        db.add(job)

    job.status = "queued"
    job.current_stage = "Queued for processing"
    job.progress_pct = 2.0
    job.logs = "[]"
    job.error_message = None
    doc.status = "processing"
    db.commit()
    db.refresh(job)

    focus_topic = payload.focus_topic if payload else None
    target_audience = payload.target_audience if payload else "Professional / Academic"
    output_tone = payload.output_tone if payload else "Authoritative and clear"

    # Enqueue background task
    background_tasks.add_task(
        run_pipeline_task,
        document_id,
        doc.storage_path or "",
        doc.file_type,
        doc.source_url,
        focus_topic,
        target_audience,
        output_tone
    )

    parsed_logs = json.loads(job.logs) if job.logs else []
    return {
        "id": job.id,
        "document_id": job.document_id,
        "status": job.status,
        "current_stage": job.current_stage,
        "progress_pct": job.progress_pct,
        "logs": parsed_logs,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }

@router.get("/{document_id}/status", response_model=PipelineJobResponse)
def get_pipeline_status(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = get_document_for_user(document_id, current_user.id, db)
    job = db.query(PipelineJob).filter(PipelineJob.document_id == document_id).order_by(PipelineJob.id.desc()).first()
    if not job:
        return {
            "id": 0,
            "document_id": document_id,
            "status": "idle",
            "current_stage": "Not started",
            "progress_pct": 0.0,
            "logs": [],
            "error_message": None,
            "created_at": None,
            "updated_at": None
        }

    parsed_logs = json.loads(job.logs) if job.logs else []
    return {
        "id": job.id,
        "document_id": job.document_id,
        "status": job.status,
        "current_stage": job.current_stage,
        "progress_pct": job.progress_pct,
        "logs": parsed_logs,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }

@router.get("/{document_id}/stream")
async def stream_pipeline_progress(document_id: int):
    """Server-Sent Events endpoint streaming real-time stage updates to UI."""
    queue = asyncio.Queue()
    if document_id not in sse_subscribers:
        sse_subscribers[document_id] = []
    sse_subscribers[document_id].append(queue)

    async def event_generator():
        try:
            # Yield initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'document_id': document_id})}\n\n"
            while True:
                # Wait for next event
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
                if data.get("type") in ("completed", "error"):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            if document_id in sse_subscribers and queue in sse_subscribers[document_id]:
                sse_subscribers[document_id].remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/{document_id}/results", response_model=TransformationResultResponse)
def get_transformation_results(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = get_document_for_user(document_id, current_user.id, db)
    trans = db.query(TransformationResult).filter(TransformationResult.document_id == document_id).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transformation results have not been generated yet.")

    return {
        "id": trans.id,
        "document_id": trans.document_id,
        "raw_text": trans.raw_text,
        "summary": trans.summary,
        "structured_article": trans.structured_article,
        "qa_pairs": json.loads(trans.qa_pairs) if trans.qa_pairs else [],
        "key_facts": json.loads(trans.key_facts) if trans.key_facts else [],
        "citations": json.loads(trans.citations) if trans.citations else [],
        "extracted_metadata": json.loads(trans.extracted_metadata) if trans.extracted_metadata else {},
        "model_used": trans.model_used,
        "created_at": trans.created_at
    }
