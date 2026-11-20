import { api } from './api';
import { EDAResult, AnomalyResult, ColumnSummary } from '../types';

export const analyticsService = {
  async getEDA(datasetId: string): Promise<EDAResult> {
    const res = await api.get(`/api/datasets/${datasetId}/eda`);
    return res.data;
  },

  async getAnomalies(
    datasetId: string,
    method: 'iqr' | 'zscore' | 'isolation_forest' = 'iqr',
    columns: string[] = []
  ): Promise<AnomalyResult> {
    const params: Record<string, string> = { method };
    if (columns.length > 0) {
      params.columns = columns.join(',');
    }
    const res = await api.get(`/api/datasets/${datasetId}/anomalies`, { params });
    return res.data;
  },

  async getColumnSummary(datasetId: string, column: string): Promise<ColumnSummary> {
    const res = await api.get(`/api/datasets/${datasetId}/summary`, {
      params: { column },
    });
    return res.data;
  },

  async queryDataset(
    datasetId: string,
    groupBy: string,
    valueColumn: string,
    aggregation: string = 'sum',
    topN: number = 10
  ): Promise<any> {
    const res = await api.post(`/api/datasets/${datasetId}/query`, {
      group_by: groupBy,
      value: valueColumn,
      agg: aggregation,
      top_n: topN,
    });
    return res.data;
  },
};
