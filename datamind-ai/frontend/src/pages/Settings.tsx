import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDataset } from '../contexts/DatasetContext';
import { datasetService } from '../services/datasetService';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Sparkles,
  Key,
  Database,
  Info,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { backendConnected, refreshDatasets } = useDataset();

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setTestResult(null);
      const res = await datasetService.checkHealth();
      setTestResult(`Connection successful: Status is "${res.status}".`);
      await refreshDatasets();
    } catch (err: any) {
      setTestResult(`Connection failed: ${err.message || 'Server unreachable'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Platform Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure appearance, backend API connections, and view platform architecture
        </p>
      </div>

      {/* Appearance & Theme Selection */}
      <Card>
        <CardHeader
          title="Appearance & Theme"
          subtitle="Select your preferred dashboard styling mode"
        />
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-500/10 text-foreground font-semibold shadow-subtle'
                : 'border-border bg-card hover:bg-card-hover text-muted-foreground'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-500/10 text-foreground font-semibold shadow-subtle'
                : 'border-border bg-card hover:bg-card-hover text-muted-foreground'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-500/10 text-foreground font-semibold shadow-subtle'
                : 'border-border bg-card hover:bg-card-hover text-muted-foreground'
            }`}
          >
            <Laptop className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs">System Match</span>
          </button>
        </div>
      </Card>

      {/* Backend API Connection Status */}
      <Card>
        <CardHeader
          title="Backend & Server Infrastructure"
          subtitle="FastAPI backend running locally"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              loading={testingConnection}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Test API Health
            </Button>
          }
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-brand-500" />
              <div>
                <p className="font-semibold text-foreground">API Base URL</p>
                <p className="text-[11px] font-mono text-muted-foreground">http://127.0.0.1:8000</p>
              </div>
            </div>
            {backendConnected ? (
              <Badge variant="success" size="sm" dot>
                Connected
              </Badge>
            ) : (
              <Badge variant="error" size="sm" dot>
                Disconnected
              </Badge>
            )}
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                testResult.includes('successful')
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent-500" />
              <div>
                <p className="font-semibold text-foreground">Google Gemini API</p>
                <p className="text-[11px] text-muted-foreground">
                  Configured via backend environment variable <code className="font-mono">GEMINI_API_KEY</code>
                </p>
              </div>
            </div>
            <Badge variant="brand" size="sm">
              Server-Side Secured
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="font-semibold text-foreground">Dataset Storage</p>
                <p className="text-[11px] font-mono text-muted-foreground">data/uploads/*.csv</p>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">25 MB Max Upload</span>
          </div>
        </div>
      </Card>

      {/* Project & Architecture Information */}
      <Card>
        <CardHeader
          title="DataMind AI Architecture & Tech Stack"
          subtitle="Final-Year B.Tech Computer Science & Engineering Project"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Frontend Framework</p>
            <p className="font-bold text-foreground mt-0.5">React 18 & Vite 5</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Type Safety</p>
            <p className="font-bold text-foreground mt-0.5">TypeScript 5.6</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Styling & UI</p>
            <p className="font-bold text-foreground mt-0.5">Tailwind CSS & Lucide</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Visualization</p>
            <p className="font-bold text-foreground mt-0.5">Recharts 2.15</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Backend Framework</p>
            <p className="font-bold text-foreground mt-0.5">Python FastAPI</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground">Agent Protocol</p>
            <p className="font-bold text-foreground mt-0.5">FastMCP (STDIO)</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground">
          Built with an agentic design pattern: natural language reasoning is coupled with deterministic Python analytical computation to eliminate AI numerical hallucination.
        </div>
      </Card>
    </div>
  );
};
