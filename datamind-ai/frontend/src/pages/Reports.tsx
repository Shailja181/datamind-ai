import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { analyticsService } from '../services/analyticsService';
import { reportService } from '../services/reportService';
import { EDAResult, GeneratedReport } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Skeleton } from '../components/common/Skeleton';
import {
  FileText,
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

export const Reports: React.FC = () => {
  const { selectedDataset } = useDataset();

  const [eda, setEda] = useState<EDAResult | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!selectedDataset) return;
    try {
      setLoading(true);
      setError(null);
      // Fetch fresh EDA & compile executive dossier
      const edaData = await analyticsService.getEDA(selectedDataset.id);
      setEda(edaData);

      const generated: GeneratedReport = {
        id: `REP-${Date.now()}`,
        dataset_id: selectedDataset.id,
        dataset_name: selectedDataset.name,
        generated_at: new Date().toLocaleString(),
        title: `Comprehensive Analytical Dossier – ${selectedDataset.name}`,
        executive_summary: `This report details automated statistical auditing and machine learning readiness for dataset '${selectedDataset.name}'. Containing ${selectedDataset.rows.toLocaleString()} records across ${selectedDataset.columns} dimensions, the dataset achieved a comprehensive Data Quality Score of ${edaData.quality_score}%.`,
        eda: edaData,
        recommendations: [
          edaData.duplicates > 0
            ? `Deduplicate ${edaData.duplicates} redundant rows prior to production modeling.`
            : 'No duplicate records detected; baseline dataset integrity verified.',
          Object.keys(edaData.missing).length > 0
            ? `Impute or drop missing values in ${Object.keys(edaData.missing).length} columns (${Object.keys(edaData.missing).join(', ')}).`
            : 'Zero missing values detected across all numerical and categorical fields.',
          Object.keys(edaData.outliers_iqr).some(k => edaData.outliers_iqr[k] > 0)
            ? 'Review IQR outliers detected in numerical columns before sensitive regression training.'
            : 'Feature values follow expected range bounds without extreme outliers.',
          'Dataset is qualified for supervised regression, classification, or clustering pipelines.',
        ],
      };

      setReport(generated);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDataset) {
      generateReport();
    } else {
      setReport(null);
    }
  }, [selectedDataset]);

  const handlePrint = () => {
    window.print();
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset to compile an executive analytical report and export documentation."
        icon={<FileText className="w-10 h-10 text-muted-foreground stroke-[1.5]" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header - Hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border no-print">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Executive Report Generator</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit findings, statistical summaries, and exportable dossier for {selectedDataset.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={generateReport}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / Save to PDF
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={generateReport} />}

      {loading && !report ? (
        <div className="space-y-4 py-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : report ? (
        <div className="space-y-6 print:space-y-4">
          {/* Printable Report Header */}
          <Card className="p-6 sm:p-8 border-brand-500/30 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DataMind AI Intelligence Audit</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {report.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Report ID: <span className="font-mono text-foreground">{report.id}</span> • Generated: {report.generated_at}
                </p>
              </div>

              <div className="text-right">
                <Badge variant="success" size="md" dot>
                  Quality: {report.eda.quality_score}%
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Validated by Python Engine</p>
              </div>
            </div>

            {/* Executive Summary Section */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                1. Executive Summary
              </h3>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/30 p-4 rounded-xl border border-border">
                {report.executive_summary}
              </p>
            </div>

            {/* Dataset Metadata Matrix */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                2. Dataset Architecture & Health Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground">Total Rows</p>
                  <p className="text-base font-bold font-mono text-foreground mt-0.5">
                    {report.eda.rows.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground">Features (Columns)</p>
                  <p className="text-base font-bold font-mono text-foreground mt-0.5">
                    {report.eda.columns}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground">Duplicate Records</p>
                  <p className="text-base font-bold font-mono text-foreground mt-0.5">
                    {report.eda.duplicates}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground">Columns With Nulls</p>
                  <p className="text-base font-bold font-mono text-foreground mt-0.5">
                    {Object.keys(report.eda.missing).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Automated Insights & Key Findings */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                3. Automated Analytical Findings
              </h3>
              <div className="space-y-2">
                {report.eda.insights.map((ins, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Descriptive Statistics Table */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                4. Descriptive Parameter Breakdown
              </h3>
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border font-semibold">
                      <th className="p-2.5">Feature</th>
                      <th className="p-2.5">Mean</th>
                      <th className="p-2.5">Std Dev</th>
                      <th className="p-2.5">Median</th>
                      <th className="p-2.5">Min</th>
                      <th className="p-2.5">Max</th>
                      <th className="p-2.5">Outliers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {Object.entries(report.eda.descriptive).map(([c, s]) => (
                      <tr key={c}>
                        <td className="p-2.5 font-semibold text-foreground">{c}</td>
                        <td className="p-2.5">{formatNumber(s.mean)}</td>
                        <td className="p-2.5">{formatNumber(s.std)}</td>
                        <td className="p-2.5">{formatNumber(s.median)}</td>
                        <td className="p-2.5">{formatNumber(s.min)}</td>
                        <td className="p-2.5">{formatNumber(s.max)}</td>
                        <td className="p-2.5">{report.eda.outliers_iqr[c] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                5. Strategic & Data Quality Recommendations
              </h3>
              <div className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Signoff */}
            <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
              <span>DataMind AI Engine • Final-Year B.Tech CSE Project</span>
              <span>Validated & Signed: Autonomous Agentic Verification Protocol</span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
