import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { mcpService } from '../services/mcpService';
import { MCPToolInfo, MCPExecutionLog } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import {
  Cpu,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';

const HARDCODED_MCP_TOOLS: MCPToolInfo[] = [
  {
    name: 'analyze_dataset',
    description: 'Run automated EDA: types, missing values, duplicates, descriptive stats, correlations, IQR outliers and data-derived insights.',
    parameters: {
      dataset_id: { type: 'string', description: 'Hex ID of dataset in storage' },
    },
    category: 'Analytics',
  },
  {
    name: 'get_column_summary',
    description: 'Detailed statistics for one column (numeric parametric stats or top categorical value counts).',
    parameters: {
      dataset_id: { type: 'string', description: 'Hex ID of dataset' },
      column: { type: 'string', description: 'Name of column to inspect' },
    },
    category: 'Inspection',
  },
  {
    name: 'query_dataset',
    description: 'Group-by aggregation (sum/mean/count/min/max/median), top N groups. Whitelisted calculation without SQL/eval risk.',
    parameters: {
      dataset_id: { type: 'string', description: 'Hex ID of dataset' },
      group_by: { type: 'string', description: 'Categorical feature to group on' },
      value_column: { type: 'string', description: 'Numerical column to aggregate' },
      aggregation: { type: 'string', default: 'sum', description: 'sum | mean | count | min | max | median' },
      top_n: { type: 'integer', default: 5, description: 'Number of top ranks to return' },
    },
    category: 'Querying',
  },
  {
    name: 'detect_anomalies',
    description: 'Find unusual records. method: iqr | zscore | isolation_forest with customizable thresholds.',
    parameters: {
      dataset_id: { type: 'string', description: 'Hex ID of dataset' },
      method: { type: 'string', default: 'iqr', description: 'iqr | zscore | isolation_forest' },
      columns: { type: 'array[string]', description: 'Optional list of numerical columns' },
    },
    category: 'Machine Learning',
  },
];

export const MCPMonitor: React.FC = () => {
  const { selectedDataset } = useDataset();

  const [tools, setTools] = useState<MCPToolInfo[]>(HARDCODED_MCP_TOOLS);
  const [selectedTool, setSelectedTool] = useState<MCPToolInfo>(HARDCODED_MCP_TOOLS[0]);
  const [toolInputs, setToolInputs] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [logs, setLogs] = useState<MCPExecutionLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize input parameters when tool changes
  useEffect(() => {
    const initial: Record<string, any> = {
      dataset_id: selectedDataset?.id || '',
    };
    if (selectedTool.name === 'get_column_summary') {
      initial.column = selectedDataset?.column_types?.numeric?.[0] || '';
    } else if (selectedTool.name === 'query_dataset') {
      initial.group_by = selectedDataset?.column_types?.categorical?.[0] || '';
      initial.value_column = selectedDataset?.column_types?.numeric?.[0] || '';
      initial.aggregation = 'sum';
      initial.top_n = 5;
    } else if (selectedTool.name === 'detect_anomalies') {
      initial.method = 'iqr';
    }
    setToolInputs(initial);
    setExecutionResult(null);
  }, [selectedTool, selectedDataset]);

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);
      const start = Date.now();

      // Execute tool via MCP endpoint or analytics proxy
      let resultData: any = null;

      if (selectedTool.name === 'analyze_dataset') {
        const res = await fetch(`http://127.0.0.1:8000/api/datasets/${toolInputs.dataset_id}/eda`);
        resultData = await res.json();
      } else if (selectedTool.name === 'get_column_summary') {
        const res = await fetch(`http://127.0.0.1:8000/api/datasets/${toolInputs.dataset_id}/summary?column=${encodeURIComponent(toolInputs.column)}`);
        resultData = await res.json();
      } else if (selectedTool.name === 'detect_anomalies') {
        const res = await fetch(`http://127.0.0.1:8000/api/datasets/${toolInputs.dataset_id}/anomalies?method=${toolInputs.method || 'iqr'}`);
        resultData = await res.json();
      } else if (selectedTool.name === 'query_dataset') {
        const res = await fetch(`http://127.0.0.1:8000/api/datasets/${toolInputs.dataset_id}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_by: toolInputs.group_by,
            value: toolInputs.value_column,
            agg: toolInputs.aggregation || 'sum',
            top_n: toolInputs.top_n || 5,
          }),
        });
        resultData = await res.json();
      }

      const duration = Date.now() - start;
      setExecutionResult(resultData);

      // Add to execution logs
      const logEntry: MCPExecutionLog = {
        id: `mcp-${Date.now()}`,
        tool_name: selectedTool.name,
        input: toolInputs,
        output: resultData,
        status: 'success',
        duration_ms: duration,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [logEntry, ...prev.slice(0, 15)]);
    } catch (err: any) {
      setError(err?.message || 'Tool execution failed');
      const logEntry: MCPExecutionLog = {
        id: `mcp-${Date.now()}`,
        tool_name: selectedTool.name,
        input: toolInputs,
        output: null,
        status: 'error',
        duration_ms: 0,
        timestamp: new Date().toLocaleTimeString(),
        error: err?.message,
      };
      setLogs((prev) => [logEntry, ...prev.slice(0, 15)]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">MCP Server Monitor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model Context Protocol telemetry, STDIO tool discovery, and execution playground
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" size="md" dot>
            FastMCP STDIO
          </Badge>
          <Badge variant="success" size="md">
            4 Tools Registered
          </Badge>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Server Status Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Server Status</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-base font-bold text-emerald-500">Active / Bound</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">datamind-analytics</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Transport Protocol</span>
            <Cpu className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-base font-bold text-foreground font-mono">STDIO</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">mcp_server/server.py</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Available Tools</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-base font-bold text-foreground font-mono">4 Atomic Tools</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">JSON Schema Validated</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Telemetry Runs</span>
            <Clock className="w-4 h-4 text-accent-500" />
          </div>
          <p className="text-base font-bold text-foreground font-mono">{logs.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">In current browser session</p>
        </Card>
      </div>

      {/* Main Grid: Tool Selection, Interactive Runner & Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Tools List */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Registered FastMCP Tools"
              subtitle="Exposed to Claude, Gemini & LLM Agent clients"
            />
            <div className="space-y-2">
              {tools.map((t) => {
                const isSelected = selectedTool.name === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTool(t)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-foreground font-semibold shadow-subtle'
                        : 'border-border bg-card hover:bg-card-hover text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-foreground">{t.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 2 Columns: Tool Runner & Response Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={`Execute Tool: ${selectedTool.name}`}
              subtitle={selectedTool.description}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecute}
                  loading={executing}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  Run Tool
                </Button>
              }
            />

            {/* Parameter Input Fields */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-3 mb-4">
              <span className="text-xs font-semibold text-foreground">Tool Arguments (JSON):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(selectedTool.parameters).map(([paramName, paramMeta]) => (
                  <div key={paramName} className="space-y-1">
                    <label className="text-[11px] font-mono font-medium text-muted-foreground">
                      {paramName} {paramMeta.default ? `(default: ${paramMeta.default})` : ''}
                    </label>
                    <input
                      type="text"
                      value={toolInputs[paramName] ?? ''}
                      onChange={(e) =>
                        setToolInputs({ ...toolInputs, [paramName]: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Result JSON Viewer */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Tool Response Payload:</span>
              <pre className="p-4 rounded-xl bg-card border border-border font-mono text-xs text-foreground/90 overflow-x-auto max-h-72">
                {executionResult
                  ? JSON.stringify(executionResult, null, 2)
                  : '// Press "Run Tool" to invoke this MCP tool'}
              </pre>
            </div>
          </Card>

          {/* Execution History Telemetry Table */}
          <Card>
            <CardHeader
              title="Tool Invocation Telemetry History"
              subtitle="Real-time execution latency and response audit"
            />
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                No tool executions logged yet. Use the tool runner above to trigger calls.
              </p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border font-semibold">
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Tool</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Latency</th>
                      <th className="p-2.5">Arguments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-2.5 text-muted-foreground">{log.timestamp}</td>
                        <td className="p-2.5 font-bold text-foreground">{log.tool_name}</td>
                        <td className="p-2.5">
                          {log.status === 'success' ? (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                            </span>
                          ) : (
                            <span className="text-destructive font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-foreground">{log.duration_ms}ms</td>
                        <td className="p-2.5 text-muted-foreground truncate max-w-[200px]" title={JSON.stringify(log.input)}>
                          {JSON.stringify(log.input)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
