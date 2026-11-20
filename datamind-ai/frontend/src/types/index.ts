export interface DatasetMeta {
  id: string;
  name: string;
  rows: number;
  columns: number;
  column_types?: {
    numeric: string[];
    datetime: string[];
    categorical: string[];
  };
  created_at?: string;
}

export interface EDAResult {
  rows: number;
  columns: number;
  column_types: {
    numeric: string[];
    datetime: string[];
    categorical: string[];
  };
  duplicates: number;
  missing: Record<string, number>;
  descriptive: Record<string, {
    count: number;
    mean: number;
    std: number;
    min: number;
    '25%': number;
    '50%': number;
    '75%': number;
    max: number;
    median: number;
    variance: number;
  }>;
  correlation: Record<string, Record<string, number | null>>;
  outliers_iqr: Record<string, number>;
  insights: string[];
  quality_score: number;
}

export interface ColumnSummary {
  column: string;
  dtype: string;
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  var?: number;
  min?: number;
  max?: number;
  skew?: number;
  mode?: any;
  top_values?: Record<string, number>;
}

export interface AnomalyResult {
  method: 'iqr' | 'zscore' | 'isolation_forest';
  columns: string[];
  count: number;
  percent: number;
  records: Record<string, any>[];
}

export interface MLTrainRequest {
  dataset_id: string;
  model_type: 'linear_regression' | 'logistic_regression' | 'decision_tree' | 'random_forest' | 'knn' | 'kmeans' | 'isolation_forest';
  target_column?: string;
  feature_columns: string[];
  test_size?: number;
  params?: Record<string, any>;
}

export interface MLTrainResult {
  model_type: string;
  task_type: 'regression' | 'classification' | 'clustering' | 'anomaly_detection';
  target_column?: string;
  feature_columns: string[];
  train_rows: number;
  test_rows: number;
  metrics: {
    r2?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    silhouette_score?: number;
    anomaly_count?: number;
    anomaly_percent?: number;
  };
  confusion_matrix?: {
    labels: string[];
    matrix: number[][];
  };
  predictions?: Array<{
    actual?: number | string;
    predicted: number | string;
    error?: number;
    [key: string]: any;
  }>;
  feature_importance?: Record<string, number>;
  cluster_centers?: Array<Record<string, number>>;
  cluster_counts?: Record<string, number>;
  training_duration_ms: number;
  insights: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  chart?: {
    type: 'bar' | 'line' | 'scatter' | 'pie';
    title: string;
    xAxis: string;
    yAxis: string;
    data: any[];
  };
  tableData?: {
    columns: string[];
    rows: any[];
  };
  toolsUsed?: Array<{
    name: string;
    params: Record<string, any>;
    status: 'success' | 'failed';
    duration_ms?: number;
  }>;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  parameters: Record<string, any>;
  category?: string;
}

export interface MCPExecutionLog {
  id: string;
  tool_name: string;
  input: Record<string, any>;
  output: any;
  status: 'success' | 'error';
  duration_ms: number;
  timestamp: string;
  error?: string;
}

export interface GeneratedReport {
  id: string;
  dataset_id: string;
  dataset_name: string;
  generated_at: string;
  title: string;
  executive_summary: string;
  eda: EDAResult;
  ml_summary?: MLTrainResult;
  anomalies_summary?: AnomalyResult;
  recommendations: string[];
}
