from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, image, audio, url, text
    file_size = Column(BigInteger, default=0)
    storage_path = Column(String(500), nullable=True)
    source_url = Column(String(1000), nullable=True)
    status = Column(String(50), default="uploaded")  # uploaded, processing, completed, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="documents")
    pipeline_jobs = relationship("PipelineJob", back_populates="document", cascade="all, delete-orphan")
    transformation = relationship("TransformationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
