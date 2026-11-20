import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Upload,
  Database,
  ChevronDown,
  Bell,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDataset } from '../../contexts/DatasetContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface NavbarProps {
  onMobileToggle: () => void;
  onOpenUploadModal: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string; category?: string }> = {
  '/': { title: 'Overview Dashboard', subtitle: 'Platform health and dataset intelligence summary' },
  '/data-explorer': { title: 'Data Explorer', subtitle: 'Inspect, query, filter and validate datasets' },
  '/eda': { title: 'Automated EDA', subtitle: 'Exploratory data analysis with statistical insights' },
  '/ai-analyst': { title: 'AI Analyst', subtitle: 'Conversational agent backed by deterministic Python execution' },
  '/ml-playground': { title: 'ML Playground', subtitle: 'Train, evaluate, and compare scikit-learn models' },
  '/anomalies': { title: 'Anomaly Detection', subtitle: 'IQR, Z-Score, and Isolation Forest outliers' },
  '/reports': { title: 'Analytical Reports', subtitle: 'Executive summaries, findings, and PDF export' },
  '/mcp-monitor': { title: 'MCP Server Monitor', subtitle: 'FastMCP tools, inspection schemas, and invocation telemetry' },
  '/settings': { title: 'Settings', subtitle: 'Platform preferences, themes, and backend connections' },
};

export const Navbar: React.FC<NavbarProps> = ({ onMobileToggle, onOpenUploadModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { datasets, selectedDataset, selectDataset, backendConnected, refreshDatasets } = useDataset();

  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'DataMind AI',
    subtitle: 'Agentic Data Analytics Platform',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-sidebar/80 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">DataMind AI /</span>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {pageInfo.title}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground hidden md:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions: Dataset Switcher, Upload, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Connection Status Badge */}
        <div className="hidden sm:flex items-center">
          {backendConnected ? (
            <Badge variant="success" size="sm" dot>
              API Active
            </Badge>
          ) : (
            <button
              onClick={() => refreshDatasets()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/20 transition-colors"
              title="Click to retry connecting to 127.0.0.1:8000"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Offline (Retry)</span>
            </button>
          )}
        </div>

        {/* Global Dataset Selector */}
        <div className="relative">
          <button
            onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:border-border-hover text-xs font-medium text-foreground transition-all shadow-subtle max-w-[180px] sm:max-w-[220px]"
          >
            <Database className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="truncate">
              {selectedDataset ? selectedDataset.name : 'No dataset'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
          </button>

          {datasetDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDatasetDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card border border-border shadow-modal p-2 z-40 animate-fade">
                <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Select Active Dataset ({datasets.length})
                </div>
                <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                  {datasets.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                      No datasets found. Upload a file to begin!
                    </div>
                  ) : (
                    datasets.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          selectDataset(d.id);
                          setDatasetDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                          selectedDataset?.id === d.id
                            ? 'bg-brand-500/10 text-brand-500 font-semibold border border-brand-500/20'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-medium">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {d.rows.toLocaleString()} rows • {d.columns} cols
                          </p>
                        </div>
                        {selectedDataset?.id === d.id && (
                          <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="pt-2 border-t border-border mt-1">
                  <button
                    onClick={() => {
                      setDatasetDropdownOpen(false);
                      onOpenUploadModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-brand-500 hover:bg-brand-500/10 rounded-xl font-medium transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload New Dataset
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload Trigger */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenUploadModal}
          icon={<Upload className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex"
        >
          Upload
        </Button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors focus:outline-none"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors focus:outline-none relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-modal p-4 z-40 animate-fade">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Notifications
                  </h4>
                  <Badge variant="brand" size="sm">System</Badge>
                </div>
                <div className="py-3 space-y-2.5">
                  <div className="text-xs p-2 rounded-xl bg-muted/60 border border-border">
                    <p className="font-semibold text-foreground">FastMCP Server Ready</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      STDIO tools ready: analyze_dataset, get_column_summary, query_dataset, detect_anomalies.
                    </p>
                  </div>
                  <div className="text-xs p-2 rounded-xl bg-muted/60 border border-border">
                    <p className="font-semibold text-foreground">Dataset Engine Initialized</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      FastAPI running on http://127.0.0.1:8000.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              DM
            </div>
            <span className="text-xs font-medium text-foreground hidden md:inline">Shail</span>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-modal p-2 z-40 animate-fade">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">Shailendra Yadav</p>
                  <p className="text-[10px] text-muted-foreground">B.Tech CSE Final Year</p>
                  <p className="text-[10px] text-brand-500 font-mono mt-0.5">DataMind AI Lead</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    System Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/mcp-monitor');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    MCP Server Console
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
