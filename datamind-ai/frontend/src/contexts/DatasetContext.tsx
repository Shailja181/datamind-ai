import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DatasetMeta } from '../types';
import { datasetService } from '../services/datasetService';

interface DatasetContextType {
  datasets: DatasetMeta[];
  selectedDataset: DatasetMeta | null;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  backendConnected: boolean;
  selectDataset: (id: string | null) => void;
  refreshDatasets: () => Promise<void>;
  uploadDataset: (file: File) => Promise<DatasetMeta>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return localStorage.getItem('datamind_active_dataset_id');
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  const refreshDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await datasetService.getAll();
      setDatasets(data);
      setBackendConnected(true);

      if (data.length > 0) {
        if (!selectedId || !data.some(d => d.id === selectedId)) {
          setSelectedId(data[0].id);
          localStorage.setItem('datamind_active_dataset_id', data[0].id);
        }
      } else {
        setSelectedId(null);
        localStorage.removeItem('datamind_active_dataset_id');
      }
    } catch (err: any) {
      console.warn('Backend connection issue:', err);
      setBackendConnected(false);
      setError(err?.response?.data?.detail || err.message || 'Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    refreshDatasets();
  }, []);

  const selectDataset = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      localStorage.setItem('datamind_active_dataset_id', id);
    } else {
      localStorage.removeItem('datamind_active_dataset_id');
    }
  };

  const uploadDataset = async (file: File): Promise<DatasetMeta> => {
    try {
      setLoading(true);
      const newDataset = await datasetService.upload(file);
      await refreshDatasets();
      selectDataset(newDataset.id);
      return newDataset;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectedDataset = datasets.find(d => d.id === selectedId) || null;

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDataset,
        selectedId,
        loading,
        error,
        backendConnected,
        selectDataset,
        refreshDatasets,
        uploadDataset,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};
