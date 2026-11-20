import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ZAxis,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';

interface ScatterPlotChartProps {
  data: Array<{ x: number; y: number; label?: string }>;
  xLabel: string;
  yLabel: string;
}

export const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({
  data,
  xLabel,
  yLabel,
}) => {
  if (!data || data.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground text-center">No correlation scatter data available.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }}
            label={{ value: xLabel, position: 'bottom', offset: 0, fill: 'var(--color-muted-text)', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }}
            label={{ value: yLabel, angle: -90, position: 'left', fill: 'var(--color-muted-text)', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card border border-border shadow-modal rounded-xl p-2.5 text-xs">
                    {item.label && <p className="font-semibold text-foreground mb-1">{item.label}</p>}
                    <p className="text-muted-foreground">
                      {xLabel}: <span className="font-mono text-foreground font-medium">{formatNumber(item.x)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {yLabel}: <span className="font-mono text-foreground font-medium">{formatNumber(item.y)}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Points" data={data} fill="#635BFF" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
