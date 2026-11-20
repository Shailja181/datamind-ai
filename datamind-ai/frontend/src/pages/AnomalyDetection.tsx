import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { analyticsService } from '../services/analyticsService';
import { AnomalyResult } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ScatterPlotChart } from '../components/charts/ScatterPlotChart';
import {
  AlertOctagon,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

export const AnomalyDetection: React.FC = () => {
  const { selectedDataset } = useDataset();

  const [method, setMethod] = useState<'iqr' | 'zscore' | 'isolation_forest'>('iqr');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [result, setResult] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select numeric columns on dataset load
  useEffect(() => {
    if (selectedDataset && selectedDataset.column_types) {
      setSelectedColumns(selectedDataset.column_types.numeric || []);
    }
  }, [selectedDataset]);

  const runDetection = async () => {
    if (!selectedDataset) return;
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnomalies(
        selectedDataset.id,
        method,
        selectedColumns
      );
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to detect anomalies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDataset && selectedColumns.length > 0) {
      runDetection();
    }
  }, [selectedDataset?.id, method]);

  const handleExportCSV = () => {
    if (!result || !result.records.length) return;
    const headers = Object.keys(result.records[0]);
    const csvContent = [
      headers.join(','),
      ...result.records.map(r =>
        headers.map(h => {
          const val = r[h] ?? '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDataset?.name || 'dataset'}_anomalies_${method}.csv`;
    a.click();
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset to run automated statistical and machine learning anomaly detection algorithms."
        icon={<AlertOctagon className="w-10 h-10 text-muted-foreground stroke-[1.5]" />}
      />
    );
  }

  const numericCols = selectedDataset.column_types?.numeric || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Anomaly Detection</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify unusual records, multivariate outliers, and data drift on {selectedDataset.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={runDetection}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Detection
          </Button>
          {result && result.records.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export Outliers
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={runDetection} />}

      {/* Method & Column Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">Algorithm:</span>
            <div className="flex rounded-xl p-1 bg-muted border border-border">
              <button
                onClick={() => setMethod('iqr')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  method === 'iqr'
                    ? 'bg-card text-foreground font-semibold shadow-subtle'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                IQR (Tukey's Fences)
              </button>
              <button
                onClick={() => setMethod('zscore')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  method === 'zscore'
                    ? 'bg-card text-foreground font-semibold shadow-subtle'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Z-Score (Gaussian 3σ)
              </button>
              <button
                onClick={() => setMethod('isolation_forest')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  method === 'isolation_forest'
                    ? 'bg-card text-foreground font-semibold shadow-subtle'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Isolation Forest (ML)
              </button>
            </div>
          </div>

          {/* Column selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Columns:</span>
            <div className="flex flex-wrap gap-1.5">
              {numericCols.map((c) => {
                const isSelected = selectedColumns.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedColumns((prev) =>
                        isSelected ? prev.filter((col) => col !== c) : [...prev, c]
                      );
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors border ${
                      isSelected
                        ? 'bg-brand-500/10 text-brand-500 border-brand-500/20 font-semibold'
                        : 'bg-muted/60 text-muted-foreground border-border'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Anomalous Records</span>
              <ShieldAlert className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {result.count}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Detected by {result.method.toUpperCase()}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Contamination Rate</span>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {formatPercent(result.percent)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Percentage of dataset</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Monitored Dimensions</span>
              <Filter className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {result.columns.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Active numerical features</p>
          </Card>
        </div>
      )}

      {/* Anomalies Table */}
      <Card>
        <CardHeader
          title="Detected Outlier Records"
          subtitle={
            result
              ? `Showing ${result.records.length} of ${result.count} anomalous rows`
              : 'Execute detection to populate'
          }
        />

        {loading ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !result || result.records.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No anomalous records found under current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/60 border-b border-border text-foreground font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  {Object.keys(result.records[0]).map((h) => (
                    <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {result.records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-warning/5 transition-colors">
                    <td className="py-2 px-3 text-center text-muted-foreground text-[10px]">
                      {idx + 1}
                    </td>
                    {Object.keys(row).map((k) => (
                      <td key={k} className="py-2 px-3 whitespace-nowrap">
                        {String(row[k] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
