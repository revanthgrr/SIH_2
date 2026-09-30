import React, { useState } from 'react';
import {
  Settings, User as UserIcon, Lock, Bell, Palette,
  Save, CheckCircle2, AlertCircle, Eye, EyeOff, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi, apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

type Tab = 'profile' | 'security' | 'preferences' | 'notifications';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile state
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [secMsg, setSecMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [secSaving, setSecSaving] = useState(false);

  // Preferences state (local only — persisted to localStorage)
  const getSavedPref = (key: string, def: string) => localStorage.getItem(`parivartan_pref_${key}`) ?? def;
  const [defaultAudience, setDefaultAudience] = useState(() => getSavedPref('audience', 'General Public'));
  const [defaultTone, setDefaultTone] = useState(() => getSavedPref('tone', 'Formal'));
  const [prefMsg, setPrefMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification state (local only)
  const [notifPipeline, setNotifPipeline] = useState(() => getSavedPref('notif_pipeline', 'true') === 'true');
  const [notifError, setNotifError] = useState(() => getSavedPref('notif_error', 'true') === 'true');
  const [notifTips, setNotifTips] = useState(() => getSavedPref('notif_tips', 'false') === 'true');
  const [notifMsg, setNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (setter: (m: { type: 'success' | 'error'; text: string } | null) => void, type: 'success' | 'error', text: string) => {
    setter({ type, text });
    setTimeout(() => setter(null), 3500);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      // PATCH /auth/me — update profile name (backend may or may not support this)
      await apiClient.patch('/auth/me', { full_name: fullName });
      showMsg(setProfileMsg, 'success', 'Profile updated successfully.');
    } catch {
      showMsg(setProfileMsg, 'error', 'Could not update profile. Backend may not support this endpoint yet.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showMsg(setSecMsg, 'error', 'New passwords do not match.'); return; }
    if (newPwd.length < 6) { showMsg(setSecMsg, 'error', 'New password must be at least 6 characters.'); return; }
    setSecSaving(true);
    try {
      await apiClient.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showMsg(setSecMsg, 'success', 'Password changed successfully.');
    } catch {
      showMsg(setSecMsg, 'error', 'Password change failed. Check your current password.');
    } finally {
      setSecSaving(false);
    }
  };

  const handlePrefSave = () => {
    localStorage.setItem('parivartan_pref_audience', defaultAudience);
    localStorage.setItem('parivartan_pref_tone', defaultTone);
    showMsg(setPrefMsg, 'success', 'Preferences saved locally.');
  };

  const handleNotifSave = () => {
    localStorage.setItem('parivartan_pref_notif_pipeline', String(notifPipeline));
    localStorage.setItem('parivartan_pref_notif_error', String(notifError));
    localStorage.setItem('parivartan_pref_notif_tips', String(notifTips));
    showMsg(setNotifMsg, 'success', 'Notification preferences saved.');
  };

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'profile',       label: 'Profile',        icon: <UserIcon size={16} /> },
    { id: 'security',      label: 'Security',       icon: <Lock size={16} /> },
    { id: 'preferences',   label: 'Preferences',    icon: <Palette size={16} /> },
    { id: 'notifications', label: 'Notifications',  icon: <Bell size={16} /> },
  ];

  const MsgBanner = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => {
    if (!msg) return null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
        background: msg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
        border: `1px solid ${msg.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
        borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '16px',
        color: msg.type === 'success' ? 'var(--status-success)' : 'var(--status-error)'
      }}>
        {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
        {msg.text}
      </div>
    );
  };

  const Toggle = ({ value, onChange, id }: { value: boolean; onChange: (v: boolean) => void; id: string }) => (
    <button
      id={id}
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '99px', flexShrink: 0,
        background: value ? 'var(--primary)' : 'var(--border-medium)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '22px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </button>
  );

  return (
    <div className="workspace-canvas">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account, security, and platform preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sidebar Tabs */}
        <div className="white-card" style={{ overflow: 'hidden' }}>
          {TABS.map((t) => (
            <button key={t.id} id={`settings-tab-${t.id}`} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px',
                fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 500,
                color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                background: tab === t.id ? 'var(--primary-light)' : 'transparent',
                borderLeft: tab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                borderBottom: '1px solid var(--border-main)'
              }}
              onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button
            id="settings-logout-btn"
            onClick={() => { logout(); navigate('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--status-error)',
              background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--status-error-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Content Panel */}
        <div className="white-card" style={{ padding: '28px' }}>
          {/* ─── Profile ─── */}
          {tab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Profile Information</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Update your display name and view your account details.</p>
              <MsgBanner msg={profileMsg} />
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--primary-light)', border: '2px solid var(--primary-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem'
                }}>
                  {(user?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{user?.full_name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                  <span className="badge badge-indigo" style={{ marginTop: '4px', fontSize: '0.7rem' }}>{user?.role ?? 'user'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Full Name</label>
                  <input id="settings-full-name" type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your display name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Email Address</label>
                  <input type="email" className="input-field" value={user?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Account ID</label>
                <input type="text" className="input-field" value={`uid-${user?.id ?? '—'}`} disabled style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'monospace' }} />
              </div>
              <button type="submit" disabled={profileSaving} id="settings-save-profile-btn" className="btn-primary" style={{ gap: '7px' }}>
                <Save size={15} /> {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* ─── Security ─── */}
          {tab === 'security' && (
            <form onSubmit={handlePasswordChange}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Security</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Change your password to keep your account secure.</p>
              <MsgBanner msg={secMsg} />
              {[
                { label: 'Current Password', value: currentPwd, setter: setCurrentPwd, id: 'settings-current-pwd' },
                { label: 'New Password',     value: newPwd,     setter: setNewPwd,     id: 'settings-new-pwd' },
                { label: 'Confirm Password', value: confirmPwd, setter: setConfirmPwd, id: 'settings-confirm-pwd' },
              ].map((f) => (
                <div key={f.id} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input id={f.id} type={showPwd ? 'text' : 'password'} className="input-field"
                      value={f.value} onChange={(e) => f.setter(e.target.value)}
                      placeholder="••••••••" style={{ paddingRight: '42px' }} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                💡 Password must be at least 6 characters. Avoid reusing old passwords.
              </div>
              <button type="submit" disabled={secSaving} id="settings-change-pwd-btn" className="btn-primary" style={{ gap: '7px' }}>
                <Lock size={15} /> {secSaving ? 'Updating…' : 'Change Password'}
              </button>
            </form>
          )}

          {/* ─── Preferences ─── */}
          {tab === 'preferences' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Pipeline Preferences</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Set default parameters for all new transformation jobs.</p>
              <MsgBanner msg={prefMsg} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Default Target Audience</label>
                  <select id="settings-default-audience" className="input-field" value={defaultAudience} onChange={(e) => setDefaultAudience(e.target.value)}>
                    {['General Public', 'Government Officials', 'Researchers', 'Students', 'Media / Journalists', 'Technical Engineers'].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Default Output Tone</label>
                  <select id="settings-default-tone" className="input-field" value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)}>
                    {['Formal', 'Simplified', 'Neutral', 'Persuasive', 'Academic', 'Conversational'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.83rem', color: 'var(--primary)', border: '1px solid var(--primary-border)', marginBottom: '24px' }}>
                ℹ️ These preferences are saved locally and applied as defaults when running new transformations.
              </div>
              <button onClick={handlePrefSave} id="settings-save-prefs-btn" className="btn-primary" style={{ gap: '7px' }}>
                <Save size={15} /> Save Preferences
              </button>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {tab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Notifications</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Control which in-app events trigger notifications.</p>
              <MsgBanner msg={notifMsg} />
              {[
                { id: 'notif-pipeline', label: 'Pipeline Completion', description: 'Get notified when a transformation pipeline finishes.', value: notifPipeline, setter: setNotifPipeline },
                { id: 'notif-error', label: 'Pipeline Errors', description: 'Alert when a pipeline stage fails or encounters an error.', value: notifError, setter: setNotifError },
                { id: 'notif-tips', label: 'Usage Tips & Insights', description: 'Receive occasional tips to improve transformation quality.', value: notifTips, setter: setNotifTips },
              ].map((n) => (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
                  padding: '16px 0', borderBottom: '1px solid var(--border-main)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{n.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.description}</div>
                  </div>
                  <Toggle id={`settings-${n.id}`} value={n.value} onChange={n.setter} />
                </div>
              ))}
              <button onClick={handleNotifSave} id="settings-save-notif-btn" className="btn-primary" style={{ gap: '7px', marginTop: '24px' }}>
                <Save size={15} /> Save Notification Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
