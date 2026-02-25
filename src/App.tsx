import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DailyLogging } from './pages/DailyLogging';
import { WeeklyOperations } from './pages/WeeklyOperations';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Activity } from 'lucide-react';

const AppRoutes = () => {
  const { isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary-500 animate-pulse mb-4" />
        <p className="text-text-secondary font-medium tracking-wide">Connecting to MediControl Secure Database...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="daily-logging" element={<DailyLogging />} />
          <Route path="weekly-operations" element={<WeeklyOperations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
