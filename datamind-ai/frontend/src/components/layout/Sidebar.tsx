import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Bot,
  BrainCircuit,
  AlertOctagon,
  FileText,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDataset } from '../../contexts/DatasetContext';
import { API_BASE_URL } from '../../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/data-explorer', label: 'Data Explorer', icon: Database },
  { path: '/eda', label: 'Automated EDA', icon: BarChart3 },
  { path: '/ai-analyst', label: 'AI Analyst', icon: Bot, badge: 'Agentic' },
  { path: '/ml-playground', label: 'ML Playground', icon: BrainCircuit },
  { path: '/anomalies', label: 'Anomaly Detection', icon: AlertOctagon },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/mcp-monitor', label: 'MCP Monitor', icon: Cpu, badge: 'Stdio' },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const location = useLocation();
  const { selectedDataset, datasets } = useDataset();

  const displayHost = API_BASE_URL.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out select-none',
          collapsed ? 'w-20' : 'w-64',
          // Mobile state
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-border justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
            onClick={onMobileClose}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-subtle flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base text-foreground tracking-tight flex items-center gap-1.5 truncate">
                  DataMind <span className="text-brand-500 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">AI</span>
                </span>
                <span className="text-[11px] text-muted-foreground truncate font-medium">Agentic Analytics</span>
              </div>
            )}
          </NavLink>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Dataset Quick-Badge (Desktop & mobile) */}
        {!collapsed && (
          <div className="px-3.5 py-3 border-b border-border bg-card/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Active Context
            </div>
            {selectedDataset ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/60 border border-border text-xs truncate">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{selectedDataset.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono flex-shrink-0">
                  {selectedDataset.rows} rows
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic px-1">
                {datasets.length === 0 ? 'No dataset uploaded' : 'Select a dataset'}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && (
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold',
                      isActive ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status */}
        <div className="p-3 border-t border-border">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-card border border-border shadow-subtle flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">FastAPI & MCP</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{displayHost}</p>
                </div>
              </div>
              <Zap className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center py-2" title={`Backend: ${displayHost}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
