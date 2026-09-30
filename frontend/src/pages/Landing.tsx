import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, ArrowRight, Zap, 
  FileSearch, Link2, Layers
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [activeSample, setActiveSample] = useState<'gov' | 'tech' | 'health'>('gov');

  const handleLaunch = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      await quickDemoLogin();
      navigate('/dashboard');
    }
  };

  const samples = {
    gov: {
      title: 'Digital India 2026: AI Governance & Scalability',
      rawExcerpt: 'The National AI Mission aims to deploy localized linguistic models across all 28 states. Early metrics indicate 42% acceleration in public service resolution and 99.4% factual traceability...',
      synthesized: 'Executive Briefing: India’s National AI Mission establishes an authoritative framework for deploying localized multimodal intelligence across governance sectors, accelerating citizen turnaround by 42% [1].',
      citation: 'Page 3, Paragraph 2 — Verified against official ministry whitepaper (98% confidence)'
    },
    tech: {
      title: 'Autonomous System Safety & Audit Framework',
      rawExcerpt: 'Multi-agent orchestration architectures require deterministic fallback layers and audit logs. Benchmarks across 10,000 runs show zero critical failures when back-referenced against verified specifications...',
      synthesized: 'Technical Synthesis: Autonomous orchestration protocols achieve zero critical failures through deterministic fallback execution and real-time citation validation matrices [1].',
      citation: 'Section 4.1, Table 2 — Source validated via benchmark telemetry (99% confidence)'
    },
    health: {
      title: 'Multimodal Diagnostics & Clinical Informatics',
      rawExcerpt: 'Analysis of 1,200 clinical transcripts and imaging reports demonstrated that cross-modal alignment reduces diagnostic transcription latency by 58% while maintaining HIPAA compliance standards...',
      synthesized: 'Clinical Summary: Cross-modal diagnostic alignment significantly reduces report generation latency by 58% while enforcing verifiable data traceability [1].',
      citation: 'Page 12, Findings — Extracted from peer-reviewed clinical dataset (97% confidence)'
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '70px 24px 60px 24px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '550px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.04) 40%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top Badge */}
          <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
            <div className="badge badge-indigo" style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '8px' }}>
              <Sparkles size={14} color="var(--primary)" />
              <span>Smart India Hackathon 2026 Innovation</span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            lineHeight: 1.15,
            marginBottom: '20px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)'
          }}>
            Transform Unstructured Noise into <br />
            <span style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0284C7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Fact-Checked, Publishable Intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            maxWidth: '780px',
            margin: '0 auto 32px auto',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Parivartan.ai is an advanced multimodal transformation platform that ingests PDFs, DOCX, audio transcripts,
            OCR visuals, and URLs — producing structured executive briefs, verified Q&A, and citation-anchored publications.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
            <button
              onClick={handleLaunch}
              className="btn-primary"
              id="hero-launch-btn"
              style={{ fontSize: '0.95rem', padding: '12px 26px', gap: '8px' }}
            >
              Launch Platform Now
              <ArrowRight size={17} />
            </button>
            <button
              onClick={handleLaunch}
              className="btn-secondary"
              id="hero-demo-btn"
              style={{ fontSize: '0.95rem', padding: '12px 24px', gap: '8px' }}
            >
              <Zap size={17} color="var(--accent-amber)" />
              Instant Live Demo
            </button>
          </div>

          {/* Metric Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '36px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-main)',
            paddingTop: '26px'
          }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>100%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Citation Traceability</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>5-Stage</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Automated Pipeline</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-success)', fontFamily: 'var(--font-display)' }}>6 Formats</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>PDF · DOCX · Audio · Web · Img · Text</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>Zero</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hallucinated Claims</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Transformation Sandbox Preview */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto 70px auto',
        padding: '0 24px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '10px' }}>Interactive Sandbox</span>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
            Experience Multimodal Synthesis in Action
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Click sample source materials below to watch how Parivartan parses raw text and links back verifiable citations.
          </p>
        </div>

        {/* Sample Selectors */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'gov', label: 'Government AI Policy' },
            { key: 'tech', label: 'Technical System Audit' },
            { key: 'health', label: 'Clinical Informatics' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSample(s.key as any)}
              className={activeSample === s.key ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Split Sandbox Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {/* Unstructured Source Input */}
          <div className="white-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileSearch size={16} color="var(--text-secondary)" />
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ingested Raw Material</h4>
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 600 }}>
              {samples[activeSample].title}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-main)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              lineHeight: 1.6
            }}>
              &ldquo;{samples[activeSample].rawExcerpt}&rdquo;
            </p>
          </div>

          {/* Citation-Linked Output */}
          <div className="white-card" style={{ padding: '24px', border: '1px solid var(--primary-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>Parivartan.ai Verified Synthesis</h4>
              </div>
              <span className="badge badge-emerald">Verified [1]</span>
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '16px' }}>
              {samples[activeSample].synthesized}
            </div>
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.785rem',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}>
              <Link2 size={15} color="var(--primary)" />
              <span>{samples[activeSample].citation}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Architecture Flow */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 70px auto', padding: '0 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge badge-indigo" style={{ marginBottom: '10px' }}>System Architecture</span>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
            The 5-Stage Transformation Pipeline
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Engineered from ground up for complete factual transparency and zero hallucination.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          {[
            { step: '01', title: 'Multimodal Ingest', desc: 'Parses PDFs, DOCX, OCR visuals, audio recordings, and live web URLs.' },
            { step: '02', title: 'Semantic Preprocess', desc: 'Normalized tokenization, chunk boundary detection, and metadata indexing.' },
            { step: '03', title: 'Neural Synthesis', desc: 'Generates structured articles, executive briefings, and validated Q&A matrices.' },
            { step: '04', title: 'Citation Linking', desc: 'Cross-verifies generated claims against raw source sentences with confidence scores.' },
            { step: '05', title: 'Export Ready', desc: 'Produces downloadable Markdown, Word (.docx), Standalone HTML, and JSON.' },
          ].map((item) => (
            <div key={item.step} className="white-card" style={{ padding: '22px 18px', position: 'relative' }}>
              <div style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--primary)',
                marginBottom: '8px'
              }}>
                {item.step}
              </div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 600 }}>{item.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Light Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-main)',
        padding: '24px',
        textAlign: 'center',
        background: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Layers size={14} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Parivartan.ai</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SIH 2026 Multimodal Platform</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Built with FastAPI, React, and Gemini AI · 100% Verifiable Citations
          </div>
        </div>
      </footer>
    </div>
  );
};
