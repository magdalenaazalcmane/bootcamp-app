import { useState } from 'react';
import ChartCard from './ChartCard';
import { STATUS, INK } from './chartTokens';

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 24, bottom: 40, left: 40 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 2;

// Opened/closed carries real good/bad meaning (more open = worse, more closed
// = better), so this uses the reserved status palette, not categorical hues.
const OPENED_COLOR = STATUS.critical;
const CLOSED_COLOR = STATUS.good;

function formatWeek(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function niceMax(value) {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function BugsPerWeekChart({ data }) {
  const [hover, setHover] = useState(null);

  const tableColumns = [
    { key: 'week', label: 'Week of' },
    { key: 'opened', label: 'Opened' },
    { key: 'closed', label: 'Closed' },
  ];
  const tableRows = data.map((d) => ({ week: formatWeek(d.week_start), opened: d.opened, closed: d.closed }));

  const maxValue = niceMax(Math.max(1, ...data.map((d) => Math.max(d.opened, d.closed))));
  const gridStep = maxValue / 4;
  const gridValues = [0, 1, 2, 3, 4].map((i) => Math.round(gridStep * i));

  const groupWidth = PLOT_W / data.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, (groupWidth - BAR_GAP - 16) / 2);

  const yAt = (v) => MARGIN.top + (1 - v / maxValue) * PLOT_H;
  const baseline = MARGIN.top + PLOT_H;

  return (
    <ChartCard title="Bugs opened vs. closed (last 8 weeks)" tableColumns={tableColumns} tableRows={tableRows}>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="chart-legend-swatch" style={{ background: OPENED_COLOR }} />Opened</span>
        <span className="chart-legend-item"><span className="chart-legend-swatch chart-legend-swatch--outline" style={{ color: CLOSED_COLOR }} />Closed</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Grouped bar chart of bugs opened versus closed per week">
        {gridValues.map((v) => (
          <g key={v}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yAt(v)} y2={yAt(v)} stroke={INK.grid} strokeWidth="1" />
            <text x={MARGIN.left - 8} y={yAt(v) + 4} textAnchor="end" fontSize="11" fill={INK.muted}>
              {v}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const groupCenter = MARGIN.left + groupWidth * i + groupWidth / 2;
          const openedX = groupCenter - barWidth - BAR_GAP / 2;
          const closedX = groupCenter + BAR_GAP / 2;
          const isHoverGroup = hover?.index === i;

          return (
            <g key={i}>
              <rect
                x={openedX}
                y={yAt(d.opened)}
                width={barWidth}
                height={Math.max(0, baseline - yAt(d.opened))}
                rx="4"
                fill={OPENED_COLOR}
                opacity={isHoverGroup && hover.series === 'opened' ? 1 : isHoverGroup ? 0.85 : 1}
                onMouseEnter={() => setHover({ index: i, series: 'opened' })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ index: i, series: 'opened' })}
                onBlur={() => setHover(null)}
                tabIndex={0}
              />
              <rect
                x={closedX}
                y={yAt(d.closed)}
                width={barWidth}
                height={Math.max(0, baseline - yAt(d.closed))}
                rx="4"
                fill={CLOSED_COLOR}
                opacity={isHoverGroup && hover.series === 'closed' ? 1 : isHoverGroup ? 0.85 : 1}
                onMouseEnter={() => setHover({ index: i, series: 'closed' })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ index: i, series: 'closed' })}
                onBlur={() => setHover(null)}
                tabIndex={0}
              />
              <text x={groupCenter} y={HEIGHT - MARGIN.bottom + 20} textAnchor="middle" fontSize="10" fill={INK.muted}>
                {formatWeek(d.week_start)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="chart-tooltip">
          <strong>{hover.series === 'opened' ? data[hover.index].opened : data[hover.index].closed}</strong>{' '}
          {hover.series === 'opened' ? 'opened' : 'closed'}{' '}
          <span className="chart-tooltip-muted">· week of {formatWeek(data[hover.index].week_start)}</span>
        </div>
      )}
    </ChartCard>
  );
}

export default BugsPerWeekChart;
