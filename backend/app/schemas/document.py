from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class UrlIngestRequest(BaseModel):
    project_id: int
    url: str
    custom_title: Optional[str] = None

class RawTextIngestRequest(BaseModel):
    project_id: int
    title: str
    content: str

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    file_type: str
    file_size: int
    source_url: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
