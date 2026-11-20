import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EDAResult } from '../../types';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { Database, ShieldCheck, AlertCircle, CopyCheck, Hash } from 'lucide-react';

interface DataSummaryCardProps {
  eda: EDAResult;
}

export const DataSummaryCard: React.FC<DataSummaryCardProps> = ({ eda }) => {
  const missingCount = Object.values(eda.missing).reduce((acc, curr) => acc + curr, 0);

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'success' as const, label: 'Excellent' };
    if (score >= 75) return { variant: 'brand' as const, label: 'Good' };
    if (score >= 50) return { variant: 'warning' as const, label: 'Fair' };
    return { variant: 'error' as const, label: 'Needs Cleaning' };
  };

  const scoreBadge = getScoreBadge(eda.quality_score);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card className="p-4 bg-card">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">Total Rows</span>
          <Database className="w-4 h-4 text-brand-500" />
        </div>
        <div className="text-xl font-bold text-foreground font-mono">
          {eda.rows.toLocaleString()}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">Records in memory</p>
      </Card>

      <Card className="p-4 bg-card">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">Columns</span>
          <Hash className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="text-xl font-bold text-foreground font-mono">
          {eda.columns}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {eda.column_types.numeric.length} num • {eda.column_types.categorical.length} cat
        </p>
      </Card>

      <Card className="p-4 bg-card">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">Quality Score</span>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-bold text-foreground font-mono">
            {eda.quality_score}%
          </div>
          <Badge variant={scoreBadge.variant} size="sm">
            {scoreBadge.label}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">Automated validation</p>
      </Card>

      <Card className="p-4 bg-card">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">Missing Values</span>
          <AlertCircle className="w-4 h-4 text-warning" />
        </div>
        <div className="text-xl font-bold text-foreground font-mono">
          {missingCount}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {Object.keys(eda.missing).length} affected columns
        </p>
      </Card>

      <Card className="p-4 bg-card col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">Duplicate Rows</span>
          <CopyCheck className="w-4 h-4 text-accent-500" />
        </div>
        <div className="text-xl font-bold text-foreground font-mono">
          {eda.duplicates}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatPercent((eda.duplicates / Math.max(eda.rows, 1)) * 100)} of dataset
        </p>
      </Card>
    </div>
  );
};
