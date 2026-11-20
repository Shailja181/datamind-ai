import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';

interface HistogramChartProps {
  data: number[];
  columnName: string;
  binsCount?: number;
  color?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  data,
  columnName,
  binsCount = 10,
  color = '#635BFF',
}) => {
  const chartData = useMemo(() => {
    const valid = data.filter((v) => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) return [];

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min;
    const step = range === 0 ? 1 : range / binsCount;

    const bins = Array.from({ length: binsCount }, (_, i) => {
      const start = min + i * step;
      const end = start + step;
      return {
        binRange: `${formatNumber(start, 1)} - ${formatNumber(end, 1)}`,
        count: 0,
        start,
        end,
      };
    });

    valid.forEach((val) => {
      let idx = Math.floor((val - min) / step);
      if (idx >= binsCount) idx = binsCount - 1;
      if (idx >= 0 && idx < binsCount) {
        bins[idx].count++;
      }
    });

    return bins;
  }, [data, binsCount]);

  if (chartData.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground text-center">No numerical values to display.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="binRange"
            tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card border border-border shadow-modal rounded-xl p-2.5 text-xs">
                    <p className="font-semibold text-foreground">{item.binRange}</p>
                    <p className="text-brand-500 font-mono mt-0.5">Frequency: {item.count} items</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
