from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CitationItem(BaseModel):
    id: str
    index: int
    claim: str
    source_quote: str
    location: str  # Page, section, timestamp or offset
    confidence: float

class QAPair(BaseModel):
    question: str
    answer: str
    confidence: float
    citation_id: Optional[str] = None

class KeyFact(BaseModel):
    fact: str
    category: str
    source_ref: Optional[str] = None

class TransformationResultResponse(BaseModel):
    id: int
    document_id: int
    raw_text: Optional[str] = None
    summary: Optional[str] = None
    structured_article: Optional[str] = None
    qa_pairs: List[QAPair] = []
    key_facts: List[KeyFact] = []
    citations: List[CitationItem] = []
    extracted_metadata: Dict[str, Any] = {}
    model_used: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
