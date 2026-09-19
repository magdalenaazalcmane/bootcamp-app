// Validated categorical palette (dataviz skill reference instance) — fixed hue
// order, never reassigned by rank. Slots are indexed from 0 = slot 1. Values
// come from CSS custom properties (index.css) so each chart gets the right
// step for the active theme automatically:
//   - Light steps verified with scripts/validate_palette.js (light, surface
//     #fafbfc): all six checks pass; slots 3/4/5 (aqua/yellow/magenta) land
//     in the sub-3:1 contrast WARN band, which is why every chart using them
//     also carries direct labels/legend text and a table view (the "relief"
//     the skill requires for that WARN).
//   - Dark steps are the skill's own dark column for this exact hue order,
//     re-verified against this app's actual dark surface (#1d2025): all
//     eight clear 3:1 contrast, the lightness band, and the CVD/normal-vision
//     floors (worst adjacent CVD ΔE 8.4, worst adjacent normal-vision ΔE 19.3).
export const CATEGORICAL = [
  'var(--chart-cat-1)', // blue
  'var(--chart-cat-2)', // orange
  'var(--chart-cat-3)', // aqua
  'var(--chart-cat-4)', // yellow
  'var(--chart-cat-5)', // magenta
  'var(--chart-cat-6)', // green
  'var(--chart-cat-7)', // violet
  'var(--chart-cat-8)', // red
];

// Fixed status scale (dataviz skill reference instance) — reserved meaning,
// never reused for "series N." Same hex in both themes (both clear 3:1 on
// this app's surfaces: good 3.24 light / 4.87 dark, critical 4.64 light /
// 3.40 dark — computed, not eyeballed). As a pair, good vs. critical measures
// only ΔE 4.1 under deutan simulation — well below the colorblind-safe floor —
// so anywhere both appear together (see BugsPerWeekChart) also carries a
// shape difference (round vs. square legend swatch) and text labels: never
// red/green alone.
export const STATUS = {
  good: '#0ca30c',
  critical: '#d03b3b',
};

// Chart ink reuses this app's own themed text/border tokens (already
// verified for dark-mode contrast — see index.css) rather than a separate,
// possibly-drifting set of grays.
export const INK = {
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  grid: 'var(--border)',
  axis: 'var(--border-input)',
  surface: 'var(--surface-card)',
};
