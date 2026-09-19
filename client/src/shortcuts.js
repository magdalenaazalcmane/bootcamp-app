// Single source of truth for every keyboard shortcut in the app. The help
// modal (?) renders this list directly, and navigation shortcuts carry their
// own destination (`path`) here too, so behavior and documentation can't
// drift apart — add or change a shortcut in one place and both follow.
export const SHORTCUTS = [
  { id: 'quick-search', label: '⌘K / Ctrl+K', description: 'Open quick search across test cases, bugs, and suites' },
  { id: 'help', label: '?', description: 'Show this list of keyboard shortcuts' },
  { id: 'goto-dashboard', label: 'G then D', description: 'Go to Dashboard', path: '/' },
  { id: 'goto-test-cases', label: 'G then T', description: 'Go to Test cases', path: '/test-cases' },
  { id: 'goto-bugs', label: 'G then B', description: 'Go to Bugs', path: '/bugs' },
  { id: 'goto-test-runs', label: 'G then R', description: 'Go to Test runs', path: '/test-runs' },
];

// Maps the second key of a "G then <key>" sequence to the shortcut it triggers.
export const GOTO_KEY_MAP = {
  d: 'goto-dashboard',
  t: 'goto-test-cases',
  b: 'goto-bugs',
  r: 'goto-test-runs',
};
