import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useDataset } from '../../contexts/DatasetContext';
import { Button } from '../common/Button';
import { formatBytes } from '../../utils/formatters';

interface UploadDropzoneProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onSuccess, onCancel }) => {
  const { uploadDataset } = useDataset();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (f: File) => {
    setError(null);
    const validExts = ['.csv', '.xlsx', '.xls'];
    const name = f.name.toLowerCase();
    const hasValidExt = validExts.some(ext => name.endsWith(ext));

    if (!hasValidExt) {
      setError('Unsupported file type. Please upload a .csv or .xlsx file.');
      return;
    }

    if (f.size > 25 * 1024 * 1024) {
      setError('File exceeds maximum size of 25 MB.');
      return;
    }

    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      await uploadDataset(file);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setUploading(true);
      setError(null);
      // Fetch the sample sales.csv file bundled with the project or create blob
      const sampleCsv = `date,product,units,price,revenue
2025-01-01,Laptop,7,476.63,3336.41
2025-01-02,Monitor,16,491.72,7867.52
2025-01-03,Monitor,1,479.84,479.84
2025-01-04,Tablet,18,512.21,9219.78
2025-01-05,Tablet,11,617.72,6794.92
2025-01-06,Mouse,3,294.67,884.01
2025-01-07,Laptop,6,481.05,2886.30
2025-01-08,Monitor,11,514.12,5655.32
2025-01-09,Phone,6,523.68,3142.08
2025-01-10,Laptop,3,470.25,1410.75
2025-01-11,Tablet,13,359.46,37383.84
2025-01-12,Mouse,13,526.24,6841.12
2025-01-13,Monitor,3,638.19,1914.57
2025-01-14,Monitor,6,377.29,2263.74
2025-01-15,Monitor,5,569.11,2845.55
2025-01-16,Monitor,13,473.72,6158.36
2025-01-17,Tablet,14,495.09,6931.26
2025-01-18,Laptop,14,415.77,5820.78
2025-01-19,Mouse,18,473.24,8518.32
2025-01-20,Tablet,15,604.00,9060.00
2025-01-21,Tablet,7,546.61,3826.27
2025-01-22,Phone,3,638.58,1915.74
2025-01-23,Laptop,12,594.19,7130.28
2025-01-24,Mouse,18,535.13,9632.34
2025-01-25,Monitor,14,582.40,8153.60
2025-01-26,Tablet,9,410.00,3690.00
2025-01-27,Phone,19,650.00,12350.00
2025-01-28,Laptop,8,520.00,4160.00
2025-01-29,Mouse,22,480.00,10560.00
2025-01-30,Monitor,10,495.00,4950.00`;
      const blob = new Blob([sampleCsv], { type: 'text/csv' });
      const sampleFile = new File([blob], 'sales_performance_2025.csv', { type: 'text/csv' });
      await uploadDataset(sampleFile);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load sample dataset.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-border hover:border-brand-500/50 hover:bg-card-hover'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSet(e.target.files[0]);
            }
          }}
          accept=".csv,.xlsx,.xls"
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CSV, Excel (.xlsx, .xls) up to 25 MB
          </p>
        </div>
      </div>

      {/* Selected File Card */}
      {file && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-subtle">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-brand-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLoadSample}
          disabled={uploading}
          icon={<Sparkles className="w-3.5 h-3.5 text-brand-500" />}
          className="text-xs"
        >
          Load Sample Sales Dataset
        </Button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!file || uploading}
            loading={uploading}
          >
            {uploading ? 'Processing...' : 'Upload & Analyze'}
          </Button>
        </div>
      </div>
    </div>
  );
};
