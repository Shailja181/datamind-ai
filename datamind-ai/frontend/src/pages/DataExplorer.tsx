import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { datasetService } from '../services/datasetService';
import { analyticsService } from '../services/analyticsService';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { DatasetTable } from '../components/data/DatasetTable';
import { UploadDropzone } from '../components/data/UploadDropzone';
import { Modal } from '../components/common/Modal';
import { Download, Upload, RefreshCw, Database, Columns, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

export const DataExplorer: React.FC = () => {
  const { datasets, selectedDataset, selectDataset } = useDataset();

  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedColSummary, setSelectedColSummary] = useState<any>(null);
  const [loadingColSummary, setLoadingColSummary] = useState(false);

  const fetchPreview = async (did: string) => {
    try {
      setLoading(true);
      setError(null);
      const rows = await datasetService.getPreview(did, 100);
      setPreviewRows(rows);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to fetch dataset preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDataset) {
      fetchPreview(selectedDataset.id);
      setSelectedColSummary(null);
    } else {
      setPreviewRows([]);
    }
  }, [selectedDataset]);

  const handleDownloadCSV = () => {
    if (!previewRows || previewRows.length === 0) return;
    const headers = Object.keys(previewRows[0]);
    const csvContent = [
      headers.join(','),
      ...previewRows.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset?.name || 'dataset'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectColumn = async (col: string) => {
    if (!selectedDataset) return;
    try {
      setLoadingColSummary(true);
      const summary = await analyticsService.getColumnSummary(selectedDataset.id, col);
      setSelectedColSummary(summary);
    } catch (err) {
      console.warn('Column summary fetch error:', err);
    } finally {
      setLoadingColSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Dataset Explorer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspect raw records, audit column schemas, and validate data cleanliness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload File
          </Button>
          {previewRows.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadCSV}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => selectedDataset && fetchPreview(selectedDataset.id)}
        />
      )}

      {!selectedDataset ? (
        <EmptyState
          title="No Dataset Selected"
          description="Select an existing dataset from the top navigation bar or upload a new CSV / Excel file."
          actionText="Upload Dataset"
          onAction={() => setUploadModalOpen(true)}
          icon={<FileSpreadsheet className="w-10 h-10 text-muted-foreground stroke-[1.5]" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Metadata Overview Card */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedDataset.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {selectedDataset.id}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border">
                  <span className="text-muted-foreground mr-1.5">Rows:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedDataset.rows.toLocaleString()}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border">
                  <span className="text-muted-foreground mr-1.5">Columns:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedDataset.columns}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchPreview(selectedDataset.id)}
                  loading={loading}
                  icon={<RefreshCw className="w-3 h-3" />}
                  className="h-8 px-2 text-xs"
                >
                  Reload
                </Button>
              </div>
            </div>

            {/* Quick Column Badges with Click to Inspect */}
            {selectedDataset.column_types && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                  Dataset Columns (Click to inspect summary stats):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDataset.column_types.numeric.map((col) => (
                    <button
                      key={col}
                      onClick={() => handleInspectColumn(col)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-mono font-medium hover:bg-blue-500/20 transition-colors"
                      title="Numeric Column"
                    >
                      # {col}
                    </button>
                  ))}
                  {selectedDataset.column_types.categorical.map((col) => (
                    <button
                      key={col}
                      onClick={() => handleInspectColumn(col)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-mono font-medium hover:bg-emerald-500/20 transition-colors"
                      title="Categorical Column"
                    >
                      Aa {col}
                    </button>
                  ))}
                  {selectedDataset.column_types.datetime.map((col) => (
                    <button
                      key={col}
                      onClick={() => handleInspectColumn(col)}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 text-xs font-mono font-medium hover:bg-purple-500/20 transition-colors"
                      title="Datetime Column"
                    >
                      📅 {col}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Column Summary Drawer if clicked */}
          {selectedColSummary && (
            <Card className="border-brand-500/30 bg-card">
              <CardHeader
                title={`Column Summary: ${selectedColSummary.column}`}
                subtitle={`Type: ${selectedColSummary.dtype} • Unique values: ${selectedColSummary.unique} • Missing: ${selectedColSummary.missing}`}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedColSummary(null)}
                    className="text-xs h-6 px-2"
                  >
                    Close
                  </Button>
                }
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                {selectedColSummary.mean !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Mean</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.mean)}</p>
                  </div>
                )}
                {selectedColSummary.median !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Median</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.median)}</p>
                  </div>
                )}
                {selectedColSummary.std !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Std Dev</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.std)}</p>
                  </div>
                )}
                {selectedColSummary.min !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Min</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.min)}</p>
                  </div>
                )}
                {selectedColSummary.max !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Max</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.max)}</p>
                  </div>
                )}
                {selectedColSummary.skew !== undefined && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground">Skewness</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{formatNumber(selectedColSummary.skew)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Interactive Preview Table */}
          <Card>
            <CardHeader
              title="Dataset Records Preview"
              subtitle={`Showing first ${previewRows.length} rows loaded directly from engine memory`}
            />

            {loading ? (
              <div className="space-y-3 py-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <DatasetTable
                data={previewRows}
                columnTypes={selectedDataset.column_types}
                totalRows={selectedDataset.rows}
              />
            )}
          </Card>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Dataset"
        description="Upload a CSV or Excel file (.csv, .xlsx, .xls) to analyze"
      >
        <UploadDropzone
          onSuccess={() => setUploadModalOpen(false)}
          onCancel={() => setUploadModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
