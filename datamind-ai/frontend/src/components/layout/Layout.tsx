import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Modal } from '../common/Modal';
import { UploadDropzone } from '../data/UploadDropzone';
import { useDataset } from '../../contexts/DatasetContext';
import { API_BASE_URL } from '../../services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

export const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { backendConnected, refreshDatasets } = useDataset();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Backend Unavailable Banner */}
      {!backendConnected && (
        <div className="bg-destructive/15 border-b border-destructive/20 text-destructive px-4 py-2 text-xs flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Backend API is currently waking up or unreachable at <strong>{API_BASE_URL}</strong>. If hosted on Render free tier, the first request may take ~20-30 seconds.
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => refreshDatasets()}
            icon={<RefreshCw className="w-3 h-3" />}
            className="text-[11px] h-6 px-2"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Content Wrapper */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Top Navbar */}
          <Navbar
            onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            onOpenUploadModal={() => setUploadModalOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Dataset"
        description="Upload a CSV or Excel file (.csv, .xlsx, .xls) to analyze"
        maxWidth="lg"
      >
        <UploadDropzone
          onSuccess={() => setUploadModalOpen(false)}
          onCancel={() => setUploadModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
