import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Image as ImageIcon, Music, Link as LinkIcon, 
  Trash2, Play, Sparkles, CheckCircle2, Clock, ChevronRight, Search
} from 'lucide-react';
import { projectsApi, documentsApi } from '../api/client';
import type { Project, DocumentItem } from '../types';
import { UploadDropzone } from '../components/UploadDropzone';

export const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0', 10);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjectData = useCallback(async () => {
    try {
      const [projRes, docsRes] = await Promise.all([
        projectsApi.getById(projectId),
        documentsApi.getByProject(projectId),
      ]);
      setProject(projRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  const handleDocumentAdded = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDoc = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (window.confirm('Delete this source document?')) {
      try {
        await documentsApi.delete(docId);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } catch (err) {
        console.error('Failed to delete doc:', err);
      }
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <span className="badge badge-indigo"><FileText size={11} /> PDF</span>;
      case 'docx':
      case 'doc':
        return <span className="badge badge-purple"><FileText size={11} /> DOCX</span>;
      case 'image':
      case 'png':
      case 'jpg':
        return <span className="badge badge-emerald"><ImageIcon size={11} /> OCR Visual</span>;
      case 'audio':
      case 'mp3':
      case 'wav':
        return <span className="badge badge-amber"><Music size={11} /> Audio</span>;
      case 'url':
        return <span className="badge badge-cyan"><LinkIcon size={11} /> Web URL</span>;
      default:
        return <span className="badge badge-indigo"><FileText size={11} /> Text</span>;
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading workspace records...
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>Workspace not found.</h3>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-canvas">
      {/* Back button & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-icon"
          title="Back to Dashboard"
          id="back-to-dashboard-btn"
          style={{ width: '32px', height: '32px' }}
        >
          <ArrowLeft size={15} />
        </button>
        <span
          onClick={() => navigate('/dashboard')}
          style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Workspaces
        </span>
        <ChevronRight size={13} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
          {project.name}
        </span>
      </div>

      {/* Project Header Info Card */}
      <div className="white-card" style={{ padding: '22px 26px', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.65rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>
          {project.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '800px', lineHeight: 1.5 }}>
          {project.description || 'Workspace repository for multimodal content synthesis.'}
        </p>
      </div>

      {/* Ingestion Dropzone */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
          Ingest Multimodal Content
        </h3>
        <UploadDropzone projectId={projectId} onDocumentAdded={handleDocumentAdded} />
      </div>

      {/* Documents List & Source Library */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Source Documents ({documents.length})
            </h3>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Click any item to view its 5-stage pipeline & verified results
            </span>
          </div>

          {/* Search bar */}
          {documents.length > 0 && (
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.825rem', padding: '6px 10px 6px 32px' }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="white-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>No source materials uploaded yet</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Drag files into the dropzone above or enter a web URL to begin.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDocs.map((doc) => {
              const isCompleted = doc.status === 'completed';
              const isProcessing = doc.status === 'processing';

              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/document/${doc.id}`)}
                  id={`doc-row-${doc.id}`}
                  className="white-card"
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '16px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--primary-light)',
                      border: '1px solid var(--primary-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={17} color="var(--primary)" />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {doc.filename}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {getFormatBadge(doc.file_type)}
                        {doc.file_size > 0 && <span>{(doc.file_size / 1024).toFixed(1)} KB</span>}
                        {doc.source_url && (
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doc.source_url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {isCompleted ? (
                      <span className="badge badge-emerald">
                        <CheckCircle2 size={12} /> Synthesized
                      </span>
                    ) : isProcessing ? (
                      <span className="badge badge-indigo">
                        <Clock size={12} className="animate-spin" /> Processing
                      </span>
                    ) : (
                      <span className="badge badge-amber">Ready to Transform</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/document/${doc.id}`);
                      }}
                      className={isCompleted ? 'btn-secondary' : 'btn-primary'}
                      id={`open-doc-btn-${doc.id}`}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '5px' }}
                    >
                      {isCompleted ? <Sparkles size={13} color="var(--primary)" /> : <Play size={13} fill="currentColor" />}
                      {isCompleted ? 'View Results' : 'Synthesize'}
                    </button>

                    <button
                      onClick={(e) => handleDeleteDoc(e, doc.id)}
                      className="btn-icon"
                      title="Delete Document"
                      style={{ width: '30px', height: '30px' }}
                    >
                      <Trash2 size={13} color="var(--status-error)" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
