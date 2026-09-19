import { useState } from 'react';

// Shared chart chrome: title, the chart itself, and a "View as table" toggle —
// the WCAG-clean accessible twin every chart in this skill needs, so a value
// is never reachable only via hover/color.
function ChartCard({ title, children, tableColumns, tableRows }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        <button className="link-btn" onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'View as chart' : 'View as table'}
        </button>
      </div>
      {showTable ? (
        <table className="test-case-table">
          <thead>
            <tr>
              {tableColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i}>
                {tableColumns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </div>
  );
}

export default ChartCard;
