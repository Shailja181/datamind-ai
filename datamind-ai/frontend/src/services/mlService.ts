import { api } from './api';
import { MLTrainRequest, MLTrainResult } from '../types';

export const mlService = {
  async trainModel(req: MLTrainRequest): Promise<MLTrainResult> {
    const res = await api.post('/api/ml/train', req);
    return res.data;
  },

  async getSupportedModels(): Promise<Array<{
    id: string;
    name: string;
    type: 'regression' | 'classification' | 'clustering' | 'anomaly_detection';
    description: string;
    params: Array<{ name: string; type: string; default: any; description: string }>;
  }>> {
    const res = await api.get('/api/ml/models');
    return res.data;
  },
};
