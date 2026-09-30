export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

export interface DocumentBrief {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  created_at?: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  documents?: DocumentBrief[];
}

export interface DocumentItem {
  id: number;
  project_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  source_url?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  created_at?: string;
  updated_at?: string;
}

export interface PipelineLog {
  stage: string;
  pct: number;
  message: string;
  time?: number;
}

export interface PipelineJob {
  id: number;
  document_id: number;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  current_stage: string;
  progress_pct: number;
  logs: PipelineLog[];
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CitationItem {
  id: string;
  index: number;
  claim: string;
  source_quote: string;
  location: string;
  confidence: number;
}

export interface QAPair {
  question: string;
  answer: string;
  confidence: number;
  citation_id?: string;
}

export interface KeyFact {
  fact: string;
  category: string;
  source_ref?: string;
}

export interface TransformationResult {
  id: number;
  document_id: number;
  raw_text?: string;
  summary?: string;
  structured_article?: string;
  qa_pairs: QAPair[];
  key_facts: KeyFact[];
  citations: CitationItem[];
  extracted_metadata: {
    word_count?: number;
    reading_time_min?: number;
    pages_count?: number;
    citations_count?: number;
    file_type?: string;
    focus_topic?: string;
    target_audience?: string;
    [key: string]: any;
  };
  model_used: string;
  created_at?: string;
}
