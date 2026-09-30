import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ChevronRight, Eye, EyeOff, Sparkles, 
  RefreshCw, ShieldCheck, Sparkle
} from 'lucide-react';
import { documentsApi, pipelineApi } from '../api/client';
import type { DocumentItem, TransformationResult } from '../types';
import { PipelineProgress } from '../components/PipelineProgress';
import { ResultsViewer } from '../components/ResultsViewer';

export const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentId = parseInt(id || '0', 10);

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [results, setResults] = useState<TransformationResult | null>(null);
  const [showRawSource, setShowRawSource] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocumentAndResults = useCallback(async () => {
    try {
      const docRes = await documentsApi.getById(documentId);
      setDocument(docRes.data);

      try {
        const resultsRes = await pipelineApi.getResults(documentId);
        setResults(resultsRes.data);
      } catch {
        setResults(null);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      fetchDocumentAndResults();
    }
  }, [documentId, fetchDocumentAndResults]);

  const handlePipelineCompleted = () => {
    fetchDocumentAndResults();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading document cockpit...
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>Document record not found.</h3>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ marginTop: '16px' }}>
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-canvas">
      {/* Navigation Header / Breadcrumbs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigate(`/project/${document.project_id}`)}
            className="btn-icon"
            title="Back to Workspace"
            id="back-to-project-btn"
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
          <span
            onClick={() => navigate(`/project/${document.project_id}`)}
            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Project
          </span>
          <ChevronRight size={13} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            {document.filename}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchDocumentAndResults}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
            id="refresh-doc-btn"
          >
            <RefreshCw size={13} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Document Overview Banner Card */}
      <div className="white-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)'
            }}>
              <FileText size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {document.filename}
                </h2>
                <span className="badge badge-indigo">{document.file_type.toUpperCase()}</span>
                {results && (
                  <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {document.file_size > 0 && <span>Size: {(document.file_size / 1024).toFixed(1)} KB</span>}
                {document.source_url && (
                  <span>Source URL: <a href={document.source_url} target="_blank" rel="noreferrer">{document.source_url}</a></span>
                )}
                <span>Added: {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Recent'}</span>
              </div>
            </div>
          </div>

          {/* Toggle raw ingested source view */}
          {results?.raw_text && (
            <button
              onClick={() => setShowRawSource(!showRawSource)}
              className="btn-secondary"
              id="toggle-raw-source-btn"
              style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
            >
              {showRawSource ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRawSource ? 'Hide Extracted Source' : 'View Extracted Source'}
            </button>
          )}
        </div>

        {/* Collapsible Ingested Raw Text Preview */}
        {showRawSource && results?.raw_text && (
          <div style={{
            marginTop: '16px',
            borderTop: '1px solid var(--border-main)',
            paddingTop: '14px'
          }}>
            <h5 style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Raw Ingested Tokens (Parsed by Multimodal Ingestor)
            </h5>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-main)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              maxHeight: '200px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {results.raw_text}
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Transformation Workspace Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: results ? 'minmax(380px, 480px) 1fr' : '1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: 5-Stage Transformation Progress Cockpit */}
        <div>
          <PipelineProgress
            documentId={documentId}
            documentTitle={document.filename}
            onCompleted={handlePipelineCompleted}
          />
        </div>

        {/* Right Column: Synthesized Intelligence & Citation Evidence Hub */}
        <div>
          {results ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={17} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Synthesized Intelligence & Citation Evidence
                </h3>
              </div>
              <ResultsViewer
                documentId={documentId}
                documentTitle={document.filename}
                results={results}
              />
            </div>
          ) : (
            <div className="white-card" style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '14px'
              }}>
                <Sparkle size={22} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
                Ready for Multimodal Synthesis
              </h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '400px', lineHeight: 1.6 }}>
                Click &quot;Execute Full Pipeline&quot; on the left to trigger the 5-stage transformation and verify factual back-links.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
