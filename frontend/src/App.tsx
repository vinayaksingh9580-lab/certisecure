// CertiSecure2 — App Root & Router

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './index.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VerifyPage from './pages/VerifyPage';
import DashboardPage from './pages/DashboardPage';
import CreateCertificatePage from './pages/CreateCertificatePage';
import CertificateListPage from './pages/CertificateListPage';
import CertificateDetailPage from './pages/CertificateDetailPage';
import RevocationsPage from './pages/RevocationsPage';
import InstitutionsAdminPage from './pages/InstitutionsAdminPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import StudentCertificatesPage from './pages/StudentCertificatesPage';

// ─── Auth Guards ──────────────────────────────────────────────

/** Redirects to /login if user is not authenticated */
function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Requires Issuer or Admin role */
function RequireIssuerOrAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role;
  if (role !== 'admin' && role !== 'issuer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** Requires Admin role */
function RequireAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** Requires Student / verifier role */
function RequireStudent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/student/register" replace />;
  if (user?.role !== 'verifier') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

// ─── App Router ───────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/register" element={<StudentRegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />

          {/* Authenticated Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/certificates" element={<CertificateListPage />} />
            <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
            <Route path="/revocations" element={<RevocationsPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<RequireStudent />}>
            <Route path="/student/certificates" element={<StudentCertificatesPage />} />
          </Route>

          {/* Issuer / Admin Routes */}
          <Route element={<RequireIssuerOrAdmin />}>
            <Route path="/issue" element={<CreateCertificatePage />} />
          </Route>

          {/* Admin-Only Routes */}
          <Route element={<RequireAdmin />}>
            <Route path="/issuers" element={<InstitutionsAdminPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
