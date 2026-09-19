import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import DashboardPage from './pages/DashboardPage';
import TestCasesPage from './pages/TestCasesPage';
import ImportTestCasesPage from './pages/ImportTestCasesPage';
import TestSuitesPage from './pages/TestSuitesPage';
import SuiteDetailPage from './pages/SuiteDetailPage';
import BugsPage from './pages/BugsPage';
import BugDetailPage from './pages/BugDetailPage';
import TestRunsPage from './pages/TestRunsPage';
import TestRunDetailPage from './pages/TestRunDetailPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import QuickSearchModal from './components/QuickSearchModal';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenSearch: () => setSearchOpen(true),
    onOpenHelp: () => setHelpOpen(true),
  });

  return (
    <SettingsProvider>
      <div>
        <Nav />
        {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
        {helpOpen && <ShortcutsHelpModal onClose={() => setHelpOpen(false)} />}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/test-cases" element={<TestCasesPage />} />
          <Route path="/test-cases/import" element={<ImportTestCasesPage />} />
          <Route path="/test-suites" element={<TestSuitesPage />} />
          <Route path="/test-suites/:id" element={<SuiteDetailPage />} />
          <Route path="/bugs" element={<BugsPage />} />
          <Route path="/bugs/:id" element={<BugDetailPage />} />
          <Route path="/test-runs" element={<TestRunsPage />} />
          <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </SettingsProvider>
  );
}

export default App;
