from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class PipelineTriggerRequest(BaseModel):
    document_id: Optional[int] = None
    focus_topic: Optional[str] = None
    target_audience: Optional[str] = "Professional / Academic"
    output_tone: Optional[str] = "Authoritative and clear"

class PipelineJobResponse(BaseModel):
    id: int
    document_id: int
    status: str
    current_stage: str
    progress_pct: float
    logs: List[Dict[str, Any]] = []
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
