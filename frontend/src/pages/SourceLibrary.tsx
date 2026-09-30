import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Filter, Folder, ExternalLink,
  RefreshCw, AlertCircle, Clock, CheckCircle2, Loader2, XCircle,
  FileAudio, FileImage, Globe, AlignLeft
} from 'lucide-react';
import { projectsApi, documentsApi } from '../api/client';
import type { Project, DocumentItem } from '../types';

interface DocWithProject extends DocumentItem {
  projectName: string;
  projectId: number;
}

const FILE_TYPE_ICON: Record<string, React.ReactNode> = {
  pdf:  <FileText size={16} color="#E53935" />,
  txt:  <AlignLeft size={16} color="#0284C7" />,
  md:   <AlignLeft size={16} color="#7C3AED" />,
  url:  <Globe size={16} color="#059669" />,
  mp3:  <FileAudio size={16} color="#D97706" />,
  wav:  <FileAudio size={16} color="#D97706" />,
  png:  <FileImage size={16} color="#DB2777" />,
  jpg:  <FileImage size={16} color="#DB2777" />,
};
const fileIcon = (ft: string) => FILE_TYPE_ICON[ft.toLowerCase()] ?? <FileText size={16} color="#64748B" />;

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  uploaded:   { label: 'Uploaded',   cls: 'badge-cyan',    icon: <Clock size={11} /> },
  processing: { label: 'Processing', cls: 'badge-amber',   icon: <Loader2 size={11} /> },
  completed:  { label: 'Completed',  cls: 'badge-emerald', icon: <CheckCircle2 size={11} /> },
  error:      { label: 'Error',      cls: 'badge-rose',    icon: <XCircle size={11} /> },
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const SourceLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectsApi.getAll();
      const projects: Project[] = projRes.data;
      const allDocs: DocWithProject[] = [];
      await Promise.all(
        projects.map(async (p) => {
          try {
            const docRes = await documentsApi.getByProject(p.id);
            docRes.data.forEach((d) =>
              allDocs.push({ ...d, projectName: p.name, projectId: p.id })
            );
          } catch { /* skip */ }
        })
      );
      allDocs.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
      setDocs(allDocs);
    } catch {
      setError('Failed to load source library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const allTypes = useMemo(() =>
    ['all', ...Array.from(new Set(docs.map((d) => d.file_type.toLowerCase())))],
    [docs]
  );
  const filtered = useMemo(() =>
    docs.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.filename.toLowerCase().includes(q) || d.projectName.toLowerCase().includes(q);
      const matchType = filterType === 'all' || d.file_type.toLowerCase() === filterType;
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    }),
    [docs, search, filterType, filterStatus]
  );

  return (
    <div className="workspace-canvas">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Source Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            All ingested documents across every workspace — search, filter and open instantly.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" id="library-refresh-btn" style={{ gap: '7px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="white-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input id="library-search" type="text" className="input-field" placeholder="Search by filename or workspace…"
            value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select id="library-type-filter" className="input-field" value={filterType}
            onChange={(e) => setFilterType(e.target.value)} style={{ width: 'auto' }}>
            {allTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>)}
          </select>
          <select id="library-status-filter" className="input-field" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {docs.length} documents
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading source library…</p>
        </div>
      ) : error ? (
        <div className="white-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--status-error)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={load} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="white-card" style={{ padding: '60px', textAlign: 'center' }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {docs.length === 0 ? 'No documents ingested yet.' : 'No documents match your filters.'}
          </p>
        </div>
      ) : (
        <div className="white-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--bg-secondary)' }}>
                {['File', 'Type', 'Size', 'Workspace', 'Status', 'Ingested', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const sm = STATUS_META[doc.status] ?? STATUS_META.uploaded;
                return (
                  <tr key={doc.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-main)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '280px' }}>
                        <span style={{ flexShrink: 0 }}>{fileIcon(doc.file_type)}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{doc.file_type}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.825rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatBytes(doc.file_size)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        onClick={() => navigate(`/project/${doc.projectId}`)}>
                        <Folder size={13} color="var(--primary)" />
                        <span style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 500 }}>{doc.projectName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className={`badge ${sm.cls}`} style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {sm.icon} {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(doc.created_at)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <button className="btn-icon" title="Open Document" id={`library-open-${doc.id}`}
                        onClick={() => navigate(`/document/${doc.id}`)} style={{ width: '28px', height: '28px' }}>
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
