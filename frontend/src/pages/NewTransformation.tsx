import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, CheckCircle2, FileText, Image as ImageIcon,
  Video, Link2, AlignLeft, BarChart2, FileSpreadsheet,
  Sparkles, ChevronDown, ChevronUp, Download, Play,
  BookOpen, PieChart, Presentation,
  Loader2, AlertCircle, Folder, Plus
} from 'lucide-react';
import { projectsApi, documentsApi, pipelineApi, getExportUrl } from '../api/client';
import type { Project, DocumentItem, TransformationResult } from '../types';

/* Inline Brand SVGs */
const LinkedinIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0 3m1.37 9.74v-8.37H5.1v8.37z" />
  </svg>
);

const TwitterIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* ─── Output Type definitions ─────────────────────────────────── */
interface OutputType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  focusTopic?: string;
  tone?: string;
}

const OUTPUT_TYPES: OutputType[] = [
  { id: 'article',   label: 'Structured Article',  description: 'Well-formatted article with sections',    icon: <FileText size={22} />,       color: '#4F46E5', bg: '#EEF2FF', tone: 'Formal' },
  { id: 'linkedin',  label: 'LinkedIn Post',        description: 'Professional post for LinkedIn',          icon: <LinkedinIcon size={22} />,   color: '#0A66C2', bg: '#EFF6FF', tone: 'Formal' },
  { id: 'twitter',   label: 'Twitter/X Post',       description: 'Short, engaging social media post',       icon: <TwitterIcon size={22} />,    color: '#0F1419', bg: '#F8FAFC', tone: 'Simplified' },
  { id: 'advisory',  label: 'Advisory',             description: 'Structured advisory document',            icon: <BookOpen size={22} />,       color: '#4F46E5', bg: '#EEF2FF', tone: 'Formal' },
  { id: 'infographic', label: 'Infographic',        description: 'Visual infographic with key insights',    icon: <PieChart size={22} />,       color: '#059669', bg: '#F0FDF4', tone: 'Simplified' },
  { id: 'summary',   label: 'Executive Summary',    description: 'Concise summary of key points',           icon: <FileSpreadsheet size={22} />,color: '#7C3AED', bg: '#F5F3FF', tone: 'Formal' },
  { id: 'report',    label: 'Full Report',          description: 'Comprehensive research report',           icon: <BarChart2 size={22} />,      color: '#D97706', bg: '#FFFBEB', tone: 'Academic' },
];

/* ─── Uploaded file item ─────────────────────────────────────── */
interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'uploaded' | 'error';
  docId?: number;
  errorMsg?: string;
}

/* ─── Generated output card ──────────────────────────────────── */
interface GeneratedOutput {
  outputType: OutputType;
  doc: DocumentItem;
  result: TransformationResult | null;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function getContent(result: TransformationResult | null, outputId: string): string {
  if (!result) return '';
  switch (outputId) {
    case 'twitter':
      // Build a tweet-style post from summary
      return result.summary ? result.summary.split('.')[0].slice(0, 280) + '.' : '';
    case 'linkedin':
    case 'article':
    case 'advisory':
    case 'report':
      return result.structured_article || result.summary || '';
    case 'summary':
      return result.summary || '';
    case 'infographic':
      return result.key_facts.map((kf, i) => `• [${kf.category}] ${kf.fact}`).join('\n');
    default:
      return result.summary || '';
  }
}

/* ═══════════════════════════════════════════════════════════════ */
export const NewTransformation: React.FC = () => {
  const navigate = useNavigate();

  /* Project selection */
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  /* File upload */
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [activeInputTab, setActiveInputTab] = useState<'file' | 'url' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Output types */
  const [selectedOutputs, setSelectedOutputs] = useState<Set<string>>(new Set(['summary']));

  /* Instructions & params */
  const [instructions, setInstructions] = useState('');
  const [showParams, setShowParams] = useState(false);
  const [audience, setAudience] = useState('General Public');
  const [tone, setTone] = useState(localStorage.getItem('parivartan_pref_tone') || 'Formal');
  const [language, setLanguage] = useState('English');
  const [detailLevel, setDetailLevel] = useState('Medium');
  const [objective, setObjective] = useState('Informative');

  /* Generation state */
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  /* Load projects */
  useEffect(() => {
    projectsApi.getAll().then((r) => {
      setProjects(r.data);
      if (r.data.length > 0) setSelectedProjectId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  /* Create project inline */
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await projectsApi.create({ name: newProjectName.trim() });
      setProjects((prev) => [...prev, res.data]);
      setSelectedProjectId(res.data.id);
      setNewProjectName('');
      setShowProjectPicker(false);
    } catch { /* ignore */ } finally {
      setCreatingProject(false);
    }
  };

  /* File upload */
  const uploadFile = useCallback(async (file: File) => {
    if (!selectedProjectId) return;
    const uid = `${file.name}-${Date.now()}`;
    setUploadedFiles((prev) => [...prev, { id: uid, file, status: 'uploading' }]);
    try {
      const res = await documentsApi.uploadFile(selectedProjectId, file);
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === uid ? { ...f, status: 'uploaded', docId: res.data.id } : f)
      );
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === uid ? { ...f, status: 'error', errorMsg: 'Upload failed' } : f)
      );
    }
  }, [selectedProjectId]);

  const handleFilesDrop = useCallback((files: FileList) => {
    Array.from(files).forEach(uploadFile);
  }, [uploadFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesDrop(e.dataTransfer.files);
  };

  const removeFile = (uid: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== uid));
  };

  const toggleOutput = (id: string) => {
    setSelectedOutputs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  /* Poll pipeline until complete */
  const waitForPipeline = async (docId: number, maxWait = 180000): Promise<TransformationResult | null> => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      try {
        const status = await pipelineApi.getStatus(docId);
        if (status.data.status === 'completed') {
          const res = await pipelineApi.getResults(docId);
          return res.data;
        }
        if (status.data.status === 'failed') return null;
      } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 2500));
    }
    return null;
  };

  /* Generate */
  const handleGenerate = async () => {
    if (!selectedProjectId) { setGenError('Please select or create a workspace first.'); return; }
    const readyFiles = uploadedFiles.filter((f) => f.status === 'uploaded' && f.docId);
    if (readyFiles.length === 0 && !urlInput.trim() && !textInput.trim()) {
      setGenError('Please upload at least one source file, URL, or text.');
      return;
    }
    setGenError(null);
    setIsGenerating(true);
    setGeneratedOutputs([]);

    try {
      let docIds: number[] = readyFiles.map((f) => f.docId!);

      // Ingest URL if provided
      if (urlInput.trim()) {
        try {
          const res = await documentsApi.ingestUrl({ project_id: selectedProjectId, url: urlInput.trim() });
          docIds.push(res.data.id);
        } catch { /* skip */ }
      }

      // Ingest text if provided
      if (textInput.trim()) {
        try {
          const res = await documentsApi.ingestText({ project_id: selectedProjectId, title: 'Text Input', content: textInput.trim() });
          docIds.push(res.data.id);
        } catch { /* skip */ }
      }

      if (docIds.length === 0) { setGenError('No valid documents to process.'); return; }

      // Run pipeline on all docs for all selected output types
      const outputs: GeneratedOutput[] = [];
      const selectedOutputList = OUTPUT_TYPES.filter((o) => selectedOutputs.has(o.id));

      for (const docId of docIds) {
        for (const outputType of selectedOutputList) {
          try {
            // Run pipeline with type-specific params
            await pipelineApi.run(docId, {
              focus_topic: instructions || outputType.label,
              target_audience: audience,
              output_tone: tone,
            });

            const result = await waitForPipeline(docId);
            const docRes = await documentsApi.getById(docId);

            outputs.push({ outputType, doc: docRes.data, result });
          } catch (err) {
            console.error(`Pipeline failed for doc ${docId}, output ${outputType.id}:`, err);
          }
        }
        // Only run once per doc (first selected output type handles the pipeline)
        break;
      }

      setGeneratedOutputs(outputs);
    } catch (err) {
      setGenError('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─── FILE TYPE ICONS ─────────────────────────────────── */
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return <ImageIcon size={16} color="#DB2777" />;
    if (['mp4','mov','avi','webm'].includes(ext)) return <Video size={16} color="#D97706" />;
    if (['pdf'].includes(ext)) return <FileText size={16} color="#E53935" />;
    return <FileText size={16} color="#4F46E5" />;
  };

  const uploadedCount = uploadedFiles.filter((f) => f.status === 'uploaded').length;

  return (
    <div className="workspace-canvas" style={{ maxWidth: '1200px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            New content transformation
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Turn your documents, data and ideas into high-impact content using AI.
          </p>
        </div>

        {/* Workspace Picker */}
        <div style={{ position: 'relative' }}>
          <button
            id="transform-project-picker-btn"
            onClick={() => setShowProjectPicker(!showProjectPicker)}
            className="btn-secondary"
            style={{ gap: '8px', minWidth: '180px', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Folder size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedProject?.name ?? 'Select Workspace'}
              </span>
            </div>
            <ChevronDown size={14} />
          </button>
          {showProjectPicker && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
              background: '#fff', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)', minWidth: '220px', overflow: 'hidden'
            }}>
              {projects.map((p) => (
                <button key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setShowProjectPicker(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                    fontSize: '0.875rem', color: p.id === selectedProjectId ? 'var(--primary)' : 'var(--text-primary)',
                    background: p.id === selectedProjectId ? 'var(--primary-light)' : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (p.id !== selectedProjectId) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { if (p.id !== selectedProjectId) e.currentTarget.style.background = 'transparent'; }}
                >
                  {p.name}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border-main)', padding: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="input-field" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New workspace…" style={{ fontSize: '0.8rem', padding: '7px 10px', flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
                    id="transform-new-project-input"
                  />
                  <button className="btn-primary" onClick={handleCreateProject} disabled={creatingProject}
                    style={{ padding: '7px 10px' }} id="transform-create-project-btn">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-Column Main Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* ══ LEFT: Source Content ══ */}
        <div className="white-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Source content</span>
            {uploadedCount > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {uploadedCount} file{uploadedCount > 1 ? 's' : ''} uploaded
              </span>
            )}
          </div>

          {/* Input type tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-main)' }}>
            {([
              { id: 'file' as const, label: 'File Upload', icon: <Upload size={13} /> },
              { id: 'url'  as const, label: 'URL',         icon: <Link2 size={13} /> },
              { id: 'text' as const, label: 'Text',        icon: <AlignLeft size={13} /> },
            ] as const).map((t) => (
              <button key={t.id} id={`transform-input-tab-${t.id}`} onClick={() => setActiveInputTab(t.id)}
                style={{
                  flex: 1, padding: '10px 8px', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  border: 'none', borderBottom: activeInputTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeInputTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                  background: 'transparent', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px 20px' }}>
            {/* File drop zone */}
            {activeInputTab === 'file' && (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  id="transform-drop-zone"
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-lg)', padding: '32px 20px', textAlign: 'center',
                    cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                    background: isDragging ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s', marginBottom: '14px',
                    opacity: selectedProjectId ? 1 : 0.6,
                  }}
                >
                  <div style={{ width: '44px', height: '44px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--primary)' }}>
                    <Upload size={20} />
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.95rem' }}>
                    Drop files or paste text
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {selectedProjectId ? 'Upload documents, add links, or paste your content here' : 'Select a workspace above first'}
                  </div>
                  <input ref={fileInputRef} type="file" multiple hidden
                    onChange={(e) => e.target.files && handleFilesDrop(e.target.files)} />
                </div>

                {/* File type pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {[
                    { label: 'Text', icon: <AlignLeft size={12} /> },
                    { label: 'Document', icon: <FileText size={12} /> },
                    { label: 'Article', icon: <BookOpen size={12} /> },
                    { label: 'Report', icon: <BarChart2 size={12} /> },
                    { label: 'Image', icon: <ImageIcon size={12} /> },
                    { label: 'Video', icon: <Video size={12} /> },
                  ].map((pill) => (
                    <button key={pill.label}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 500 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary-border)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-main)'; }}
                    >
                      {pill.icon} {pill.label}
                    </button>
                  ))}
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {uploadedFiles.map((uf) => (
                      <div key={uf.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-main)' }}>
                        {getFileIcon(uf.file.name)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uf.file.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatBytes(uf.file.size)} ·{' '}
                            {uf.status === 'uploading' ? 'Uploading…' : uf.status === 'uploaded' ? 'Uploaded' : uf.errorMsg}
                          </div>
                        </div>
                        {uf.status === 'uploading' && <Loader2 size={15} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                        {uf.status === 'uploaded' && <CheckCircle2 size={16} color="var(--status-success)" style={{ flexShrink: 0 }} />}
                        {uf.status === 'error' && <AlertCircle size={16} color="var(--status-error)" style={{ flexShrink: 0 }} />}
                        <button onClick={() => removeFile(uf.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px', borderRadius: '4px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-error)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* URL input */}
            {activeInputTab === 'url' && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <Link2 size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="transform-url-input" type="url" className="input-field"
                    placeholder="https://example.com/article-or-report"
                    value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    style={{ paddingLeft: '36px' }} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '7px' }}>
                  Enter a URL to a public article, PDF, or report page.
                </p>
              </div>
            )}

            {/* Text input */}
            {activeInputTab === 'text' && (
              <div style={{ marginBottom: '14px' }}>
                <textarea id="transform-text-input" className="input-field" rows={6}
                  placeholder="Paste your content here — news articles, research excerpts, meeting notes…"
                  value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
            )}

            {/* Additional instructions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Additional instructions (optional)
              </label>
              <textarea id="transform-instructions-input" className="input-field" rows={2}
                placeholder="e.g. Focus on key insights, keep it concise, highlight benefits for stakeholders…"
                value={instructions} onChange={(e) => setInstructions(e.target.value)}
                style={{ resize: 'none', fontSize: '0.85rem' }} />
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Output Types ══ */}
        <div className="white-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Select output type(s)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Choose the types of content you want to generate
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {OUTPUT_TYPES.map((ot) => {
                const selected = selectedOutputs.has(ot.id);
                return (
                  <button
                    key={ot.id}
                    id={`transform-output-${ot.id}`}
                    onClick={() => toggleOutput(ot.id)}
                    style={{
                      position: 'relative', padding: '16px 12px',
                      borderRadius: 'var(--radius-md)', textAlign: 'left',
                      border: selected ? `2px solid ${ot.color}` : '2px solid var(--border-main)',
                      background: selected ? ot.bg : '#fff',
                      cursor: 'pointer', transition: 'all 0.18s',
                      boxShadow: selected ? `0 0 0 3px ${ot.color}20` : 'none',
                    }}
                    onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = ot.color; e.currentTarget.style.background = ot.bg; } }}
                    onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.background = '#fff'; } }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: selected ? ot.color : 'transparent',
                      border: selected ? `2px solid ${ot.color}` : '2px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <CheckCircle2 size={11} color="#fff" />}
                    </div>

                    <div style={{ color: selected ? ot.color : 'var(--text-secondary)', marginBottom: '8px' }}>
                      {ot.icon}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: selected ? ot.color : 'var(--text-primary)', marginBottom: '3px' }}>
                      {ot.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {ot.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Generation Parameters (Collapsible) ── */}
      <div className="white-card" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <button
          id="transform-params-toggle"
          onClick={() => setShowParams(!showParams)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '14px 20px', background: 'transparent', border: 'none',
            cursor: 'pointer', borderBottom: showParams ? '1px solid var(--border-main)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[0,1,2].map((i) => <div key={i} style={{ width: '14px', height: '2px', background: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--primary)' : 'var(--border-medium)', borderRadius: '99px' }} />)}
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>Generation parameters</span>
          </div>
          {showParams ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </button>

        {showParams && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
              {[
                { label: 'Audience', id: 'audience', value: audience, setter: setAudience, options: ['General Public', 'Government Officials', 'Researchers', 'Students', 'Media / Journalists', 'Technical Engineers'] },
                { label: 'Tone', id: 'tone', value: tone, setter: setTone, options: ['Formal', 'Simplified', 'Neutral', 'Persuasive', 'Academic', 'Conversational'] },
                { label: 'Language', id: 'language', value: language, setter: setLanguage, options: ['English', 'Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati'] },
                { label: 'Detail level', id: 'detail', value: detailLevel, setter: setDetailLevel, options: ['Brief', 'Medium', 'Detailed', 'Comprehensive'] },
                { label: 'Objective/Style', id: 'objective', value: objective, setter: setObjective, options: ['Informative', 'Persuasive', 'Educational', 'Summary', 'Analytical'] },
              ].map((field) => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>{field.label}</label>
                  <select id={`transform-param-${field.id}`} className="input-field" value={field.value}
                    onChange={(e) => field.setter(e.target.value)} style={{ fontSize: '0.85rem' }}>
                    {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}

              {/* Generate button */}
              <div>
                <button
                  id="transform-generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary"
                  style={{ width: '100%', padding: '11px 18px', gap: '8px', fontSize: '0.95rem', fontWeight: 700, justifyContent: 'center' }}
                >
                  {isGenerating
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : <><Sparkles size={16} /> Generate</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {!showParams && (
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
              {[audience, tone, language, detailLevel, objective].map((v, i) => (
                <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-main)' }}>{v}</span>
              ))}
            </div>
            <button
              id="transform-generate-btn-inline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary"
              style={{ gap: '8px', fontSize: '0.925rem', fontWeight: 700, padding: '10px 24px' }}
            >
              {isGenerating
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Sparkles size={15} /> Generate</>}
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {genError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px', color: 'var(--status-error)', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {genError}
        </div>
      )}

      {/* ── Generated Outputs ── */}
      {(isGenerating || generatedOutputs.length > 0) && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Generated outputs
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isGenerating ? 'Running AI pipeline… this may take a minute.' : 'Your AI-generated content is ready. Preview, edit or download.'}
            </div>
          </div>

          {isGenerating ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {Array.from(selectedOutputs).map((id) => {
                const ot = OUTPUT_TYPES.find((o) => o.id === id)!;
                return (
                  <div key={id} className="white-card" style={{ padding: '20px', minHeight: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: ot.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ot.color }}>{ot.icon}</div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{ot.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Processing pipeline…
                    </div>
                    <div style={{ marginTop: '12px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '60%', background: ot.color, borderRadius: '99px', animation: 'progressPulse 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {generatedOutputs.map((out, idx) => {
                const content = getContent(out.result, out.outputType.id);
                const hasResult = Boolean(out.result);
                return (
                  <div key={idx} className="white-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Card Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: out.outputType.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: out.outputType.color }}>
                          {out.outputType.icon}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{out.outputType.label}</span>
                      </div>
                      {hasResult && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-success)', background: 'var(--status-success-bg)', padding: '3px 8px', borderRadius: '99px' }}>
                          <CheckCircle2 size={11} /> Cited sources
                        </span>
                      )}
                    </div>

                    {/* Preview */}
                    <div style={{ padding: '14px 16px', flex: 1 }}>
                      {hasResult ? (
                        <>
                          {out.outputType.id === 'infographic' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                              {out.result!.key_facts.slice(0, 4).map((kf, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem', flexShrink: 0 }}>{kf.category}</span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{kf.fact}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                              {content.slice(0, 180)}{content.length > 180 ? '…' : ''}
                            </p>
                          )}
                          {out.result!.citations.length > 0 && (
                            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {out.result!.citations.length} citation{out.result!.citations.length > 1 ? 's' : ''} verified
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-error)', fontSize: '0.85rem' }}>
                          <AlertCircle size={14} /> Pipeline failed for this output.
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-main)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" id={`output-view-${idx}`}
                        onClick={() => navigate(`/document/${out.doc.id}`)}
                        style={{ fontSize: '0.8rem', gap: '5px', padding: '7px 12px' }}>
                        <Play size={12} /> Full View
                      </button>
                      {hasResult && (
                        <a href={`${getExportUrl(out.doc.id, 'markdown')}`} download style={{ textDecoration: 'none' }}>
                          <button className="btn-primary" id={`output-download-${idx}`}
                            style={{ fontSize: '0.8rem', gap: '5px', padding: '7px 12px' }}>
                            <Download size={12} /> Download
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressPulse {
          0%, 100% { opacity: 1; width: 30%; }
          50% { opacity: 0.7; width: 75%; }
        }
      `}</style>
    </div>
  );
};
