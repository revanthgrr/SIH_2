import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ProjectView } from './pages/ProjectView';
import { DocumentView } from './pages/DocumentView';
import { AuthPage } from './pages/AuthPage';
import { SourceLibrary } from './pages/SourceLibrary';
import { OutputBuilder } from './pages/OutputBuilder';
import { ReviewGuardrails } from './pages/ReviewGuardrails';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NewTransformation } from './pages/NewTransformation';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Authenticating session…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const WORKSPACE_PREFIXES = [
  '/dashboard', '/project', '/document',
  '/library', '/outputs', '/review', '/history', '/analytics', '/settings', '/transform',
];

export const AppContent: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isWorkspace = Boolean(
    user && WORKSPACE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  );

  return (
    <div className="app-container">
      {isWorkspace && <Sidebar />}
      <div className="app-main">
        <Navbar />
        <main style={{ flex: 1, backgroundColor: 'var(--bg-secondary)' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Core workspace */}
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/project/:id"  element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
            <Route path="/document/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />

            {/* New sidebar pages */}
            <Route path="/library"   element={<ProtectedRoute><SourceLibrary /></ProtectedRoute>} />
            <Route path="/outputs"   element={<ProtectedRoute><OutputBuilder /></ProtectedRoute>} />
            <Route path="/review"    element={<ProtectedRoute><ReviewGuardrails /></ProtectedRoute>} />
            <Route path="/history"   element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/transform" element={<ProtectedRoute><NewTransformation /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
