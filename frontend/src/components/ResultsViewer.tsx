import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  FileText, HelpCircle, Award, ShieldCheck, Download, Copy, 
  Check, ExternalLink, Bookmark, Clock, Hash, Sparkles
} from 'lucide-react';
import type { TransformationResult, CitationItem } from '../types';
import { getExportUrl } from '../api/client';

interface ResultsViewerProps {
  documentId: number;
  documentTitle?: string;
  results: TransformationResult;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  documentId,
  results,
}) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'article' | 'qa' | 'facts' | 'citations' | 'export'>('synthesis');
  const [copied, setCopied] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  const meta = results.extracted_metadata || {};

  const handleCopy = () => {
    const textToCopy = `${results.summary}\n\n${results.structured_article}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'markdown' | 'html' | 'json' | 'docx') => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4F46E5', '#7C3AED', '#0284C7']
    });
    const url = getExportUrl(documentId, format);
    window.open(url, '_blank');
  };

  // Helper to render citation references in article with interactive click
  const renderFormattedArticle = (articleText: string) => {
    if (!articleText) return null;
    const parts = articleText.split(/(\[\d+\])/g);

    return (
      <div style={{ lineHeight: 1.8, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
        {parts.map((part, index) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
            const citeNum = parseInt(match[1], 10);
            const foundCitation = results.citations.find(c => c.index === citeNum);
            return (
              <span
                key={index}
                className="citation-pill"
                onClick={() => {
                  if (foundCitation) {
                    setSelectedCitation(foundCitation);
                    setActiveTab('citations');
                  }
                }}
                title={foundCitation ? `Citation [${citeNum}] from ${foundCitation.location}: "${foundCitation.source_quote}"` : `Citation [${citeNum}]`}
              >
                [{citeNum}]
              </span>
            );
          }

          // Check if markdown headers
          if (part.startsWith('# ')) {
            return (
              <h1 key={index} style={{
                fontSize: '1.45rem',
                marginTop: '22px',
                marginBottom: '12px',
                color: 'var(--text-primary)',
                fontWeight: 700
              }}>
                {part.replace('# ', '')}
              </h1>
            );
          }
          if (part.startsWith('## ')) {
            return (
              <h2 key={index} style={{
                fontSize: '1.2rem',
                marginTop: '18px',
                marginBottom: '10px',
                color: 'var(--primary)',
                fontWeight: 600
              }}>
                {part.replace('## ', '')}
              </h2>
            );
          }
          if (part.startsWith('### ')) {
            return (
              <h3 key={index} style={{
                fontSize: '1.05rem',
                marginTop: '14px',
                marginBottom: '8px',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}>
                {part.replace('### ', '')}
              </h3>
            );
          }
          if (part.startsWith('> ')) {
            return (
              <blockquote key={index} style={{
                borderLeft: '4px solid var(--primary)',
                background: 'var(--primary-light)',
                padding: '12px 18px',
                borderRadius: '0 8px 8px 0',
                margin: '16px 0',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                fontSize: '0.9rem'
              }}>
                {part.replace('> ', '')}
              </blockquote>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="white-card" style={{ padding: '24px', marginTop: '8px' }}>
      {/* Metrics Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-main)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <Hash size={15} color="var(--primary)" />
            <span>Words Extracted: <strong style={{ color: 'var(--text-primary)' }}>{meta.word_count || 380}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <Clock size={15} color="var(--accent-cyan)" />
            <span>Reading Time: <strong style={{ color: 'var(--text-primary)' }}>{meta.reading_time_min || 2} min</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={15} color="var(--status-success)" />
            <span>Verified Citations: <strong style={{ color: 'var(--text-primary)' }}>{results.citations.length}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            id="copy-results-btn"
            style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
          >
            {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
            {copied ? 'Copied Brief!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className="btn-primary"
            id="open-export-tab-btn"
            style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
          >
            <Download size={14} /> Export Hub
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid var(--border-main)',
        paddingBottom: '12px',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        {[
          { key: 'synthesis', label: 'Executive Synthesis', icon: Sparkles },
          { key: 'article', label: 'Structured Article', icon: FileText },
          { key: 'qa', label: `Verified Q&A (${results.qa_pairs.length})`, icon: HelpCircle },
          { key: 'facts', label: `Key Facts (${results.key_facts.length})`, icon: Award },
          { key: 'citations', label: `Citations Audit (${results.citations.length})`, icon: ShieldCheck },
          { key: 'export', label: 'Export Downloads', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              id={`tab-results-${tab.key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: isAct ? 'var(--primary-light)' : 'transparent',
                color: isAct ? 'var(--primary)' : 'var(--text-secondary)',
                border: isAct ? '1px solid var(--primary-border)' : '1px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE SYNTHESIS */}
      {activeTab === 'synthesis' && (
        <div className="animate-fade-in">
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '22px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '1.05rem',
              marginBottom: '14px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}>
              <Bookmark size={17} color="var(--primary)" />
              Executive Strategic Overview
            </h4>
            <div style={{ fontSize: '0.925rem', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {results.summary}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED ARTICLE */}
      {activeTab === 'article' && (
        <div className="animate-fade-in" style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)'
        }}>
          {renderFormattedArticle(results.structured_article || '')}
        </div>
      )}

      {/* TAB 3: VERIFIED Q&A MATRIX */}
      {activeTab === 'qa' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.qa_pairs.map((qa, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <h5 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <HelpCircle size={15} color="var(--primary)" />
                  {qa.question}
                </h5>
                <span className="badge badge-emerald" style={{ flexShrink: 0 }}>
                  {Math.round(qa.confidence * 100)}% Confidence
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {qa.answer}
              </p>
              {qa.citation_id && (
                <div style={{ marginTop: '10px' }}>
                  <span
                    className="citation-pill"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => {
                      const c = results.citations.find(item => item.id === qa.citation_id);
                      if (c) {
                        setSelectedCitation(c);
                        setActiveTab('citations');
                      }
                    }}
                  >
                    View Source Anchor ({qa.citation_id})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: KEY FACTS & ENTITIES */}
      {activeTab === 'facts' && (
        <div className="animate-fade-in" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {results.key_facts.map((fact, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-indigo">{fact.category}</span>
                {fact.source_ref && (
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{fact.source_ref}</span>
                )}
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6, fontWeight: 500 }}>
                {fact.fact}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CITATIONS AUDIT & INSPECTOR */}
      {activeTab === 'citations' && (
        <div className="animate-fade-in">
          {selectedCitation && (
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-indigo">
                  Selected Citation [{selectedCitation.index}] — {selectedCitation.location}
                </span>
                <span className="badge badge-emerald">
                  {Math.round(selectedCitation.confidence * 100)}% Match Confidence
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Generated Claim:</strong> {selectedCitation.claim}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                background: '#FFFFFF',
                border: '1px solid var(--primary-border)',
                padding: '10px 14px',
                borderRadius: '6px'
              }}>
                <strong>Source Evidence:</strong> &ldquo;{selectedCitation.source_quote}&rdquo;
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.citations.map((cite) => {
              const isSelected = selectedCitation?.id === cite.id;
              return (
                <div
                  key={cite.id}
                  onClick={() => setSelectedCitation(cite)}
                  style={{
                    background: isSelected ? 'var(--primary-light)' : '#FFFFFF',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="citation-pill">
                        [{cite.index}]
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{cite.location}</strong>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      {Math.round(cite.confidence * 100)}% Verified
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Claim:</span> {cite.claim}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>
                    &ldquo;{cite.source_quote}&rdquo;
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: EXPORT CENTER */}
      {activeTab === 'export' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Publish & Download Center
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Export the transformed synthesis in your preferred enterprise or academic format.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px'
          }}>
            {/* Markdown */}
            <div className="white-card" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <FileText size={20} />
              </div>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '3px', fontWeight: 600 }}>Markdown (.md)</h5>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Clean GitHub-flavored markdown with citation index
              </p>
              <button
                onClick={() => handleDownload('markdown')}
                className="btn-secondary"
                id="export-md-btn"
                style={{ width: '100%', fontSize: '0.8rem', padding: '7px' }}
              >
                <Download size={13} /> Download .md
              </button>
            </div>

            {/* Standalone HTML */}
            <div className="white-card" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#F0F9FF',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <ExternalLink size={20} />
              </div>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '3px', fontWeight: 600 }}>Standalone HTML (.html)</h5>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Self-contained styled document ready for web distribution
              </p>
              <button
                onClick={() => handleDownload('html')}
                className="btn-secondary"
                id="export-html-btn"
                style={{ width: '100%', fontSize: '0.8rem', padding: '7px' }}
              >
                <Download size={13} /> Download .html
              </button>
            </div>

            {/* Word DOCX */}
            <div className="white-card" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--status-success-bg)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <Bookmark size={20} />
              </div>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '3px', fontWeight: 600 }}>Microsoft Word (.docx)</h5>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Formatted docx with tables, headers & footnotes
              </p>
              <button
                onClick={() => handleDownload('docx')}
                className="btn-secondary"
                id="export-docx-btn"
                style={{ width: '100%', fontSize: '0.8rem', padding: '7px' }}
              >
                <Download size={13} /> Download .docx
              </button>
            </div>

            {/* JSON Schema */}
            <div className="white-card" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#F5F3FF',
                color: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <Hash size={20} />
              </div>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '3px', fontWeight: 600 }}>Raw JSON (.json)</h5>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Full programmatic schema with raw tokens & citations
              </p>
              <button
                onClick={() => handleDownload('json')}
                className="btn-secondary"
                id="export-json-btn"
                style={{ width: '100%', fontSize: '0.8rem', padding: '7px' }}
              >
                <Download size={13} /> Download .json
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
