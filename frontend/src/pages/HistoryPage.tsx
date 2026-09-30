import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon, Clock, CheckCircle2, Loader2,
  XCircle, Upload, AlertCircle, RefreshCw, ExternalLink,
  FileText, Folder
} from 'lucide-react';
import { projectsApi, documentsApi } from '../api/client';
import type { DocumentItem, Project } from '../types';

interface HistoryItem {
  doc: DocumentItem & { projectName: string; projectId: number };
  event: string;
  eventTime: string;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  uploaded:   { label: 'Ingested',    icon: <Upload size={14} />,       color: '#0284C7', bg: '#F0F9FF' },
  processing: { label: 'Processing',  icon: <Loader2 size={14} />,      color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: 'Transformed', icon: <CheckCircle2 size={14} />, color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  error:      { label: 'Failed',      icon: <XCircle size={14} />,      color: 'var(--status-error)',   bg: 'var(--status-error-bg)' },
};

function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(d?: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectsApi.getAll();
      const projects: Project[] = projRes.data;
      const allItems: HistoryItem[] = [];

      await Promise.all(projects.map(async (p) => {
        try {
          const dr = await documentsApi.getByProject(p.id);
          dr.data.forEach((d) => {
            // "Ingested" event on created_at
            if (d.created_at) {
              allItems.push({ doc: { ...d, projectName: p.name, projectId: p.id }, event: 'uploaded', eventTime: d.created_at });
            }
            // "Transformation" event on updated_at if different
            if (d.updated_at && d.updated_at !== d.created_at && (d.status === 'completed' || d.status === 'error' || d.status === 'processing')) {
              allItems.push({ doc: { ...d, projectName: p.name, projectId: p.id }, event: d.status, eventTime: d.updated_at });
            }
          });
        } catch { /* skip */ }
      }));

      allItems.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
      setItems(allItems);
    } catch {
      setError('Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterStatus === 'all' ? items : items.filter((i) => i.event === filterStatus);

  // Group by date
  const grouped: Record<string, HistoryItem[]> = {};
  filtered.forEach((item) => {
    const date = new Date(item.eventTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });

  return (
    <div className="workspace-canvas">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Activity History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Chronological log of all ingestion and transformation events across your workspaces.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select id="history-status-filter" className="input-field" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Events</option>
            <option value="uploaded">Ingested</option>
            <option value="processing">Processing</option>
            <option value="completed">Transformed</option>
            <option value="error">Failed</option>
          </select>
          <button onClick={load} className="btn-secondary" id="history-refresh-btn" style={{ gap: '7px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading history…</p>
        </div>
      ) : error ? (
        <div className="white-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--status-error)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={load} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="white-card" style={{ padding: '60px', textAlign: 'center' }}>
          <HistoryIcon size={40} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No activity yet. Start by creating a workspace and ingesting documents.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={13} />
                {date}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dayItems.length} events)</span>
              </div>
              <div className="white-card" style={{ overflow: 'hidden' }}>
                {dayItems.map((item, i) => {
                  const sm = STATUS_META[item.event] ?? STATUS_META.uploaded;
                  return (
                    <div key={`${item.doc.id}-${item.event}-${i}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < dayItems.length - 1 ? '1px solid var(--border-main)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      {/* Event icon */}
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: sm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sm.color, flexShrink: 0 }}>
                        {sm.icon}
                      </div>
                      {/* File info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <FileText size={13} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.doc.filename}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: sm.color, background: sm.bg, padding: '1px 8px', borderRadius: '99px' }}>
                            {sm.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Folder size={11} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.doc.projectName}</span>
                          <span style={{ color: 'var(--border-medium)' }}>·</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDateTime(item.eventTime)}</span>
                        </div>
                      </div>
                      {/* Time ago */}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {timeAgo(item.eventTime)}
                      </span>
                      {/* Open button */}
                      <button className="btn-icon" title="Open Document" id={`history-open-${item.doc.id}`}
                        onClick={() => navigate(`/document/${item.doc.id}`)} style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
