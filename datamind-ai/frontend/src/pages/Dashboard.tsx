import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  BarChart3,
  Bot,
  BrainCircuit,
  AlertOctagon,
  FileText,
  Upload,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useDataset } from '../contexts/DatasetContext';
import { analyticsService } from '../services/analyticsService';
import { EDAResult } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatNumber, formatPercent } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedDataset, selectDataset } = useDataset();

  const [eda, setEda] = useState<EDAResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDataset) {
      setEda(null);
      return;
    }
    let isMounted = true;
    setLoading(true);

    analyticsService
      .getEDA(selectedDataset.id)
      .then((data) => {
        if (isMounted) setEda(data);
      })
      .catch((err) => {
        console.warn('Could not fetch EDA for dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDataset]);

  const totalRowsAll = datasets.reduce((acc, curr) => acc + (curr.rows || 0), 0);
  const totalColumnsAll = datasets.reduce((acc, curr) => acc + (curr.columns || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600/10 via-accent-500/10 to-indigo-600/10 border border-brand-500/20 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-500 border border-brand-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Analytics Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Welcome to DataMind AI
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Upload raw tabular datasets, trigger instant automated EDA, query in natural language with autonomous agentic intelligence, and train machine learning models seamlessly.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/data-explorer')}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Explore Datasets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai-analyst')}
              icon={<Bot className="w-3.5 h-3.5 text-brand-500" />}
            >
              Ask AI Analyst
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Datasets</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {datasets.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Available in active session</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Rows Analyzed</span>
            <div className="w-8 h-8 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {totalRowsAll.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Across all uploaded tables</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Data Quality</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {eda ? `${eda.quality_score}%` : '—'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {eda ? `${eda.duplicates} duplicates, ${Object.keys(eda.missing).length} null cols` : 'Select dataset to compute'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Active Features</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {eda ? eda.columns : totalColumnsAll}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {eda ? `${eda.column_types.numeric.length} numeric, ${eda.column_types.categorical.length} categorical` : 'Column properties ready'}
          </p>
        </Card>
      </div>

      {/* Main Grid: Active Dataset Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dataset Intelligence & Key Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Dataset Intelligence & Insights"
              subtitle={selectedDataset ? `Automated findings for ${selectedDataset.name}` : 'No active dataset selected'}
              action={
                selectedDataset && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/eda')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    View Full EDA
                  </Button>
                )
              }
            />

            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : !selectedDataset ? (
              <EmptyState
                title="No active dataset"
                description="Upload a CSV or Excel dataset to view automated insights and health scores."
                actionText="Upload Dataset"
                onAction={() => navigate('/data-explorer')}
              />
            ) : eda?.insights && eda.insights.length > 0 ? (
              <div className="space-y-2.5">
                {eda.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-4 text-center">
                Clean dataset with no significant anomalies or missing values detected.
              </p>
            )}
          </Card>

          {/* Recent Datasets List */}
          <Card>
            <CardHeader
              title="Recent Datasets"
              subtitle="Datasets loaded in current engine memory"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/data-explorer')}
                  className="text-xs"
                >
                  Manage All
                </Button>
              }
            />

            {datasets.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No datasets uploaded yet. Click upload to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    className={`py-3 flex items-center justify-between cursor-pointer px-2 rounded-xl transition-colors ${
                      selectedDataset?.id === d.id ? 'bg-brand-500/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => selectDataset(d.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 text-brand-500">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {d.rows.toLocaleString()} rows • {d.columns} columns
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedDataset?.id === d.id && (
                        <Badge variant="brand" size="sm">Active</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectDataset(d.id);
                          navigate('/data-explorer');
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Quick Launch & Agent Shortcuts */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Analytical Workflows" subtitle="Jump directly into specialized tools" />
            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/ai-analyst')}
                className="w-full text-left p-3.5 rounded-xl border border-border hover:border-brand-500/40 bg-card hover:bg-card-hover transition-all flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-brand-500 transition-colors">
                    Conversational AI Analyst
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    Query datasets using natural language with deterministic analytical computation.
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/ml-playground')}
                className="w-full text-left p-3.5 rounded-xl border border-border hover:border-accent-500/40 bg-card hover:bg-card-hover transition-all flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-accent-500 transition-colors">
                    Machine Learning Playground
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    Train Regression, Random Forests, KNN, and KMeans clustering.
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/anomalies')}
                className="w-full text-left p-3.5 rounded-xl border border-border hover:border-warning/40 bg-card hover:bg-card-hover transition-all flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-warning transition-colors">
                    Outlier & Anomaly Detection
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    Isolate unusual records using IQR, Z-Score, and Isolation Forests.
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="w-full text-left p-3.5 rounded-xl border border-border hover:border-emerald-500/40 bg-card hover:bg-card-hover transition-all flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                    Executive Report Generator
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    Export high-resolution analytical PDF dossiers and spreadsheets.
                  </p>
                </div>
              </button>
            </div>
          </Card>

          {/* FastMCP Server Telemetry Quick Card */}
          <Card className="p-4 bg-muted/20 border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">FastMCP Server</span>
              <Badge variant="brand" size="sm">STDIO</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exposes 4 atomic tools for external AI models & autonomous clients (Claude, Gemini, Antigravity).
            </p>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono">mcp_server/server.py</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mcp-monitor')}
                className="text-xs h-6 px-2 text-brand-500"
              >
                Inspect Tools
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
