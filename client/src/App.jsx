import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import TestCasesPage from './pages/TestCasesPage';
import TestSuitesPage from './pages/TestSuitesPage';
import SuiteDetailPage from './pages/SuiteDetailPage';
import BugsPage from './pages/BugsPage';
import BugDetailPage from './pages/BugDetailPage';

function Home() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <div className="page">
      <h1>My App</h1>
      <p>Server status: {status}</p>
    </div>
  );
}

function App() {
  return (
    <div>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/test-cases">Test cases</Link>
        <Link to="/test-suites">Test suites</Link>
        <Link to="/bugs">Bugs</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<SuiteDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
