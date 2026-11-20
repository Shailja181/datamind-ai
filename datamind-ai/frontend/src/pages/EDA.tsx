import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { analyticsService } from '../services/analyticsService';
import { EDAResult } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { DataSummaryCard } from '../components/data/DataSummaryCard';
import { CorrelationMatrix } from '../components/charts/CorrelationMatrix';
import { HistogramChart } from '../components/charts/HistogramChart';
import { BoxPlotChart } from '../components/charts/BoxPlotChart';
import { DistributionBarChart } from '../components/charts/DistributionBarChart';
import { ScatterPlotChart } from '../components/charts/ScatterPlotChart';
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Table,
  CheckCircle2,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const EDA: React.FC = () => {
  const { selectedDataset } = useDataset();

  const [eda, setEda] = useState<EDAResult | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected column for detailed distribution
  const [activeNumCol, setActiveNumCol] = useState<string>('');
  const [scatterXCol, setScatterXCol] = useState<string>('');
  const [scatterYCol, setScatterYCol] = useState<string>('');

  const loadEDA = async (did: string) => {
    try {
      setLoading(true);
      setError(null);
      const [edaRes, previewRes] = await Promise.all([
        analyticsService.getEDA(did),
        analyticsService.getEDA(did).then(() =>
          // fetch preview to compute scatter/histograms from actual data
          fetch(`http://127.0.0.1:8000/api/datasets/${did}/preview?n=150`).then(r => r.json())
        ),
      ]);
      setEda(edaRes);
      setPreviewData(previewRes || []);

      if (edaRes.column_types.numeric.length > 0) {
        setActiveNumCol(edaRes.column_types.numeric[0]);
        setScatterXCol(edaRes.column_types.numeric[0]);
        setScatterYCol(
          edaRes.column_types.numeric.length > 1
            ? edaRes.column_types.numeric[1]
            : edaRes.column_types.numeric[0]
        );
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to generate EDA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDataset) {
      loadEDA(selectedDataset.id);
    } else {
      setEda(null);
    }
  }, [selectedDataset]);

  // Extract numerical values array for histogram
  const numColValues = React.useMemo(() => {
    if (!activeNumCol || !previewData) return [];
    return previewData
      .map((row) => Number(row[activeNumCol]))
      .filter((v) => !isNaN(v));
  }, [activeNumCol, previewData]);

  // Scatter plot points
  const scatterPoints = React.useMemo(() => {
    if (!scatterXCol || !scatterYCol || !previewData) return [];
    return previewData
      .map((row, idx) => ({
        x: Number(row[scatterXCol]),
        y: Number(row[scatterYCol]),
        label: `Row #${idx + 1}`,
      }))
      .filter((pt) => !isNaN(pt.x) && !isNaN(pt.y));
  }, [scatterXCol, scatterYCol, previewData]);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select an active dataset from the top navigation to view automated exploratory data analysis."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Automated EDA Engine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statistical distributions, correlation analysis, and data cleanliness metrics for {selectedDataset.name}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadEDA(selectedDataset.id)}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Analyze
        </Button>
      </div>

      {error && (
        <ErrorAlert message={error} onRetry={() => loadEDA(selectedDataset.id)} />
      )}

      {loading && !eda ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : eda ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <DataSummaryCard eda={eda} />

          {/* AI-Derived Insights */}
          {eda.insights && eda.insights.length > 0 && (
            <Card>
              <CardHeader
                title="Automated Statistical Insights"
                subtitle="Calculated strictly from numerical data properties without hallucination"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {eda.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Descriptive Statistics Table */}
          <Card>
            <CardHeader
              title="Descriptive Statistics (Parametric & Non-Parametric)"
              subtitle="Mean, median, variance, standard deviation, and quartiles"
            />
            {Object.keys(eda.descriptive).length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                No numeric columns available for descriptive statistics.
              </p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border text-foreground font-semibold">
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Mean</th>
                      <th className="py-2 px-3">Std Dev</th>
                      <th className="py-2 px-3">Median</th>
                      <th className="py-2 px-3">Variance</th>
                      <th className="py-2 px-3">Min</th>
                      <th className="py-2 px-3">25% (Q1)</th>
                      <th className="py-2 px-3">75% (Q3)</th>
                      <th className="py-2 px-3">Max</th>
                      <th className="py-2 px-3">IQR Outliers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {Object.entries(eda.descriptive).map(([col, stats]) => (
                      <tr key={col} className="hover:bg-muted/40">
                        <td className="py-2 px-3 font-semibold text-foreground">{col}</td>
                        <td className="py-2 px-3">{formatNumber(stats.mean)}</td>
                        <td className="py-2 px-3">{formatNumber(stats.std)}</td>
                        <td className="py-2 px-3 font-semibold text-brand-500">{formatNumber(stats.median)}</td>
                        <td className="py-2 px-3">{formatNumber(stats.variance)}</td>
                        <td className="py-2 px-3">{formatNumber(stats.min)}</td>
                        <td className="py-2 px-3">{formatNumber(stats['25%'])}</td>
                        <td className="py-2 px-3">{formatNumber(stats['75%'])}</td>
                        <td className="py-2 px-3">{formatNumber(stats.max)}</td>
                        <td className="py-2 px-3">
                          {eda.outliers_iqr[col] ? (
                            <span className="text-warning font-semibold">
                              {eda.outliers_iqr[col]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Correlation Heatmap */}
          <Card>
            <CardHeader
              title="Feature Correlation Matrix"
              subtitle="Pearson correlation coefficient (r) between all numerical attributes"
            />
            <CorrelationMatrix correlation={eda.correlation} />
          </Card>

          {/* Interactive Distribution Histogram & Boxplot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Frequency Distribution Histogram"
                subtitle="Binned density visualization of numerical features"
                action={
                  <select
                    value={activeNumCol}
                    onChange={(e) => setActiveNumCol(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    {eda.column_types.numeric.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                }
              />
              <HistogramChart data={numColValues} columnName={activeNumCol} />
            </Card>

            <Card>
              <CardHeader
                title="Quartile Spread & Box Plots"
                subtitle="Visualizing min, median, interquartile ranges, and bounds"
              />
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Object.entries(eda.descriptive).map(([col, stats]) => (
                  <BoxPlotChart key={col} stats={stats} columnName={col} />
                ))}
              </div>
            </Card>
          </div>

          {/* Bivariate Scatter Plot */}
          {eda.column_types.numeric.length > 1 && (
            <Card>
              <CardHeader
                title="Bivariate Correlation Scatter Plot"
                subtitle="Inspect relationships, linear tendencies, and cluster groupings"
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">X:</span>
                    <select
                      value={scatterXCol}
                      onChange={(e) => setScatterXCol(e.target.value)}
                      className="px-2 py-1 rounded-xl border border-border bg-card text-xs text-foreground"
                    >
                      {eda.column_types.numeric.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>

                    <span className="text-xs text-muted-foreground ml-2">Y:</span>
                    <select
                      value={scatterYCol}
                      onChange={(e) => setScatterYCol(e.target.value)}
                      className="px-2 py-1 rounded-xl border border-border bg-card text-xs text-foreground"
                    >
                      {eda.column_types.numeric.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                }
              />
              <ScatterPlotChart
                data={scatterPoints}
                xLabel={scatterXCol}
                yLabel={scatterYCol}
              />
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
};
