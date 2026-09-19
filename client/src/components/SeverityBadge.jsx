// Visual weight scales with severity, not just color — a Critical badge
// reads as heavier even in grayscale or with color vision deficiency: a
// solid, bigger, bolder filled block for Critical, stepping down through
// Major and Minor, to a thin outline-only tag for Trivial. All four use an
// opaque (or fully transparent) background rather than a translucent tint,
// so they stay legible regardless of what row/background they sit on.
const STYLES = {
  Critical: {
    background: 'var(--error)',
    color: 'var(--surface-page)',
    border: '1px solid var(--error)',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
    padding: '0.25rem 0.6rem',
  },
  Major: {
    background: 'var(--warning)',
    color: 'var(--surface-page)',
    border: '1px solid var(--warning)',
    fontWeight: 700,
    fontSize: 'var(--text-xs)',
    padding: '0.2rem 0.5rem',
  },
  Minor: {
    background: 'var(--border)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    fontWeight: 600,
    fontSize: 'var(--text-xs)',
    padding: '0.2rem 0.5rem',
  },
  Trivial: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--text-muted)',
    fontWeight: 400,
    fontSize: 'var(--text-xs)',
    padding: '0.15rem 0.45rem',
  },
};

function SeverityBadge({ severity }) {
  const style = STYLES[severity] || STYLES.Trivial;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.02em',
        borderRadius: 0,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      [{severity.toUpperCase()}]
    </span>
  );
}

export default SeverityBadge;
