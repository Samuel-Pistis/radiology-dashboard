import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Activity } from 'lucide-react';
import { PageSkeleton } from './components/ui/Skeleton';

// Code-split all page-level components
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DailyLogging = lazy(() => import('./pages/DailyLogging').then(m => ({ default: m.DailyLogging })));
const WeeklyOperations = lazy(() => import('./pages/WeeklyOperations').then(m => ({ default: m.WeeklyOperations })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const StaffActivity = lazy(() => import('./pages/staff-activity/StaffActivity'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-text-secondary font-medium tracking-wide">Connecting...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<div className="min-h-screen bg-surface" />}>
            <Login />
          </Suspense>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
          <Route path="daily-logging" element={<Suspense fallback={<PageSkeleton />}><DailyLogging /></Suspense>} />
          <Route path="weekly-operations" element={<Suspense fallback={<PageSkeleton />}><WeeklyOperations /></Suspense>} />
          <Route path="staff-activity" element={<Suspense fallback={<PageSkeleton />}><StaffActivity /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageSkeleton />}><Reports /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><Settings /></Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
