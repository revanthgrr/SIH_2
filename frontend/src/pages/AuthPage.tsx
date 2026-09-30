import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Sparkles, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, quickDemoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsSubmitting(true);
    try {
      await quickDemoLogin();
      navigate('/dashboard');
    } catch {
      setErrorMsg('Failed to log in with demo account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div className="white-card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '32px',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
          }}>
            <Layers size={22} color="#FFFFFF" />
          </div>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {mode === 'login' ? 'Sign In to Parivartan.ai' : 'Create Your Account'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Multimodal transformation platform for SIH 2026
          </p>
        </div>

        {/* 1-Click Demo Shortcut */}
        <div style={{
          background: 'var(--primary-light)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.785rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 600 }}>
            Want to test immediately without signing up?
          </div>
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={isSubmitting}
            className="btn-secondary"
            id="demo-login-btn"
            style={{ width: '100%', fontSize: '0.825rem', padding: '7px', gap: '6px', backgroundColor: '#FFFFFF' }}
          >
            <Sparkles size={14} color="var(--accent-amber)" />
            1-Click Instant Demo Login
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          border: '1px solid var(--border-main)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            id="auth-tab-login"
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 600,
              background: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'login' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            id="auth-tab-register"
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 600,
              background: mode === 'register' ? '#FFFFFF' : 'transparent',
              color: mode === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'register' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: 'var(--status-error-bg)',
            border: '1px solid var(--status-error-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--status-error)',
            fontSize: '0.825rem'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. Aryan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="auth-name-input"
                  style={{ paddingLeft: '36px' }}
                />
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="auth-email-input"
                style={{ paddingLeft: '36px' }}
              />
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="auth-password-input"
                style={{ paddingLeft: '36px' }}
              />
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            id="auth-submit-btn"
            style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
          >
            {isSubmitting ? 'Verifying...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
