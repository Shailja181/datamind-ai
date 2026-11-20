import { api } from './api';
import { GeneratedReport } from '../types';

export const reportService = {
  async generateReport(datasetId: string, options?: { includeMl?: boolean; includeAnomalies?: boolean }): Promise<GeneratedReport> {
    const res = await api.post(`/api/reports/generate`, {
      dataset_id: datasetId,
      include_ml: options?.includeMl ?? true,
      include_anomalies: options?.includeAnomalies ?? true,
    });
    return res.data;
  },

  async listReports(): Promise<GeneratedReport[]> {
    const res = await api.get('/api/reports');
    return res.data;
  },
};
