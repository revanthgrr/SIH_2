import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, Loader2, RefreshCw,
  CheckCircle2, Quote, MessageSquare, TrendingUp,
  ExternalLink, Folder, Star
} from 'lucide-react';
import { projectsApi, documentsApi, pipelineApi } from '../api/client';
import type { DocumentItem, TransformationResult, CitationItem, QAPair, Project } from '../types';

interface ReviewDoc {
  doc: DocumentItem & { projectName: string; projectId: number };
  result: TransformationResult;
}

function confColor(c: number) {
  if (c >= 0.85) return 'var(--status-success)';
  if (c >= 0.65) return '#D97706';
  return 'var(--status-error)';
}
function confBg(c: number) {
  if (c >= 0.85) return 'var(--status-success-bg)';
  if (c >= 0.65) return '#FFFBEB';
  return 'var(--status-error-bg)';
}

export const ReviewGuardrails: React.FC = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<ReviewDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReviewDoc | null>(null);
  const [tab, setTab] = useState<'citations' | 'qa'>('citations');

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectsApi.getAll();
      const projects: Project[] = projRes.data;
      const completed: (DocumentItem & { projectName: string; projectId: number })[] = [];

      await Promise.all(projects.map(async (p) => {
        try {
          const dr = await documentsApi.getByProject(p.id);
          dr.data.filter((d) => d.status === 'completed')
            .forEach((d) => completed.push({ ...d, projectName: p.name, projectId: p.id }));
        } catch { /* skip */ }
      }));

      const reviewDocs: ReviewDoc[] = [];
      await Promise.all(completed.map(async (doc) => {
        try {
          const rr = await pipelineApi.getResults(doc.id);
          reviewDocs.push({ doc, result: rr.data });
        } catch { /* skip */ }
      }));

      reviewDocs.sort((a, b) => new Date(b.doc.updated_at ?? 0).getTime() - new Date(a.doc.updated_at ?? 0).getTime());
      setDocs(reviewDocs);
      if (reviewDocs.length > 0) setSelected(reviewDocs[0]);
    } catch {
      setError('Failed to load review data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const avgConf = (items: Array<{ confidence: number }>) =>
    items.length > 0 ? (items.reduce((s, i) => s + i.confidence, 0) / items.length) : 0;

  return (
    <div className="workspace-canvas">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Review & Guardrails</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Citation audit, Q&A confidence scoring, and hallucination guardrail metrics.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" id="review-refresh-btn" style={{ gap: '7px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading guardrail data…</p>
        </div>
      ) : error ? (
        <div className="white-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--status-error)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={load} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
        </div>
      ) : docs.length === 0 ? (
        <div className="white-card" style={{ padding: '60px', textAlign: 'center' }}>
          <ShieldCheck size={40} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No completed documents to review yet.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: '16px' }}>Go to Workspaces</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Doc List */}
          <div className="white-card" style={{ overflow: 'hidden', maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-main)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {docs.length} Documents Under Review
            </div>
            {docs.map((d) => {
              const citConf = avgConf(d.result.citations);
              const qaConf = avgConf(d.result.qa_pairs);
              const overall = (citConf + qaConf) / 2;
              const isActive = selected?.doc.id === d.doc.id;
              return (
                <div key={d.doc.id} id={`review-item-${d.doc.id}`} onClick={() => setSelected(d)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', cursor: 'pointer', background: isActive ? 'var(--primary-light)' : 'transparent', borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                    {d.doc.filename}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: confColor(overall), background: confBg(overall), padding: '2px 7px', borderRadius: '99px' }}>
                      {(overall * 100).toFixed(0)}% conf.
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.result.citations.length} cit. · {d.result.qa_pairs.length} Q&A</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header */}
              <div className="white-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.doc.filename}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Folder size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selected.doc.projectName}</span>
                  </div>
                </div>
                <button className="btn-secondary" id={`review-open-${selected.doc.id}`}
                  onClick={() => navigate(`/document/${selected.doc.id}`)} style={{ gap: '6px', fontSize: '0.825rem' }}>
                  <ExternalLink size={13} /> Full View
                </button>
              </div>

              {/* Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {(() => {
                  const citConf = avgConf(selected.result.citations);
                  const qaConf = avgConf(selected.result.qa_pairs);
                  const overall = (citConf + qaConf) / 2;
                  return [
                    { label: 'Overall Confidence', value: `${(overall * 100).toFixed(1)}%`, color: confColor(overall), icon: <Star size={14} /> },
                    { label: 'Citation Accuracy', value: `${(citConf * 100).toFixed(1)}%`, color: confColor(citConf), icon: <Quote size={14} /> },
                    { label: 'Q&A Confidence', value: `${(qaConf * 100).toFixed(1)}%`, color: confColor(qaConf), icon: <MessageSquare size={14} /> },
                    { label: 'Total Citations', value: selected.result.citations.length, color: 'var(--primary)', icon: <ShieldCheck size={14} /> },
                    { label: 'Q&A Pairs', value: selected.result.qa_pairs.length, color: 'var(--primary)', icon: <TrendingUp size={14} /> },
                  ].map((m) => (
                    <div key={m.label} className="white-card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: m.color }}>{m.icon}<span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span></div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                  ));
                })()}
              </div>

              {/* Tabs */}
              <div className="white-card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-main)' }}>
                  {(['citations', 'qa'] as const).map((t) => (
                    <button key={t} id={`review-tab-${t}`} onClick={() => setTab(t)}
                      style={{ padding: '12px 20px', fontSize: '0.875rem', fontWeight: 600, border: 'none', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t ? 'var(--primary)' : 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      {t === 'citations' ? <><Quote size={14} /> Citations ({selected.result.citations.length})</> : <><MessageSquare size={14} /> Q&A Pairs ({selected.result.qa_pairs.length})</>}
                    </button>
                  ))}
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {tab === 'citations' ? (
                    selected.result.citations.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No citations found.</div>
                    ) : selected.result.citations.map((c: CitationItem, i: number) => (
                      <div key={c.id} style={{ padding: '16px 20px', borderBottom: i < selected.result.citations.length - 1 ? '1px solid var(--border-main)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>#{c.index}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.claim.slice(0, 100)}{c.claim.length > 100 ? '…' : ''}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: confColor(c.confidence), background: confBg(c.confidence), padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {(c.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <blockquote style={{ margin: '0 0 6px 0', padding: '8px 12px', borderLeft: '3px solid var(--primary-border)', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                          "{c.source_quote.slice(0, 160)}{c.source_quote.length > 160 ? '…' : ''}"
                        </blockquote>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {c.location}</div>
                      </div>
                    ))
                  ) : (
                    selected.result.qa_pairs.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No Q&A pairs found.</div>
                    ) : selected.result.qa_pairs.map((qa: QAPair, i: number) => (
                      <div key={i} style={{ padding: '16px 20px', borderBottom: i < selected.result.qa_pairs.length - 1 ? '1px solid var(--border-main)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.68rem', flexShrink: 0, marginTop: '2px' }}>Q</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{qa.question}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: confColor(qa.confidence), background: confBg(qa.confidence), padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {(qa.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginLeft: '36px' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', flexShrink: 0, marginTop: '2px' }}>A</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{qa.answer}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
