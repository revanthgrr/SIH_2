import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, FolderGit2, Layers,
  ShieldCheck, History, BarChart3, Settings,
  LogOut, User as UserIcon, X, Construction
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  action?: 'new-transformation';
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',          icon: LayoutDashboard, path: '/dashboard' },
  { label: 'New Transformation', icon: Sparkles,        path: '/transform', badge: 'New' },
  { label: 'Source Library',     icon: FolderGit2,      path: '/library' },
  { label: 'Output Builder',     icon: Layers,          path: '/outputs' },
  { label: 'Review & Guardrails',icon: ShieldCheck,     path: '/review' },
  { label: 'History',            icon: History,         path: '/history' },
  { label: 'Analytics',          icon: BarChart3,       path: '/analytics' },
  { label: 'Settings',           icon: Settings,        path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const isActive = (item: NavItem): boolean => {
    if (item.action === 'new-transformation') {
      return location.pathname.startsWith('/project') || location.pathname.startsWith('/document');
    }
    if (item.path) {
      if (item.path === '/dashboard') return location.pathname === '/dashboard';
      return location.pathname.startsWith(item.path);
    }
    return false;
  };

  const handleClick = (item: NavItem) => {
    if (item.action === 'new-transformation') {
      navigate('/dashboard?new=1');
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="layout-sidebar" id="app-sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-main)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)', flexShrink: 0
        }}>
          <Layers size={20} color="#FFFFFF" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontWeight: 800, fontSize: '1.15rem',
              color: 'var(--text-primary)', letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display)'
            }}>
              Parivartan.ai
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              SIH 2026
            </span>
          </div>
          <span style={{
            fontSize: '0.72rem', color: 'var(--text-secondary)',
            display: 'block', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            Multimodal AI Engine
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1, padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        overflowY: 'auto', position: 'relative'
      }}>
        <div style={{
          padding: '4px 12px 8px 12px',
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Platform Workspace
        </div>

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={idx}
              id={`sidebar-nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => handleClick(item)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                border: active ? '1px solid var(--primary-border)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                width: '100%', textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={active ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge badge-indigo" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Inline Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '12px', right: '12px',
            background: 'var(--text-primary)', color: '#fff',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontSize: '0.8rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-md)',
            animation: 'slideUp 0.2s ease-out',
            zIndex: 10
          }}>
            <Construction size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toast}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', display: 'flex' }}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </nav>

      {/* User Profile Card */}
      {user && (
        <div style={{
          padding: '16px', borderTop: '1px solid var(--border-main)',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
              }}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {user.full_name || 'Active User'}
                </div>
                <div style={{
                  fontSize: '0.725rem', color: 'var(--text-muted)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn-icon"
              title="Sign Out"
              id="sidebar-logout-btn"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
