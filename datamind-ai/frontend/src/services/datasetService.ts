import { api } from './api';
import { DatasetMeta } from '../types';

export const datasetService = {
  async checkHealth(): Promise<{ status: string }> {
    const res = await api.get('/api/health');
    return res.data;
  },

  async getAll(): Promise<DatasetMeta[]> {
    const res = await api.get('/api/datasets');
    return res.data;
  },

  async upload(file: File): Promise<DatasetMeta> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getPreview(datasetId: string, limit = 50): Promise<Record<string, any>[]> {
    const res = await api.get(`/api/datasets/${datasetId}/preview`, {
      params: { n: limit },
    });
    return res.data;
  },
};
