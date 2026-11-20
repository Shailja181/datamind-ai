import { api } from './api';
import { MCPToolInfo, MCPExecutionLog } from '../types';

export const mcpService = {
  async getStatus(): Promise<{
    server_name: string;
    status: 'connected' | 'disconnected' | 'connecting';
    transport: string;
    tools_count: number;
    uptime_seconds?: number;
    version: string;
  }> {
    const res = await api.get('/api/mcp/status');
    return res.data;
  },

  async getTools(): Promise<MCPToolInfo[]> {
    const res = await api.get('/api/mcp/tools');
    return res.data;
  },

  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    const res = await api.post('/api/mcp/execute', {
      tool: toolName,
      arguments: parameters,
    });
    return res.data;
  },

  async getExecutionLogs(): Promise<MCPExecutionLog[]> {
    const res = await api.get('/api/mcp/logs');
    return res.data;
  },
};
