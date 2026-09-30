import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Folder, FileText, CheckCircle2,
  XCircle, Loader2, Clock, AlertCircle, RefreshCw,
  TrendingUp, Quote, MessageSquare, Zap
} from 'lucide-react';
import { projectsApi, documentsApi, pipelineApi } from '../api/client';
import type { Project, DocumentItem, TransformationResult } from '../types';

interface AnalyticsData {
  totalProjects: number;
  totalDocs: number;
  completedDocs: number;
  processingDocs: number;
  errorDocs: number;
  totalCitations: number;
  totalQAPairs: number;
  totalKeyFacts: number;
  avgCitationConf: number;
  avgQAConf: number;
  totalWordCount: number;
  avgWordsPerDoc: number;
  docsByType: Record<string, number>;
  transformationsPerProject: Array<{ name: string; count: number }>;
  recentActivity: Array<{ filename: string; status: string; date: string }>;
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

const BAR_COLORS = ['var(--primary)', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0284C7'];

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectsApi.getAll();
      const projects: Project[] = projRes.data;

      let totalDocs = 0, completedDocs = 0, processingDocs = 0, errorDocs = 0;
      let totalCitations = 0, totalQAPairs = 0, totalKeyFacts = 0;
      let citConfSum = 0, citConfCount = 0, qaConfSum = 0, qaConfCount = 0;
      let totalWordCount = 0;
      const docsByType: Record<string, number> = {};
      const transformationsPerProject: Array<{ name: string; count: number }> = [];
      const recentActivity: Array<{ filename: string; status: string; date: string }> = [];
      const allDocs: (DocumentItem & { projectName: string })[] = [];

      await Promise.all(projects.map(async (p) => {
        try {
          const dr = await documentsApi.getByProject(p.id);
          let projCompleted = 0;
          dr.data.forEach((d) => {
            totalDocs++;
            allDocs.push({ ...d, projectName: p.name });
            if (d.status === 'completed') { completedDocs++; projCompleted++; }
            else if (d.status === 'processing') processingDocs++;
            else if (d.status === 'error') errorDocs++;
            const ft = d.file_type.toLowerCase();
            docsByType[ft] = (docsByType[ft] ?? 0) + 1;
            recentActivity.push({ filename: d.filename, status: d.status, date: d.updated_at ?? d.created_at ?? '' });
          });
          if (projCompleted > 0) transformationsPerProject.push({ name: p.name, count: projCompleted });
        } catch { /* skip */ }
      }));

      // Fetch results for completed docs
      await Promise.all(
        allDocs.filter((d) => d.status === 'completed').map(async (d) => {
          try {
            const rr = await pipelineApi.getResults(d.id);
            const r: TransformationResult = rr.data;
            totalCitations += r.citations.length;
            totalQAPairs += r.qa_pairs.length;
            totalKeyFacts += r.key_facts.length;
            r.citations.forEach((c) => { citConfSum += c.confidence; citConfCount++; });
            r.qa_pairs.forEach((q) => { qaConfSum += q.confidence; qaConfCount++; });
            if (r.extracted_metadata?.word_count) totalWordCount += r.extracted_metadata.word_count;
          } catch { /* skip */ }
        })
      );

      recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setData({
        totalProjects: projects.length,
        totalDocs,
        completedDocs,
        processingDocs,
        errorDocs,
        totalCitations,
        totalQAPairs,
        totalKeyFacts,
        avgCitationConf: citConfCount > 0 ? citConfSum / citConfCount : 0,
        avgQAConf: qaConfCount > 0 ? qaConfSum / qaConfCount : 0,
        totalWordCount,
        avgWordsPerDoc: completedDocs > 0 ? Math.round(totalWordCount / completedDocs) : 0,
        docsByType,
        transformationsPerProject: transformationsPerProject.sort((a, b) => b.count - a.count),
        recentActivity: recentActivity.slice(0, 8),
      });
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (isLoading) return (
    <div className="workspace-canvas" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Crunching your analytics…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div className="workspace-canvas">
      <div className="white-card" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={32} color="var(--status-error)" style={{ display: 'block', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={load} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  const maxTypeCount = Math.max(...Object.values(data.docsByType), 1);
  const maxProjCount = Math.max(...data.transformationsPerProject.map((p) => p.count), 1);

  return (
    <div className="workspace-canvas">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Platform-wide metrics on ingestion, transformation throughput, and AI quality scores.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" id="analytics-refresh-btn" style={{ gap: '7px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Primary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Workspaces', value: data.totalProjects, icon: <Folder size={18} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Total Sources', value: data.totalDocs, icon: <FileText size={18} />, color: '#0284C7', bg: '#F0F9FF' },
          { label: 'Transformed', value: data.completedDocs, icon: <CheckCircle2 size={18} />, color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
          { label: 'Processing', value: data.processingDocs, icon: <Loader2 size={18} />, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Errors', value: data.errorDocs, icon: <XCircle size={18} />, color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
          { label: 'Citations', value: data.totalCitations, icon: <Quote size={18} />, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Q&A Pairs', value: data.totalQAPairs, icon: <MessageSquare size={18} />, color: '#DB2777', bg: '#FDF2F8' },
          { label: 'Key Facts', value: data.totalKeyFacts, icon: <Zap size={18} />, color: '#059669', bg: '#F0FDF4' },
        ].map((kpi) => (
          <div key={kpi.label} className="white-card" style={{ padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Avg Citation Confidence', value: `${(data.avgCitationConf * 100).toFixed(1)}%`, sub: 'Across all citations', color: 'var(--primary)' },
          { label: 'Avg Q&A Confidence', value: `${(data.avgQAConf * 100).toFixed(1)}%`, sub: 'Across all Q&A pairs', color: '#7C3AED' },
          { label: 'Total Words Processed', value: data.totalWordCount.toLocaleString(), sub: 'Across all transformed docs', color: '#059669' },
          { label: 'Avg Words per Doc', value: data.avgWordsPerDoc.toLocaleString(), sub: 'Mean per transformed document', color: '#D97706' },
          { label: 'Transformation Rate', value: `${pct(data.completedDocs, data.totalDocs)}%`, sub: `${data.completedDocs} of ${data.totalDocs} docs`, color: 'var(--status-success)' },
        ].map((m) => (
          <div key={m.label} className="white-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>{m.sub}</div>
            </div>
            <TrendingUp size={28} color={m.color} style={{ opacity: 0.3, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Doc Types Chart */}
        <div className="white-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Sources by File Type
          </div>
          {Object.keys(data.docsByType).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(data.docsByType).sort((a, b) => b[1] - a[1]).map(([type, count], i) => (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{type}</span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(count, maxTypeCount)}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: '99px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transformations per Project */}
        <div className="white-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Transformations per Workspace
          </div>
          {data.transformationsPerProject.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No completed transformations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.transformationsPerProject.map((p, i) => (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{p.name}</span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(p.count, maxProjCount)}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: '99px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Status Donut (CSS-only) */}
      <div className="white-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Pipeline Status Breakdown
        </div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Completed', count: data.completedDocs, color: 'var(--status-success)' },
            { label: 'Uploaded/Pending', count: data.totalDocs - data.completedDocs - data.processingDocs - data.errorDocs, color: '#0284C7' },
            { label: 'Processing', count: data.processingDocs, color: '#D97706' },
            { label: 'Error', count: data.errorDocs, color: 'var(--status-error)' },
          ].filter((s) => s.count > 0).map((s) => (
            <div key={s.label} style={{ flex: '1 1 160px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.count}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({pct(s.count, data.totalDocs)}%)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '99px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct(s.count, data.totalDocs)}%`, background: s.color, borderRadius: '99px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="white-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</span>
            <button className="btn-secondary" id="analytics-view-history-btn" onClick={() => navigate('/history')} style={{ fontSize: '0.8rem', gap: '6px', padding: '6px 12px' }}>
              <Clock size={13} /> View Full History
            </button>
          </div>
          {data.recentActivity.map((a, i) => {
            const statusColors: Record<string, string> = { completed: 'var(--status-success)', processing: '#D97706', error: 'var(--status-error)', uploaded: '#0284C7' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: i < data.recentActivity.length - 1 ? '1px solid var(--border-main)' : 'none' }}>
                <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColors[a.status] ?? 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {a.date ? new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
