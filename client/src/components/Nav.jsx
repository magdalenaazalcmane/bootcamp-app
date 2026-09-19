import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/test-cases', label: 'Test cases' },
  { to: '/test-suites', label: 'Test suites' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/test-runs', label: 'Test runs' },
  { to: '/reports', label: 'Reports' },
];

function Nav() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <nav className="nav">
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-toggle-icon" aria-hidden="true" />
      </button>
      <div id="primary-nav" className={`nav-links${open ? ' nav-links-open' : ''}`}>
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={closeMenu}>
            {label}
          </NavLink>
        ))}
        <NavLink to="/settings" className="nav-settings" onClick={closeMenu}>
          Settings
        </NavLink>
      </div>
    </nav>
  );
}

export default Nav;
