from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class TransformationResult(Base):
    __tablename__ = "transformation_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Core Transformed Outputs
    raw_text = Column(Text, nullable=True)  # Extracted text from source
    summary = Column(Text, nullable=True)   # Executive synthesis
    structured_article = Column(Text, nullable=True)  # Markdown/HTML publishable article with [1][2] citations
    qa_pairs = Column(Text, nullable=True)  # JSON array of { question, answer, confidence, citation_id }
    key_facts = Column(Text, nullable=True)  # JSON array of { fact, category, source_ref }
    citations = Column(Text, nullable=True)  # JSON array of { id, index, claim, source_quote, location, confidence }
    extracted_metadata = Column(Text, nullable=True)  # JSON object with word_count, reading_time, language, etc.
    
    model_used = Column(String(100), default="gemini-1.5-flash")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    document = relationship("Document", back_populates="transformation")
