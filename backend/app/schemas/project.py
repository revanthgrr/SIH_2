from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DocumentBrief(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    documents: List[DocumentBrief] = []

    class Config:
        from_attributes = True
