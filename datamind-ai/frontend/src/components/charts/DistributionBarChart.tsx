import React from 'react';
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

interface DistributionBarChartProps {
  data: Record<string, number> | Array<{ name: string; value: number }>;
  title?: string;
  color?: string;
}

export const DistributionBarChart: React.FC<DistributionBarChartProps> = ({
  data,
  title,
  color = '#8B5CF6',
}) => {
  const chartData = Array.isArray(data)
    ? data
    : Object.entries(data).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground text-center">No category distribution data.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-text)' }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-card border border-border shadow-modal rounded-xl p-2.5 text-xs">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-accent-500 font-mono mt-0.5">Value: {item.value}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
