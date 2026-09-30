import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, Image as ImageIcon, Music, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { documentsApi } from '../api/client';
import type { DocumentItem } from '../types';

interface UploadDropzoneProps {
  projectId: number;
  onDocumentAdded: (doc: DocumentItem) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ projectId, onDocumentAdded }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await documentsApi.uploadFile(projectId, file);
      setSuccessMsg(`"${file.name}" uploaded successfully! Ready for transformation.`);
      onDocumentAdded(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await documentsApi.ingestUrl({
        project_id: projectId,
        url: urlInput.trim(),
        custom_title: urlTitle.trim() || undefined,
      });
      setSuccessMsg(`Web content from "${urlInput}" extracted and queued.`);
      setUrlInput('');
      setUrlTitle('');
      onDocumentAdded(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to scrape URL. Ensure it is publicly accessible.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() || !textTitle.trim()) return;
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await documentsApi.ingestText({
        project_id: projectId,
        title: textTitle.trim(),
        content: textContent.trim(),
      });
      setSuccessMsg(`Pasted material "${textTitle}" recorded.`);
      setTextTitle('');
      setTextContent('');
      onDocumentAdded(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to process text input.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="white-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-main)',
        paddingBottom: '14px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('file')}
          id="tab-file-upload"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: activeTab === 'file' ? 'var(--primary-light)' : 'transparent',
            color: activeTab === 'file' ? 'var(--primary)' : 'var(--text-secondary)',
            border: activeTab === 'file' ? '1px solid var(--primary-border)' : '1px solid transparent',
            transition: 'all var(--transition-fast)'
          }}
        >
          <UploadCloud size={16} /> Multimodal File Upload
        </button>

        <button
          onClick={() => setActiveTab('url')}
          id="tab-url-scrape"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: activeTab === 'url' ? 'var(--primary-light)' : 'transparent',
            color: activeTab === 'url' ? 'var(--primary)' : 'var(--text-secondary)',
            border: activeTab === 'url' ? '1px solid var(--primary-border)' : '1px solid transparent',
            transition: 'all var(--transition-fast)'
          }}
        >
          <LinkIcon size={15} /> Web Article / URL
        </button>

        <button
          onClick={() => setActiveTab('text')}
          id="tab-text-paste"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: activeTab === 'text' ? 'var(--primary-light)' : 'transparent',
            color: activeTab === 'text' ? 'var(--primary)' : 'var(--text-secondary)',
            border: activeTab === 'text' ? '1px solid var(--primary-border)' : '1px solid transparent',
            transition: 'all var(--transition-fast)'
          }}
        >
          <FileText size={15} /> Direct Text Paste
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'file' && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="dropzone-area"
            style={{
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'var(--primary-light)' : 'var(--bg-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.mp3,.wav"
            />

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              border: '1px solid var(--border-main)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
              ) : (
                <UploadCloud size={24} color="var(--primary)" />
              )}
            </div>

            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 600 }}>
              {isUploading ? 'Extracting multimodal tokens...' : 'Drag & drop source materials here, or browse'}
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Supports PDFs, DOCX research briefs, Images (OCR), Audio briefings (STT), & Plain Text
            </p>

            {/* Badges of formats */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-indigo"><FileText size={12} /> PDF & DOCX</span>
              <span className="badge badge-purple"><ImageIcon size={12} /> OCR Visuals</span>
              <span className="badge badge-amber"><Music size={12} /> Audio Transcripts</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Scrape */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }}>
              Source Web Address (URL)
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://example.com/research-paper-or-article"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              required
              id="url-input-field"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }}>
              Optional Document Label
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. National Clean Energy Whitepaper 2026"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              id="url-title-field"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isUploading}
            id="url-submit-btn"
            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
          >
            {isUploading ? <Loader2 size={15} className="animate-spin" /> : <LinkIcon size={15} />}
            Scrape & Ingest URL
          </button>
        </form>
      )}

      {/* Tab 3: Text Paste */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }}>
              Document Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Executive Interview Transcript or Policy Draft"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              required
              id="text-title-field"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }}>
              Raw Unstructured Content
            </label>
            <textarea
              className="input-field"
              rows={6}
              placeholder="Paste raw text, transcript excerpts, or technical tables here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              required
              id="text-content-field"
              style={{ resize: 'vertical' }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isUploading}
            id="text-submit-btn"
            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
          >
            {isUploading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            Ingest Raw Content
          </button>
        </form>
      )}

      {/* Success / Error Banners */}
      {errorMsg && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--status-error-bg)',
          border: '1px solid var(--status-error-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--status-error)',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--status-success-bg)',
          border: '1px solid var(--status-success-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--status-success)',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
