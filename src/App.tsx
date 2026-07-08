import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import { useAppStore } from './store/useAppStore';

const LandingPage    = lazy(() => import('./pages/public/LandingPage'));
const AuthPage       = lazy(() => import('./pages/public/AuthPage'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPasswordPage'));
const CompaniesPage  = lazy(() => import('./pages/public/CompaniesPage'));
const JobsPage       = lazy(() => import('./pages/public/JobsPage'));
const AboutPage      = lazy(() => import('./pages/public/AboutPage'));

const CombinedNavBar = lazy(() => import('./components/layout/CombinedNavBar'));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-3 border-transparent border-t-orange-500 animate-spin"
        style={{ borderTopColor: 'var(--color-primary)', borderWidth: '3px' }} />
      <span className="text-sm" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
        Loading Tarxemo...
      </span>
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* ─ Public Routes ─ */}
        <Route element={<PublicLayout />}>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/jobs"      element={<JobsPage />} />
          <Route path="/about"     element={<AboutPage />} />
        </Route>

        {/* ─ Auth ─ */}
        <Route path="/auth"            element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ─ Protected (all roles share CombinedNavBar) ─ */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <CombinedNavBar />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
