import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, ExternalLink, Download, RefreshCw, AlertCircle,
  Loader2, CheckCircle2, FileText, Folder, BookOpen,
  MessageSquare, Quote, Clock
} from 'lucide-react';
import { projectsApi, documentsApi, pipelineApi, getExportUrl, API_BASE } from '../api/client';
import type { DocumentItem, TransformationResult, Project } from '../types';

interface OutputDoc {
  doc: DocumentItem & { projectName: string; projectId: number };
  result: TransformationResult | null;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const OutputBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [outputs, setOutputs] = useState<OutputDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OutputDoc | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectsApi.getAll();
      const projects: Project[] = projRes.data;
      const completedDocs: (DocumentItem & { projectName: string; projectId: number })[] = [];

      await Promise.all(
        projects.map(async (p) => {
          try {
            const docRes = await documentsApi.getByProject(p.id);
            docRes.data
              .filter((d) => d.status === 'completed')
              .forEach((d) => completedDocs.push({ ...d, projectName: p.name, projectId: p.id }));
          } catch { /* skip */ }
        })
      );

      const outputList: OutputDoc[] = await Promise.all(
        completedDocs.map(async (doc) => {
          try {
            const res = await pipelineApi.getResults(doc.id);
            return { doc, result: res.data };
          } catch {
            return { doc, result: null };
          }
        })
      );

      outputList.sort((a, b) =>
        new Date(b.doc.updated_at ?? 0).getTime() - new Date(a.doc.updated_at ?? 0).getTime()
      );
      setOutputs(outputList);
      if (outputList.length > 0 && !selected) setSelected(outputList[0]);
    } catch {
      setError('Failed to load outputs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportFormats: Array<'markdown' | 'html' | 'json' | 'docx'> = ['markdown', 'html', 'json', 'docx'];

  return (
    <div className="workspace-canvas">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Output Builder</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Browse, preview and export completed AI transformation outputs.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" id="outputs-refresh-btn" style={{ gap: '7px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading outputs…</p>
        </div>
      ) : error ? (
        <div className="white-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--status-error)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={load} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
        </div>
      ) : outputs.length === 0 ? (
        <div className="white-card" style={{ padding: '60px', textAlign: 'center' }}>
          <Layers size={40} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No completed transformations yet. Run the pipeline on a document first.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: '16px' }}>
            Go to Workspaces
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Panel — Output List */}
          <div className="white-card" style={{ overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {outputs.length} Completed Outputs
            </div>
            {outputs.map((o) => (
              <div
                key={o.doc.id}
                id={`output-item-${o.doc.id}`}
                onClick={() => setSelected(o)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-main)',
                  cursor: 'pointer',
                  background: selected?.doc.id === o.doc.id ? 'var(--primary-light)' : 'transparent',
                  borderLeft: selected?.doc.id === o.doc.id ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (selected?.doc.id !== o.doc.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { if (selected?.doc.id !== o.doc.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={14} color="var(--status-success)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.doc.filename}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '22px' }}>
                  <Folder size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.doc.projectName}</span>
                </div>
                <div style={{ marginLeft: '22px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatDate(o.doc.updated_at)}
                </div>
              </div>
            ))}
          </div>

          {/* Right Panel — Preview */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Action Bar */}
              <div className="white-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.doc.filename}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selected.result?.model_used ?? 'Unknown model'} · {formatDate(selected.doc.updated_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" id={`output-open-${selected.doc.id}`}
                    onClick={() => navigate(`/document/${selected.doc.id}`)} style={{ gap: '6px', fontSize: '0.825rem' }}>
                    <ExternalLink size={13} /> Full View
                  </button>
                  {exportFormats.map((fmt) => (
                    <a key={fmt} href={`${API_BASE}/export/${selected.doc.id}/${fmt}`} target="_blank" rel="noreferrer"
                      id={`output-export-${fmt}-${selected.doc.id}`}
                      style={{ textDecoration: 'none' }}>
                      <button className="btn-primary" style={{ gap: '6px', fontSize: '0.825rem', padding: '8px 12px' }}>
                        <Download size={13} /> {fmt.toUpperCase()}
                      </button>
                    </a>
                  ))}
                </div>
              </div>

              {/* Stats Row */}
              {selected.result && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Word Count', value: selected.result.extracted_metadata?.word_count ?? '—', icon: <FileText size={14} /> },
                    { label: 'Reading Time', value: selected.result.extracted_metadata?.reading_time_min ? `${selected.result.extracted_metadata.reading_time_min} min` : '—', icon: <Clock size={14} /> },
                    { label: 'Citations', value: selected.result.citations.length, icon: <Quote size={14} /> },
                    { label: 'Q&A Pairs', value: selected.result.qa_pairs.length, icon: <MessageSquare size={14} /> },
                    { label: 'Key Facts', value: selected.result.key_facts.length, icon: <BookOpen size={14} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="white-card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--primary)' }}>
                        {stat.icon}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Preview */}
              {selected.result?.summary && (
                <div className="white-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    AI Summary Preview
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                    {selected.result.summary.slice(0, 600)}{selected.result.summary.length > 600 ? '…' : ''}
                  </p>
                </div>
              )}

              {/* Key Facts */}
              {selected.result && selected.result.key_facts.length > 0 && (
                <div className="white-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Key Facts ({selected.result.key_facts.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selected.result.key_facts.slice(0, 5).map((kf, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem', flexShrink: 0 }}>{kf.category}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{kf.fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
