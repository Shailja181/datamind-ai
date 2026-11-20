import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DatasetProvider } from './contexts/DatasetContext';
import { Layout } from './components/layout/Layout';

// Page Imports
import { Dashboard } from './pages/Dashboard';
import { DataExplorer } from './pages/DataExplorer';
import { EDA } from './pages/EDA';
import { AIAnalyst } from './pages/AIAnalyst';
import { MLPlayground } from './pages/MLPlayground';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { Reports } from './pages/Reports';
import { MCPMonitor } from './pages/MCPMonitor';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DatasetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="data-explorer" element={<DataExplorer />} />
              <Route path="eda" element={<EDA />} />
              <Route path="ai-analyst" element={<AIAnalyst />} />
              <Route path="ml-playground" element={<MLPlayground />} />
              <Route path="anomalies" element={<AnomalyDetection />} />
              <Route path="reports" element={<Reports />} />
              <Route path="mcp-monitor" element={<MCPMonitor />} />
              <Route path="settings" element={<Settings />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DatasetProvider>
    </ThemeProvider>
  );
};

export default App;
