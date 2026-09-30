import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Sparkles, LogOut, User as UserIcon, LayoutDashboard, Compass, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemo = async () => {
    try {
      await quickDemoLogin();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const isPublicPage = location.pathname === '/' || location.pathname === '/auth';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border-main)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Brand Logo / Workspace Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
          }}>
            <Layers size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                Parivartan.ai
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                SIH 2026
              </span>
            </div>
          </div>
        </Link>

        {/* Engine status indicator */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          background: 'var(--status-success-bg)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--status-success-border)',
          fontSize: '0.72rem',
          color: 'var(--status-success)',
          fontWeight: 600,
          marginLeft: '12px'
        }} className="engine-status-pill">
          <CheckCircle2 size={12} />
          <span>Gemini 1.5 Connected</span>
        </div>
      </div>

      {/* Center Navigation Links (Public / Landing) */}
      {isPublicPage && (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            to="/"
            style={{
              color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Compass size={16} /> Explore
          </Link>
          {user && (
            <Link
              to="/dashboard"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LayoutDashboard size={16} /> Workspaces
            </Link>
          )}
        </nav>
      )}

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-main)',
              fontSize: '0.825rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <UserIcon size={12} />
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {user.full_name || user.email}
              </span>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn-icon"
              title="Sign Out"
              id="logout-btn"
              style={{ width: '34px', height: '34px' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDemo}
              className="btn-secondary"
              id="quick-demo-btn"
              style={{ fontSize: '0.825rem', padding: '7px 12px', gap: '6px' }}
            >
              <Sparkles size={14} color="var(--accent-amber)" />
              1-Click Demo
            </button>
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : navigate('/auth')}
              className="btn-primary"
              id="signin-nav-btn"
              style={{ fontSize: '0.825rem', padding: '7px 14px' }}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
