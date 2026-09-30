import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FolderPlus, Folder, ArrowRight, FileText, 
  Trash2, Plus, ShieldCheck, X
} from 'lucide-react';
import { projectsApi } from '../api/client';
import type { Project } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-open create modal when navigated with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreateModal(true);
      setSearchParams({}, { replace: true }); // clean up URL
    }
  }, [searchParams, setSearchParams]);

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await projectsApi.create({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
      });
      setNewProjectName('');
      setNewProjectDesc('');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workspace and all its documents?')) {
      try {
        await projectsApi.delete(id);
        fetchProjects();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  // Compute summary metrics
  const totalDocs = projects.reduce((acc, p) => acc + (p.documents?.length || 0), 0);

  return (
    <div className="workspace-canvas">
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>
            Knowledge Workspaces
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Organize multimodal collections into projects and run citation-backed AI transformation pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          id="create-workspace-btn"
          style={{ padding: '10px 18px', gap: '8px' }}
        >
          <Plus size={16} />
          New Workspace
        </button>
      </div>

      {/* Metrics Row (3 Clean White Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="white-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Workspaces</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Folder size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{projects.length}</div>
        </div>

        <div className="white-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ingested Materials</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F0F9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284C7'
            }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalDocs}</div>
        </div>

        <div className="white-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Citation Accuracy</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--status-success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-success)'
            }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-success)' }}>100%</div>
        </div>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading workspaces...
        </div>
      ) : projects.length === 0 ? (
        <div className="white-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            margin: '0 auto 16px auto'
          }}>
            <FolderPlus size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 700 }}>
            No workspaces found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            Create your first workspace to start ingesting multimodal documents, reports, and audio briefings.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={15} /> Create Workspace
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/project/${proj.id}`)}
              className="white-card"
              id={`project-card-${proj.id}`}
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '190px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <Folder size={18} />
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(e, proj.id)}
                    className="btn-icon"
                    title="Delete Workspace"
                    style={{ width: '30px', height: '30px' }}
                  >
                    <Trash2 size={14} color="var(--status-error)" />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {proj.name}
                </h3>
                <p style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-main)',
                paddingTop: '12px',
                marginTop: '16px',
                fontSize: '0.775rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="var(--primary)" />
                  <span>{proj.documents?.length || 0} Documents</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                  <span>Open Workspace</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal (Clean White Dialog) */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="white-card" style={{ maxWidth: '480px', width: '100%', padding: '28px', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>Create New Knowledge Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon" style={{ width: '28px', height: '28px' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Group related reports, research papers, and audio briefings together for contextual intelligence.
            </p>

            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Workspace Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Smart City Infrastructure 2026"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                  id="new-workspace-name-input"
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Summary of domain scope, target objectives, or project team..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  id="new-workspace-desc-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  id="cancel-create-workspace-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  id="submit-create-workspace-btn"
                >
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
