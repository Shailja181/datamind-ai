import { api } from './api';
import { ChatMessage } from '../types';

export const aiService = {
  async sendMessage(datasetId: string, query: string, history: ChatMessage[] = []): Promise<ChatMessage> {
    const res = await api.post('/api/ai/chat', {
      dataset_id: datasetId,
      query,
      history: history.map(m => ({ role: m.role, content: m.content })),
    });
    return res.data;
  },

  async getSuggestedQueries(datasetId: string): Promise<string[]> {
    const res = await api.get(`/api/ai/suggestions`, {
      params: { dataset_id: datasetId },
    });
    return res.data.suggestions;
  },
};
