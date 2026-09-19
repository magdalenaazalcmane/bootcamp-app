// Applies a theme preference to the document. 'light'/'dark' set an explicit
// data-theme attribute (wins over the OS setting); 'system' removes the
// attribute entirely so the prefers-color-scheme media query in index.css
// decides instead.
export function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}
