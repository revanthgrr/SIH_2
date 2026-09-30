import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User, Project, Document
from app.services.auth_service import get_password_hash
from app.routers import auth, projects, documents, pipeline, export

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Parivartan.ai API",
    description="Multimodal Content Transformation Platform — SIH 2026",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial demo account if empty
@app.on_event("startup")
def startup_seed():
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@parivartan.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@parivartan.ai",
                hashed_password=get_password_hash("demo123"),
                full_name="Lead Analyst",
                role="admin"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Create default project
            proj = Project(
                user_id=demo_user.id,
                name="SIH Innovation Portfolio",
                description="Multimodal research documentation, policy briefs, and technical transformation repository."
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

            # Sample seed document
            sample_content = (
                "The Government of India has instituted the Digital India framework to foster indigenous "
                "artificial intelligence solutions across governance, agriculture, and educational sectors. "
                "In 2026, the national multimodal intelligence mission aims to transform unstructured public data "
                "into verified, citation-backed knowledge bases. Early pilot testing in smart governance demonstrates "
                "a 42% acceleration in citizen query turnaround and a 99.4% factual traceability rate. "
                "Future scalability depends on localized low-resource linguistic adaptation and real-time citation auditing."
            )
            sample_path = os.path.join(settings.UPLOAD_DIR, "digital_india_ai_brief.txt")
            with open(sample_path, "w", encoding="utf-8") as f:
                f.write(sample_content)

            sample_doc = Document(
                project_id=proj.id,
                filename="digital_india_ai_brief.txt",
                file_type="text",
                file_size=len(sample_content.encode("utf-8")),
                storage_path=sample_path,
                status="uploaded"
            )
            db.add(sample_doc)
            db.commit()
    except Exception as e:
        print(f"Startup seeding notice: {e}")
    finally:
        db.close()

# Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(pipeline.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "Parivartan.ai",
        "tagline": "AI-Powered Multimodal Content Transformation Platform",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }
