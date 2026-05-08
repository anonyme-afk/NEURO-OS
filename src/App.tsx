/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Marketplace } from './pages/Marketplace';
import { Workspaces } from './pages/Workspaces';
import { SetupWizard } from './pages/SetupWizard';
import { ArchitectureLab } from './pages/Lab';
import { Sidebar } from './components/Sidebar';

import { useState, useEffect } from 'react';

function AppLayout() {
  const [theme, setTheme] = useState(() => localStorage.getItem('neuro_theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('neuro_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={`flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans transition-colors duration-300`}>
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex-1 overflow-x-hidden p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/lab" element={<ArchitectureLab />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}
