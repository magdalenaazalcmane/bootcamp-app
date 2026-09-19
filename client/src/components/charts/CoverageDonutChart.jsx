import { useState } from 'react';
import ChartCard from './ChartCard';
import { CATEGORICAL, INK } from './chartTokens';
import { STATUS_LABELS } from '../../constants';

const SIZE = 260;
const RADIUS = 80;
const STROKE = 30;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEGREES = 3;
const GAP_LENGTH = (GAP_DEGREES / 360) * CIRCUMFERENCE;

// Fixed slot order — draft/ready/passed/failed/skipped always map to the same
// categorical hue, never reassigned based on which has the most cases.
const STATUS_ORDER = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const STATUS_COLOR = Object.fromEntries(STATUS_ORDER.map((status, i) => [status, CATEGORICAL[i]]));

function CoverageDonutChart({ data }) {
  const [hoverStatus, setHoverStatus] = useState(null);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const tableColumns = [
    { key: 'status', label: 'Status' },
    { key: 'count', label: 'Test cases' },
    { key: 'percent', label: 'Share' },
  ];
  const tableRows = data.map((d) => ({
    status: STATUS_LABELS[d.status],
    count: d.count,
    percent: total > 0 ? `${Math.round((d.count / total) * 1000) / 10}%` : '0%',
  }));

  if (total === 0) {
    return (
      <ChartCard title="Test coverage by status" tableColumns={tableColumns} tableRows={tableRows}>
        <div className="empty-state">
          <p>No test cases yet.</p>
        </div>
      </ChartCard>
    );
  }

  let cumulative = 0;
  const segments = data.map((d) => {
    const share = d.count / total;
    const rawLength = share * CIRCUMFERENCE;
    const length = d.count > 0 ? Math.max(0, rawLength - GAP_LENGTH) : 0;
    const offset = cumulative;
    cumulative += rawLength;
    return { ...d, length, offset, share };
  });

  return (
    <ChartCard title="Test coverage by status" tableColumns={tableColumns} tableRows={tableRows}>
      <div className="donut-layout">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Donut chart of test case counts by status">
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={INK.grid} strokeWidth={STROKE} />
            {segments.map((s) =>
              s.count > 0 ? (
                <circle
                  key={s.status}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={STATUS_COLOR[s.status]}
                  strokeWidth={hoverStatus === s.status ? STROKE + 4 : STROKE}
                  strokeDasharray={`${s.length} ${CIRCUMFERENCE - s.length}`}
                  strokeDashoffset={-s.offset}
                  onMouseEnter={() => setHoverStatus(s.status)}
                  onMouseLeave={() => setHoverStatus(null)}
                  onFocus={() => setHoverStatus(s.status)}
                  onBlur={() => setHoverStatus(null)}
                  tabIndex={0}
                  style={{ transition: 'stroke-width 0.1s' }}
                />
              ) : null
            )}
          </g>
          <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="24" fontWeight="700" fill={INK.primary}>
            {total}
          </text>
          <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="12" fill={INK.muted}>
            test cases
          </text>
        </svg>

        <div className="chart-legend chart-legend-vertical">
          {segments.map((s) => (
            <div
              key={s.status}
              className="chart-legend-item"
              onMouseEnter={() => setHoverStatus(s.status)}
              onMouseLeave={() => setHoverStatus(null)}
            >
              <span className="chart-legend-swatch" style={{ background: STATUS_COLOR[s.status] }} />
              {STATUS_LABELS[s.status]}
              <span className="chart-legend-value">
                {s.count} ({Math.round(s.share * 1000) / 10}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

export default CoverageDonutChart;
