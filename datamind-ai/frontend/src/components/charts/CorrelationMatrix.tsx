import React from 'react';
import { Card, CardHeader } from '../common/Card';

interface CorrelationMatrixProps {
  correlation: Record<string, Record<string, number | null>>;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ correlation }) => {
  const columns = Object.keys(correlation);

  if (columns.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-xs">
        Not enough numerical columns to calculate correlation matrix.
      </div>
    );
  }

  // Helper for heatmap background color
  const getColor = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return 'transparent';
    if (val >= 0.8) return 'rgba(99, 91, 255, 0.85)';
    if (val >= 0.5) return 'rgba(99, 91, 255, 0.6)';
    if (val >= 0.2) return 'rgba(99, 91, 255, 0.3)';
    if (val > -0.2) return 'rgba(148, 163, 184, 0.15)';
    if (val > -0.5) return 'rgba(239, 68, 68, 0.3)';
    if (val > -0.8) return 'rgba(239, 68, 68, 0.6)';
    return 'rgba(239, 68, 68, 0.85)';
  };

  const getTextColor = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return 'inherit';
    if (Math.abs(val) >= 0.6) return '#FFFFFF';
    return 'inherit';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold text-muted-foreground bg-muted/40 rounded-tl-xl">
              Features
            </th>
            {columns.map((c) => (
              <th
                key={c}
                className="p-2 text-center font-semibold text-foreground bg-muted/40 font-mono text-[11px] truncate max-w-[90px]"
                title={c}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {columns.map((rowCol) => (
            <tr key={rowCol}>
              <td className="p-2 font-semibold text-foreground font-mono text-[11px] bg-muted/20 truncate max-w-[120px]" title={rowCol}>
                {rowCol}
              </td>
              {columns.map((colCol) => {
                const val = correlation[rowCol]?.[colCol];
                const displayVal = val !== null && val !== undefined ? val.toFixed(2) : '—';
                const bg = getColor(val);
                const textColor = getTextColor(val);

                return (
                  <td
                    key={colCol}
                    className="p-2 text-center font-mono text-[11px] transition-transform hover:scale-105 cursor-default relative group"
                    style={{ backgroundColor: bg, color: textColor }}
                    title={`${rowCol} vs ${colCol}: ${displayVal}`}
                  >
                    {displayVal}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(239,68,68,0.85)]" />
          <span>Strong Negative (-1.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(148,163,184,0.2)]" />
          <span>Neutral (0.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[rgba(99,91,255,0.85)]" />
          <span>Strong Positive (+1.0)</span>
        </div>
      </div>
    </div>
  );
};
