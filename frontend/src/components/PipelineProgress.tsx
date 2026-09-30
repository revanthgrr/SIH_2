import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle2, Clock, Terminal, ChevronDown, ChevronUp, 
  Cpu, FileSearch, Sparkles, Link2, Download, AlertTriangle
} from 'lucide-react';
import { pipelineApi } from '../api/client';
import type { PipelineJob, PipelineLog } from '../types';

interface PipelineProgressProps {
  documentId: number;
  documentTitle: string;
  onCompleted?: () => void;
}

const STAGES = [
  { key: 'Stage 1', title: 'Multimodal Ingest', icon: FileSearch, desc: 'OCR, PDF, audio and web DOM parsing' },
  { key: 'Stage 2', title: 'Preprocessing', icon: Cpu, desc: 'Structural chunking & token normalization' },
  { key: 'Stage 3', title: 'Neural Synthesis', icon: Sparkles, desc: 'Executive briefing, article & Q&A formulation' },
  { key: 'Stage 4', title: 'Citation Linking', icon: Link2, desc: 'Source claim mapping & factual confidence audit' },
  { key: 'Stage 5', title: 'Export Ready', icon: Download, desc: 'Markdown, HTML, Word & JSON compilation' },
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  documentId,
  documentTitle,
  onCompleted,
}) => {
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [liveLogs, setLiveLogs] = useState<PipelineLog[]>([]);

  // Config options
  const [focusTopic, setFocusTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Executive & Strategic');
  const [outputTone, setOutputTone] = useState('Authoritative & Publishable');

  // Load existing status on mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await pipelineApi.getStatus(documentId);
        if (isMounted) {
          setJob(res.data);
          if (res.data.logs) {
            setLiveLogs(res.data.logs);
          }
          if (res.data.status === 'processing') {
            setIsRunning(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, [documentId]);

  // SSE Real-time subscription
  useEffect(() => {
    if (!isRunning) return;

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/pipeline/${documentId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setJob((prev) => ({
            id: prev?.id || 0,
            document_id: documentId,
            status: data.status || 'processing',
            current_stage: data.stage,
            progress_pct: data.progress_pct,
            logs: prev?.logs || []
          }));

          setLiveLogs((prev) => [
            ...prev,
            { stage: data.stage, pct: data.progress_pct, message: data.message, time: Date.now() }
          ]);
        } else if (data.type === 'completed') {
          setIsRunning(false);
          setJob((prev) => prev ? { ...prev, status: 'completed', progress_pct: 100 } : null);
          eventSource.close();
          if (onCompleted) {
            setTimeout(onCompleted, 600);
          }
        } else if (data.type === 'error') {
          setIsRunning(false);
          setJob((prev) => prev ? { ...prev, status: 'failed', error_message: data.error } : null);
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      // Polling fallback if SSE connection closes
      const interval = setInterval(async () => {
        try {
          const res = await pipelineApi.getStatus(documentId);
          setJob(res.data);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            setIsRunning(false);
            clearInterval(interval);
            if (res.data.status === 'completed' && onCompleted) {
              onCompleted();
            }
          }
        } catch {}
      }, 1500);

      eventSource.close();
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, [isRunning, documentId, onCompleted]);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setLiveLogs([]);
    try {
      const res = await pipelineApi.run(documentId, {
        focus_topic: focusTopic || undefined,
        target_audience: targetAudience,
        output_tone: outputTone,
      });
      setJob(res.data);
    } catch (err) {
      setIsRunning(false);
      console.error('Trigger pipeline failed:', err);
    }
  };

  const currentPct = job?.progress_pct || 0;
  const isCompleted = job?.status === 'completed';

  const getStageStatus = (stageIdx: number) => {
    const stagePctThreshold = (stageIdx + 1) * 20;
    if (currentPct >= stagePctThreshold || isCompleted) return 'completed';
    if (currentPct >= stageIdx * 20 && isRunning) return 'active';
    return 'pending';
  };

  return (
    <div className="white-card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              5-Stage Transformation Cockpit
            </h3>
            {isCompleted ? (
              <span className="badge badge-emerald">Transformation Ready</span>
            ) : isRunning ? (
              <span className="badge badge-indigo">Executing Stages...</span>
            ) : (
              <span className="badge badge-amber">Awaiting Run</span>
            )}
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Target: <strong style={{ color: 'var(--text-primary)' }}>{documentTitle}</strong>
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            className="btn-primary"
            id="start-pipeline-btn"
            style={{ padding: '10px 22px' }}
          >
            {isRunning ? (
              <>
                <Clock size={16} className="animate-spin" />
                Synthesizing ({Math.round(currentPct)}%)...
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                {isCompleted ? 'Re-Run Transformation' : 'Execute Full Pipeline'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Parameters Inset Panel */}
      {!isRunning && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
          marginBottom: '22px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Focus Directive (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              style={{ padding: '7px 12px', fontSize: '0.825rem' }}
              placeholder="e.g. Highlight regulatory compliance"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              id="pipeline-focus-input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Target Audience
            </label>
            <select
              className="input-field"
              style={{ padding: '7px 12px', fontSize: '0.825rem' }}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              id="pipeline-audience-select"
            >
              <option value="Executive & Strategic">Executive & Strategic</option>
              <option value="Technical & Research">Technical & Research</option>
              <option value="Public & General Media">Public & General Media</option>
              <option value="Policy & Legal Auditors">Policy & Legal Auditors</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Output Tone
            </label>
            <select
              className="input-field"
              style={{ padding: '7px 12px', fontSize: '0.825rem' }}
              value={outputTone}
              onChange={(e) => setOutputTone(e.target.value)}
              id="pipeline-tone-select"
            >
              <option value="Authoritative & Publishable">Authoritative & Publishable</option>
              <option value="Analytical & Objective">Analytical & Objective</option>
              <option value="Concise & Bulleted">Concise & Bulleted</option>
            </select>
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: '6px',
          fontWeight: 500
        }}>
          <span>Overall Pipeline Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{Math.round(currentPct)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: `${currentPct}%`,
            height: '100%',
            background: 'var(--grad-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease-out'
          }} />
        </div>
      </div>

      {/* 5-Stage Stepper Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {STAGES.map((s, idx) => {
          const status = getStageStatus(idx);
          const Icon = s.icon;
          const isAct = status === 'active';
          const isDone = status === 'completed';

          return (
            <div
              key={s.key}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: isAct ? 'var(--primary-light)' : isDone ? 'var(--status-success-bg)' : '#FFFFFF',
                border: isAct ? '1px solid var(--primary)' : isDone ? '1px solid var(--status-success-border)' : '1px solid var(--border-main)',
                boxShadow: isAct ? '0 0 0 1px rgba(79, 70, 229, 0.2)' : 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  background: isAct ? 'var(--primary)' : isDone ? 'var(--status-success)' : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isAct || isDone ? '#FFFFFF' : 'var(--text-secondary)'
                }}>
                  <Icon size={15} />
                </div>
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--status-success)" />
                ) : isAct ? (
                  <Clock size={16} className="animate-spin" color="var(--primary)" />
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>0{idx + 1}</span>
                )}
              </div>
              <h5 style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isAct ? 'var(--primary)' : isDone ? 'var(--status-success)' : 'var(--text-primary)'
              }}>
                {s.title}
              </h5>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-time Stage Log Terminal (Light Console) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-main)',
        overflow: 'hidden'
      }}>
        <div
          onClick={() => setShowLogs(!showLogs)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 14px',
            background: 'var(--bg-secondary)',
            borderBottom: showLogs ? '1px solid var(--border-main)' : 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            <Terminal size={14} color="var(--primary)" />
            <span>Execution Telemetry & Neural Logs</span>
            {liveLogs.length > 0 && (
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                {liveLogs.length} events
              </span>
            )}
          </div>
          <button style={{ color: 'var(--text-secondary)' }}>
            {showLogs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {showLogs && (
          <div style={{
            padding: '12px 14px',
            maxHeight: '150px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.775rem',
            color: '#334155',
            backgroundColor: '#F8FAFC',
            lineHeight: 1.6
          }}>
            {liveLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>
                &gt; Standby. Click &quot;Execute Full Pipeline&quot; to initialize multimodal extraction stream...
              </div>
            ) : (
              liveLogs.map((lg, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0, fontWeight: 700 }}>&gt;</span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{lg.stage}]</span>
                  <span style={{ color: lg.pct >= 100 ? 'var(--status-success)' : '#1E293B' }}>{lg.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error Notice */}
      {job?.error_message && (
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
          <AlertTriangle size={18} />
          <span>Error in pipeline execution: {job.error_message}</span>
        </div>
      )}
    </div>
  );
};
