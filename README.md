# Parivartan.ai (परिवर्तन.ai)

> **AI-Powered Multimodal Content Transformation & Citation Engine**
> Smart India Hackathon (SIH) 2026

Parivartan.ai converts unstructured source materials (PDFs, Word documents, audio briefings, OCR imagery, and web URLs) into structured, factual, citation-linked, and publishable intelligence.

---

## 🌟 Key Features

1. **Multimodal Ingestion Engine**
   - **PDFs & Reports**: Page-aware layout and text extraction with `pypdf`.
   - **Microsoft Word (.docx)**: Paragraph, heading, and embedded table parser.
   - **Web Articles / URLs**: Automated DOM content extraction with metadata scraping.
   - **Image OCR & Audio Transcription**: Multi-format support for speech briefings and scanned documents.
   - **Direct Text Input**: Instant markdown or transcript paste.

2. **5-Stage Automated Transformation Pipeline**
   - **Stage 1 (Ingest)**: Multi-format parsing into unified token streams.
   - **Stage 2 (Preprocess)**: Structural chunking, entity scanning, and token normalization.
   - **Stage 3 (Neural Synthesis)**: Formulates executive briefings, structured articles, and validated Q&A matrices (powered by Google Gemini 1.5 Flash with deterministic contextual fallback).
   - **Stage 4 (Citation Linking & Factual Audit)**: Precision citation engine mapping every claim directly back to verbatim source sentence anchors with location coordinates and confidence scores.
   - **Stage 5 (Export Compilation)**: Pre-renders multi-format publishable assets.

3. **Real-time Telemetry & Live Cockpit**
   - Server-Sent Events (SSE) streaming live progress percentages, step badges, and terminal logs to the frontend in real time.

4. **Interactive Evidence & Citations Explorer**
   - Clickable inline citation pills `[1]`, `[2]` linking synthesized claims directly to source evidence.
   - Categorized Key Facts and Question & Answer matrix with confidence scoring.

5. **Multi-Format Export Hub**
   - 1-Click download for:
     - **Markdown (`.md`)**: GitHub-flavored with full citation appendix.
     - **Standalone HTML (`.html`)**: Self-contained styled document.
     - **Microsoft Word (`.docx`)**: Formatted document with headers, quotes, and footnotes.
     - **JSON (`.json`)**: Machine-readable schema with token offsets.

---

## 🏗️ Architecture

```
d:\SIH_2\
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings & environment variables
│   │   ├── database.py           # SQLAlchemy SQLite engine & session
│   │   ├── models/               # User, Project, Document, Pipeline, Transformation
│   │   ├── schemas/              # Pydantic request & response models
│   │   ├── services/
│   │   │   ├── auth_service.py   # JWT & bcrypt authentication
│   │   │   ├── ai_pipeline.py    # 5-stage transformation pipeline
│   │   │   ├── citation_engine.py# Factual back-link & sentence matcher
│   │   │   ├── export_service.py # Markdown, HTML, JSON, DOCX generators
│   │   │   └── ingestion/        # Multimodal extractors (PDF, DOCX, URL, OCR)
│   │   ├── routers/              # /auth, /projects, /documents, /pipeline, /export
│   │   └── main.py               # FastAPI application entry point
│   ├── requirements.txt
│   └── test_pipeline_e2e.py      # End-to-end verification script
│
├── frontend/
│   ├── src/
│   │   ├── index.css             # Dark glassmorphic design system
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── api/client.ts         # Axios client with JWT interceptor
│   │   ├── context/AuthContext.tsx# Authentication provider with 1-click demo
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── UploadDropzone.tsx # Multimodal drag & drop, URL & text
│   │   │   ├── PipelineProgress.tsx # 5-stage live SSE progress visualizer
│   │   │   └── ResultsViewer.tsx  # Tabs, citation inspector, export buttons
│   │   ├── pages/
│   │   │   ├── Landing.tsx       # Interactive showcase & sandbox
│   │   │   ├── Dashboard.tsx     # Workspaces & metrics
│   │   │   ├── ProjectView.tsx   # Project details & document list
│   │   │   ├── DocumentView.tsx  # Transformation cockpit
│   │   │   └── AuthPage.tsx      # Sign in / Register / 1-Click Demo
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Backend server will run at: `http://127.0.0.1:8000` (API Docs at `/docs`)*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

*Frontend web app will run at: `http://127.0.0.1:5173`*

---

## 🔑 Demo Access (Pre-Seeded)

- **Email**: `demo@parivartan.ai`
- **Password**: `demo123`
- Or simply click the **"1-Click Demo"** button on the landing page for instant one-click access!
