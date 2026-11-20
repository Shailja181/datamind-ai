import React, { useState, useEffect } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { mlService } from '../services/mlService';
import { MLTrainRequest, MLTrainResult } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ScatterPlotChart } from '../components/charts/ScatterPlotChart';
import { DistributionBarChart } from '../components/charts/DistributionBarChart';
import {
  BrainCircuit,
  Play,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  BarChart,
  Settings2,
  Clock,
  Layers,
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

const SUPPORTED_MODELS = [
  { id: 'linear_regression', name: 'Linear Regression', type: 'regression', desc: 'Predict continuous numerical outcomes with ordinary least squares.' },
  { id: 'logistic_regression', name: 'Logistic Regression', type: 'classification', desc: 'Predict discrete categories or binary class probabilities.' },
  { id: 'decision_tree', name: 'Decision Tree', type: 'regression', desc: 'Non-linear tree partitioning with high interpretability.' },
  { id: 'random_forest', name: 'Random Forest', type: 'regression', desc: 'Ensemble of decision trees minimizing overfitting.' },
  { id: 'knn', name: 'K-Nearest Neighbors (KNN)', type: 'regression', desc: 'Instance-based learning utilizing spatial proximity.' },
  { id: 'kmeans', name: 'K-Means Clustering', type: 'clustering', desc: 'Unsupervised partitioning into k optimal cluster centroids.' },
  { id: 'isolation_forest', name: 'Isolation Forest', type: 'anomaly_detection', desc: 'Tree-based outlier isolation for anomaly scoring.' },
];

export const MLPlayground: React.FC = () => {
  const { selectedDataset } = useDataset();

  const [selectedModel, setSelectedModel] = useState<string>('linear_regression');
  const [targetCol, setTargetCol] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [testSplit, setTestSplit] = useState<number>(20);
  const [training, setTraining] = useState<boolean>(false);
  const [trainResult, setTrainResult] = useState<MLTrainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select features and target when dataset changes
  useEffect(() => {
    if (selectedDataset && selectedDataset.column_types) {
      const numCols = selectedDataset.column_types.numeric;
      if (numCols.length > 1) {
        setTargetCol(numCols[numCols.length - 1]);
        setSelectedFeatures(numCols.slice(0, numCols.length - 1));
      } else if (numCols.length === 1) {
        setTargetCol(numCols[0]);
        setSelectedFeatures([numCols[0]]);
      }
      setTrainResult(null);
    }
  }, [selectedDataset]);

  const activeModelMeta = SUPPORTED_MODELS.find((m) => m.id === selectedModel);
  const isUnsupervised = activeModelMeta?.type === 'clustering' || activeModelMeta?.type === 'anomaly_detection';

  const handleToggleFeature = (col: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleTrain = async () => {
    if (!selectedDataset) return;
    if (!isUnsupervised && !targetCol) {
      setError('Please select a target column for supervised learning.');
      return;
    }
    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature column.');
      return;
    }

    try {
      setTraining(true);
      setError(null);
      const req: MLTrainRequest = {
        dataset_id: selectedDataset.id,
        model_type: selectedModel as any,
        target_column: isUnsupervised ? undefined : targetCol,
        feature_columns: selectedFeatures,
        test_size: testSplit / 100,
      };

      const result = await mlService.trainModel(req);
      setTrainResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to train model');
    } finally {
      setTraining(false);
    }
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset to configure features and train machine learning models."
        icon={<BrainCircuit className="w-10 h-10 text-muted-foreground stroke-[1.5]" />}
      />
    );
  }

  const allColumns = [
    ...(selectedDataset.column_types?.numeric || []),
    ...(selectedDataset.column_types?.categorical || []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Machine Learning Playground</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Train, validate, and benchmark scikit-learn models directly in memory on {selectedDataset.name}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleTrain}
          loading={training}
          disabled={training || (!isUnsupervised && !targetCol) || selectedFeatures.length === 0}
          icon={<Play className="w-3.5 h-3.5" />}
        >
          {training ? 'Training Model...' : 'Train Model'}
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Main ML Configurator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader title="1. Select Algorithm" subtitle="Choose supervised or unsupervised model" />
            <div className="space-y-2">
              {SUPPORTED_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setTrainResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-foreground font-semibold shadow-subtle'
                        : 'border-border bg-card hover:bg-card-hover text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{m.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          m.type === 'regression'
                            ? 'bg-blue-500/10 text-blue-500'
                            : m.type === 'classification'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {m.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 font-normal line-clamp-2">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Features and Target Selection */}
          <Card>
            <CardHeader title="2. Features & Targets" subtitle="Assign target outcome and predictor variables" />
            
            {/* Target selection (only for supervised) */}
            {!isUnsupervised && (
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-foreground">Target Variable (Y):</label>
                <select
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-mono"
                >
                  <option value="">Select target column...</option>
                  {allColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Feature Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Predictor Features (X):</label>
                <span className="text-[10px] text-muted-foreground">
                  {selectedFeatures.length} selected
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl border border-border bg-muted/20">
                {allColumns.map((col) => {
                  const isTarget = col === targetCol;
                  if (isTarget && !isUnsupervised) return null;
                  const isChecked = selectedFeatures.includes(col);
                  return (
                    <label
                      key={col}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-xs cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleFeature(col)}
                        className="rounded border-border text-brand-500 focus:ring-brand-500"
                      />
                      <span className="font-mono text-foreground truncate">{col}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Train/Test Split Slider */}
            {!isUnsupervised && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Test Split:</span>
                  <span className="font-mono text-brand-500 font-bold">{testSplit}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="5"
                  value={testSplit}
                  onChange={(e) => setTestSplit(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Train: {100 - testSplit}%</span>
                  <span>Test: {testSplit}%</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 2 Columns: Training Results & Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {!trainResult ? (
            <Card className="p-12 text-center border-dashed">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-3">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Ready to Train</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                Select your algorithm on the left, verify feature columns, and click <strong>Train Model</strong> to compute real scikit-learn metrics.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTrain}
                loading={training}
                disabled={training}
                icon={<Play className="w-3.5 h-3.5" />}
              >
                Start Training
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Performance Metrics Grid */}
              <Card>
                <CardHeader
                  title={`${trainResult.model_type.replace('_', ' ').toUpperCase()} Results`}
                  subtitle={`Trained on ${trainResult.train_rows} rows • Evaluated on ${trainResult.test_rows} rows in ${trainResult.training_duration_ms}ms`}
                  action={
                    <Badge variant="success" size="sm" dot>
                      Model Ready
                    </Badge>
                  }
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {trainResult.metrics.r2 !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">R² Score (Variance Explained)</p>
                      <p className="text-lg font-bold font-mono text-brand-500 mt-0.5">
                        {trainResult.metrics.r2.toFixed(3)}
                      </p>
                    </div>
                  )}
                  {trainResult.metrics.rmse !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">RMSE (Root Mean Sq Error)</p>
                      <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                        {formatNumber(trainResult.metrics.rmse)}
                      </p>
                    </div>
                  )}
                  {trainResult.metrics.mae !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">MAE (Mean Absolute Error)</p>
                      <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                        {formatNumber(trainResult.metrics.mae)}
                      </p>
                    </div>
                  )}
                  {trainResult.metrics.accuracy !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">Classification Accuracy</p>
                      <p className="text-lg font-bold font-mono text-emerald-500 mt-0.5">
                        {formatPercent(trainResult.metrics.accuracy * 100)}
                      </p>
                    </div>
                  )}
                  {trainResult.metrics.f1 !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">F1 Score</p>
                      <p className="text-lg font-bold font-mono text-indigo-500 mt-0.5">
                        {trainResult.metrics.f1.toFixed(3)}
                      </p>
                    </div>
                  )}
                  {trainResult.metrics.silhouette_score !== undefined && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">Silhouette Cluster Score</p>
                      <p className="text-lg font-bold font-mono text-purple-500 mt-0.5">
                        {trainResult.metrics.silhouette_score.toFixed(3)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actual vs Predicted Scatter Chart (Regression) */}
              {trainResult.predictions && trainResult.predictions.length > 0 && (
                <Card>
                  <CardHeader
                    title="Actual vs Predicted Values"
                    subtitle="Points along the diagonal indicate optimal model alignment"
                  />
                  <ScatterPlotChart
                    data={trainResult.predictions.map((p, i) => ({
                      x: Number(p.actual ?? p.predicted),
                      y: Number(p.predicted),
                      label: `Sample #${i + 1}`,
                    }))}
                    xLabel="Actual Value"
                    yLabel="Predicted Value"
                  />
                </Card>
              )}

              {/* Feature Importance Bar Chart */}
              {trainResult.feature_importance && Object.keys(trainResult.feature_importance).length > 0 && (
                <Card>
                  <CardHeader
                    title="Feature Relative Importance / Coefficients"
                    subtitle="Impact weight of each variable on model predictions"
                  />
                  <DistributionBarChart data={trainResult.feature_importance} color="#635BFF" />
                </Card>
              )}

              {/* Confusion Matrix (Classification) */}
              {trainResult.confusion_matrix && (
                <Card>
                  <CardHeader
                    title="Confusion Matrix"
                    subtitle="Evaluation of true positives, false positives, and misclassifications"
                  />
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left font-semibold text-muted-foreground">True \ Predicted</th>
                          {trainResult.confusion_matrix.labels.map((lbl) => (
                            <th key={lbl} className="p-2 font-mono font-semibold text-foreground">
                              {lbl}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {trainResult.confusion_matrix.matrix.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="p-2 font-semibold text-left text-foreground font-mono">
                              {trainResult.confusion_matrix!.labels[rIdx]}
                            </td>
                            {row.map((val, cIdx) => (
                              <td
                                key={cIdx}
                                className={`p-2 font-mono ${
                                  rIdx === cIdx ? 'bg-emerald-500/20 text-emerald-500 font-bold' : 'text-foreground'
                                }`}
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* AI / Analytical Interpretability Insights */}
              {trainResult.insights && trainResult.insights.length > 0 && (
                <Card>
                  <CardHeader
                    title="Model Interpretability & Next Steps"
                    subtitle="Autonomous recommendations derived from model convergence"
                  />
                  <div className="space-y-2">
                    {trainResult.insights.map((ins, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{ins}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
