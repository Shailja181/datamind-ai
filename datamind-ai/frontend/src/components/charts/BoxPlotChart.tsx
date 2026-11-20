import React from 'react';
import { formatNumber } from '../../utils/formatters';

interface BoxPlotChartProps {
  stats: {
    min: number;
    '25%': number;
    '50%': number;
    '75%': number;
    max: number;
    mean?: number;
  };
  columnName: string;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({ stats, columnName }) => {
  const min = stats.min;
  const q1 = stats['25%'];
  const median = stats['50%'];
  const q3 = stats['75%'];
  const max = stats.max;
  const range = max - min || 1;

  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - min) / range) * 100));
  };

  const leftWhisker = getPercent(min);
  const boxLeft = getPercent(q1);
  const boxWidth = getPercent(q3) - boxLeft;
  const medianLeft = getPercent(median);
  const rightWhisker = getPercent(max);

  return (
    <div className="p-3 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground font-mono">{columnName}</span>
        <span className="text-[10px] text-muted-foreground">
          IQR: {formatNumber(q3 - q1)} • Median: {formatNumber(median)}
        </span>
      </div>

      {/* Visual Boxplot */}
      <div className="relative h-12 flex items-center px-4 my-2">
        {/* Whisker Line */}
        <div
          className="absolute h-0.5 bg-muted-foreground/40 top-1/2 -translate-y-1/2"
          style={{ left: `${leftWhisker}%`, width: `${rightWhisker - leftWhisker}%` }}
        />

        {/* Min tick */}
        <div
          className="absolute w-0.5 h-4 bg-muted-foreground/60 top-1/2 -translate-y-1/2"
          style={{ left: `${leftWhisker}%` }}
          title={`Min: ${min}`}
        />

        {/* Box (Q1 to Q3) */}
        <div
          className="absolute h-7 bg-brand-500/20 border-2 border-brand-500 rounded top-1/2 -translate-y-1/2"
          style={{ left: `${boxLeft}%`, width: `${boxWidth}%` }}
          title={`Q1: ${q1} to Q3: ${q3}`}
        />

        {/* Median bar */}
        <div
          className="absolute w-1 h-7 bg-brand-600 top-1/2 -translate-y-1/2 rounded"
          style={{ left: `${medianLeft}%` }}
          title={`Median: ${median}`}
        />

        {/* Max tick */}
        <div
          className="absolute w-0.5 h-4 bg-muted-foreground/60 top-1/2 -translate-y-1/2"
          style={{ left: `${rightWhisker}%` }}
          title={`Max: ${max}`}
        />
      </div>

      {/* Labels below */}
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-2 pt-1 border-t border-border">
        <span>Min: {formatNumber(min)}</span>
        <span>Q1: {formatNumber(q1)}</span>
        <span className="font-semibold text-brand-500">Med: {formatNumber(median)}</span>
        <span>Q3: {formatNumber(q3)}</span>
        <span>Max: {formatNumber(max)}</span>
      </div>
    </div>
  );
};
