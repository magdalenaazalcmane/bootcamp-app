const COLORS = {
  Critical: { bg: '#fde2e1', fg: '#8a1c14' },
  Major: { bg: '#fde8cc', fg: '#8a4a10' },
  Minor: { bg: '#fdf3c6', fg: '#7a6206' },
  Trivial: { bg: '#e3e8ee', fg: '#3d4a5c' },
};

function SeverityBadge({ severity }) {
  const colors = COLORS[severity] || COLORS.Trivial;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {severity}
    </span>
  );
}

export default SeverityBadge;
