import { useState } from 'react';
import ChartCard from './ChartCard';
import { CATEGORICAL, INK } from './chartTokens';

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 24, bottom: 40, left: 44 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const GRID_VALUES = [0, 25, 50, 75, 100];
const SERIES_COLOR = CATEGORICAL[0];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PassRateTrendChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const tableColumns = [
    { key: 'date', label: 'Date' },
    { key: 'pass_rate', label: 'Pass rate' },
  ];
  const tableRows = data.map((d) => ({ date: formatDate(d.date), pass_rate: `${d.pass_rate}%` }));

  if (data.length === 0) {
    return (
      <ChartCard title="Pass-rate trend (last 10 runs)" tableColumns={tableColumns} tableRows={tableRows}>
        <div className="empty-state">
          <p>No completed runs yet.</p>
        </div>
      </ChartCard>
    );
  }

  const xAt = (i) => (data.length === 1 ? MARGIN.left + PLOT_W / 2 : MARGIN.left + (i / (data.length - 1)) * PLOT_W);
  const yAt = (v) => MARGIN.top + (1 - v / 100) * PLOT_H;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d.pass_rate)}`).join(' ');
  const lastIndex = data.length - 1;

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(xAt(i) - px);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hover = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <ChartCard title="Pass-rate trend (last 10 runs)" tableColumns={tableColumns} tableRows={tableRows}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Line chart of pass rate percentage across recent test runs"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Gridlines */}
        {GRID_VALUES.map((v) => (
          <g key={v}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke={INK.grid}
              strokeWidth="1"
            />
            <text x={MARGIN.left - 8} y={yAt(v) + 4} textAnchor="end" fontSize="11" fill={INK.muted}>
              {v}%
            </text>
          </g>
        ))}

        {/* X axis labels (skip some if crowded) */}
        {data.map((d, i) => {
          const showLabel = data.length <= 6 || i === 0 || i === lastIndex || i % 2 === 0;
          if (!showLabel) return null;
          return (
            <text key={i} x={xAt(i)} y={HEIGHT - MARGIN.bottom + 20} textAnchor="middle" fontSize="11" fill={INK.muted}>
              {formatDate(d.date)}
            </text>
          );
        })}

        {/* Crosshair */}
        {hover && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={MARGIN.top}
            y2={HEIGHT - MARGIN.bottom}
            stroke={INK.axis}
            strokeWidth="1"
          />
        )}

        {/* Line */}
        <path d={linePath} fill="none" stroke={SERIES_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(d.pass_rate)}
            r={i === hoverIndex ? 6 : 4}
            fill={SERIES_COLOR}
            stroke={INK.surface}
            strokeWidth="2"
            tabIndex={0}
            onFocus={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex(null)}
          />
        ))}

        {/* Endpoint direct label */}
        <text
          x={xAt(lastIndex)}
          y={yAt(data[lastIndex].pass_rate) - 12}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill={INK.primary}
        >
          {data[lastIndex].pass_rate}%
        </text>
      </svg>

      {hover && (
        <div className="chart-tooltip">
          <strong>{hover.pass_rate}%</strong> pass rate <span className="chart-tooltip-muted">· {formatDate(hover.date)}</span>
        </div>
      )}
    </ChartCard>
  );
}

export default PassRateTrendChart;
