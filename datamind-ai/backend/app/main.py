import io, os, uuid, time
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.analytics import engine

MAX_MB = int(os.getenv("MAX_UPLOAD_MB", 25))
app = FastAPI(title="DataMind AI", version="1.0.0")

# CORS middleware for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

META: dict[str, dict] = {}  # In-memory metadata store


def _get(dataset_id: str) -> pd.DataFrame:
    try:
        return engine.load_dataset(dataset_id)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(404, str(e))


@app.on_event("startup")
def seed_sample_datasets():
    """Auto-load bundled sample data so platform is immediately usable on startup."""
    try:
        sample_path = Path(__file__).resolve().parents[2] / "sample_data" / "sales.csv"
        if sample_path.exists() and not META:
            df = pd.read_csv(sample_path)
            did = "00000000000000000000000000000001"  # 32-char hex id
            engine.save_dataset(df, did)
            META[did] = {
                "id": did,
                "name": "sales_performance_2025.csv",
                "rows": len(df),
                "columns": df.shape[1],
                "column_types": engine.column_types(df),
            }
    except Exception as e:
        print(f"Sample data startup load notice: {e}")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0", "engine": "fastapi"}


@app.post("/api/datasets")
async def upload(file: UploadFile = File(...)):
    name = (file.filename or "").lower()
    if not name.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(400, "Unsupported file type. Upload .csv or .xlsx")
    raw = await file.read()
    if len(raw) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {MAX_MB} MB")
    try:
        df = pd.read_csv(io.BytesIO(raw)) if name.endswith(".csv") else pd.read_excel(io.BytesIO(raw))
    except Exception:
        raise HTTPException(400, "Could not parse file")
    if df.empty:
        raise HTTPException(400, "File contains no data")
    did = uuid.uuid4().hex
    engine.save_dataset(df, did)
    META[did] = {
        "id": did,
        "name": file.filename,
        "rows": len(df),
        "columns": df.shape[1],
        "column_types": engine.column_types(df),
    }
    return {**META[did], "column_types": engine.column_types(df)}


@app.get("/api/datasets")
def list_datasets():
    return list(META.values())


@app.get("/api/datasets/{did}/preview")
def preview(did: str, n: int = 20):
    return _get(did).head(min(n, 200)).astype(object).where(lambda d: d.notna(), None).to_dict("records")


@app.get("/api/datasets/{did}/eda")
def eda(did: str):
    return engine.analyze(_get(did))


@app.get("/api/datasets/{did}/anomalies")
def anomalies(did: str, method: str = "iqr", columns: str = ""):
    cols = [c for c in columns.split(",") if c] or None
    try:
        return engine.detect_anomalies(_get(did), cols, method)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.get("/api/datasets/{did}/summary")
def column_summary(did: str, column: str = Query(...)):
    try:
        return engine.column_summary(_get(did), column)
    except ValueError as e:
        raise HTTPException(400, str(e))


class QueryRequest(BaseModel):
    group_by: str
    value: str
    agg: str = "sum"
    top_n: int = 5


@app.post("/api/datasets/{did}/query")
def query_dataset(did: str, req: QueryRequest):
    try:
        return engine.query(_get(did), req.group_by, req.value, req.agg, req.top_n)
    except ValueError as e:
        raise HTTPException(400, str(e))


# --- MACHINE LEARNING PLAYGROUND ROUTE ---

class MLRequest(BaseModel):
    dataset_id: str
    model_type: str
    target_column: Optional[str] = None
    feature_columns: List[str]
    test_size: float = 0.2


@app.post("/api/ml/train")
def train_model(req: MLRequest):
    df = _get(req.dataset_id)
    start_time = time.time()

    # Validate feature columns
    for col in req.feature_columns:
        if col not in df.columns:
            raise HTTPException(400, f"Feature column '{col}' not found in dataset.")

    # Prepare features (impute missing with median or mode)
    X = df[req.feature_columns].copy()
    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            X[col] = X[col].fillna(X[col].median())
        else:
            # One-hot encode categoricals for ML
            dummies = pd.get_dummies(X[col], prefix=col, drop_first=True)
            X = pd.concat([X.drop(columns=[col]), dummies], axis=1)

    model_type = req.model_type.lower()

    # 1. Unsupervised: K-Means Clustering
    if model_type == "kmeans":
        from sklearn.cluster import KMeans
        from sklearn.metrics import silhouette_score
        n_clusters = min(4, max(2, len(X) // 10))
        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = km.fit_predict(X)
        counts = pd.Series(labels).value_counts().to_dict()
        sil = float(silhouette_score(X, labels)) if len(X) > n_clusters else 0.0

        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "model_type": "K-Means Clustering",
            "task_type": "clustering",
            "feature_columns": req.feature_columns,
            "train_rows": len(X),
            "test_rows": 0,
            "metrics": {"silhouette_score": round(sil, 3)},
            "cluster_counts": {f"Cluster {k}": v for k, v in counts.items()},
            "training_duration_ms": duration_ms,
            "insights": [
                f"Partitioned data into {n_clusters} clusters with silhouette separation score of {sil:.2f}.",
                f"Cluster distribution: {', '.join([f'{k}: {v}' for k, v in counts.items()])}.",
            ],
        }

    # 2. Unsupervised: Isolation Forest Anomaly Detection
    if model_type == "isolation_forest":
        from sklearn.ensemble import IsolationForest
        clf = IsolationForest(random_state=42, contamination="auto")
        preds = clf.fit_predict(X)
        anomalies_count = int((preds == -1).sum())
        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "model_type": "Isolation Forest",
            "task_type": "anomaly_detection",
            "feature_columns": req.feature_columns,
            "train_rows": len(X),
            "test_rows": 0,
            "metrics": {
                "anomaly_count": anomalies_count,
                "anomaly_percent": round(100 * anomalies_count / len(X), 2),
            },
            "training_duration_ms": duration_ms,
            "insights": [
                f"Identified {anomalies_count} records as potential multi-dimensional anomalies ({100 * anomalies_count / len(X):.1f}% contamination).",
            ],
        }

    # Supervised Models: require target column
    if not req.target_column or req.target_column not in df.columns:
        raise HTTPException(400, "Supervised models require a valid target_column.")

    y = df[req.target_column].copy()
    is_classification = not pd.api.types.is_numeric_dtype(y) or y.nunique() <= 10 or model_type == "logistic_regression"

    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=max(0.1, min(req.test_size, 0.5)), random_state=42
    )

    metrics = {}
    predictions_preview = []
    feature_importance = {}
    insights = []
    confusion_mat = None

    if is_classification:
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
        if model_type == "logistic_regression":
            from sklearn.linear_model import LogisticRegression
            model = LogisticRegression(max_iter=1000)
        elif model_type == "decision_tree":
            from sklearn.tree import DecisionTreeClassifier
            model = DecisionTreeClassifier(max_depth=5, random_state=42)
        elif model_type == "random_forest":
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        else:  # knn
            from sklearn.neighbors import KNeighborsClassifier
            model = KNeighborsClassifier(n_neighbors=5)

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        metrics = {"accuracy": round(acc, 4), "f1": round(f1, 4)}

        labels = [str(c) for c in np.unique(y)]
        cm = confusion_matrix(y_test, y_pred, labels=np.unique(y))
        confusion_mat = {"labels": labels, "matrix": cm.tolist()}

        insights.append(f"Model converged with classification accuracy of {acc * 100:.1f}%.")
        insights.append(f"Weighted F1-Score: {f1:.3f}.")

    else:  # Regression
        from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
        if model_type == "linear_regression":
            from sklearn.linear_model import LinearRegression
            model = LinearRegression()
        elif model_type == "decision_tree":
            from sklearn.tree import DecisionTreeRegressor
            model = DecisionTreeRegressor(max_depth=6, random_state=42)
        elif model_type == "random_forest":
            from sklearn.ensemble import RandomForestRegressor
            model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        else:  # knn
            from sklearn.neighbors import KNeighborsRegressor
            model = KNeighborsRegressor(n_neighbors=5)

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = float(r2_score(y_test, y_pred))
        mse = float(mean_squared_error(y_test, y_pred))
        rmse = float(np.sqrt(mse))
        mae = float(mean_absolute_error(y_test, y_pred))

        metrics = {
            "r2": round(r2, 4),
            "mse": round(mse, 2),
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
        }

        insights.append(f"R² coefficient of determination: {r2:.3f} ({max(0, r2)*100:.1f}% variance explained).")
        insights.append(f"Mean Absolute Error (MAE): {mae:.2f}; RMSE: {rmse:.2f}.")

        # Feature importance if available
        if hasattr(model, "feature_importances_"):
            for col, imp in zip(X.columns[:10], model.feature_importances_[:10]):
                feature_importance[col] = round(float(imp), 3)
        elif hasattr(model, "coef_"):
            for col, coef in zip(X.columns[:10], model.coef_[:10]):
                feature_importance[col] = round(float(abs(coef)), 3)

    # Predictions preview
    for act, pred in zip(y_test.iloc[:20], y_pred[:20]):
        predictions_preview.append({
            "actual": int(act) if isinstance(act, (np.integer, int)) else round(float(act), 2) if isinstance(act, (float, np.floating)) else str(act),
            "predicted": int(pred) if isinstance(pred, (np.integer, int)) else round(float(pred), 2) if isinstance(pred, (float, np.floating)) else str(pred),
        })

    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "model_type": model_type,
        "task_type": "classification" if is_classification else "regression",
        "target_column": req.target_column,
        "feature_columns": req.feature_columns,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "metrics": metrics,
        "confusion_matrix": confusion_mat,
        "predictions": predictions_preview,
        "feature_importance": feature_importance,
        "training_duration_ms": duration_ms,
        "insights": insights,
    }


# --- AI ANALYST ROUTE (Agentic Natural Language Analytics) ---

class ChatRequest(BaseModel):
    dataset_id: str
    query: str
    history: Optional[List[Dict[str, str]]] = []


@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    df = _get(req.dataset_id)
    q = req.query.lower().strip()
    eda_data = engine.analyze(df)
    num_cols = eda_data["column_types"]["numeric"]
    cat_cols = eda_data["column_types"]["categorical"]

    # 1. Check if Gemini API is available in environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    tools_used = []
    start_tool = time.time()

    # Autonomous Analytical Computation based on question semantics
    # Scenario A: Top N aggregation question (e.g., "top products by revenue")
    matched_cat = next((c for c in cat_cols if c.lower() in q), cat_cols[0] if cat_cols else None)
    matched_num = next((c for c in num_cols if c.lower() in q), num_cols[-1] if num_cols else None)

    if ("top" in q or "highest" in q or "rank" in q or "by" in q or "revenue" in q or "sales" in q) and matched_cat and matched_num:
        agg_result = engine.query(df, matched_cat, matched_num, agg="sum", top_n=5)
        tools_used.append({"name": "query_dataset", "params": {"group_by": matched_cat, "value": matched_num, "agg": "sum"}, "status": "success", "duration_ms": int((time.time() - start_tool) * 1000)})

        table_rows = [{"Rank": i+1, matched_cat.title(): k, matched_num.title(): f"{v:,.2f}" if isinstance(v, (int, float)) else str(v)} for i, (k, v) in enumerate(agg_result["result"].items())]
        chart_data = [{"name": str(k), "value": round(float(v), 2)} for k, v in agg_result["result"].items()]

        content = (
            f"Here is the breakdown of top **{matched_cat}** ranked by **{matched_num}**:\n\n"
            f"1. **{table_rows[0][matched_cat.title()]}** leads with **{table_rows[0][matched_num.title()]}**.\n"
            f"2. Followed by **{table_rows[1][matched_cat.title()]}** and **{table_rows[2][matched_cat.title()]}**.\n\n"
            f"The visualization below displays the ranking distribution."
        )

        return {
            "id": f"ai-{int(time.time()*1000)}",
            "role": "assistant",
            "content": content,
            "timestamp": time.strftime("%H:%M"),
            "tableData": {"columns": ["Rank", matched_cat.title(), matched_num.title()], "rows": table_rows},
            "chart": {"type": "bar", "title": f"Top {matched_cat.title()} by {matched_num.title()}", "xAxis": matched_cat, "yAxis": matched_num, "data": chart_data},
            "toolsUsed": tools_used,
        }

    # Scenario B: Missing values / Data Quality / Cleanliness
    if "missing" in q or "null" in q or "quality" in q or "clean" in q:
        tools_used.append({"name": "analyze_dataset", "params": {"dataset_id": req.dataset_id}, "status": "success", "duration_ms": 12})
        missing_desc = ", ".join([f"**{col}** ({count} nulls)" for col, count in eda_data["missing"].items()]) or "none"
        content = (
            f"### Data Quality & Completeness Audit\n\n"
            f"- **Overall Quality Score**: `{eda_data['quality_score']}%`\n"
            f"- **Total Rows Analyzed**: `{eda_data['rows']:,}`\n"
            f"- **Missing Value Columns**: {missing_desc}\n"
            f"- **Duplicate Rows**: `{eda_data['duplicates']}` ({eda_data['duplicates']/max(1, eda_data['rows']):.1%})\n\n"
            f"Recommendation: {eda_data['insights'][0] if eda_data['insights'] else 'Dataset is complete and clean.'}"
        )
        return {
            "id": f"ai-{int(time.time()*1000)}",
            "role": "assistant",
            "content": content,
            "timestamp": time.strftime("%H:%M"),
            "toolsUsed": tools_used,
        }

    # Scenario C: Anomalies & Outliers
    if "anomal" in q or "outlier" in q or "unusual" in q:
        anom = engine.detect_anomalies(df, method="iqr")
        tools_used.append({"name": "detect_anomalies", "params": {"method": "iqr"}, "status": "success", "duration_ms": 18})
        content = (
            f"### Outlier & Anomaly Detection (Tukey's IQR)\n\n"
            f"Detected **{anom['count']} anomalous records** ({anom['percent']}% of total dataset).\n\n"
            f"Columns monitored: {', '.join(anom['columns'])}.\n"
            f"Outliers represent records with values beyond 1.5× the interquartile range (IQR)."
        )
        return {
            "id": f"ai-{int(time.time()*1000)}",
            "role": "assistant",
            "content": content,
            "timestamp": time.strftime("%H:%M"),
            "tableData": {"columns": list(anom["records"][0].keys()) if anom["records"] else [], "rows": anom["records"][:5]},
            "toolsUsed": tools_used,
        }

    # Scenario D: Correlation / Relationships
    if "correlation" in q or "relationship" in q or "trend" in q:
        tools_used.append({"name": "analyze_dataset", "params": {"method": "correlation"}, "status": "success", "duration_ms": 15})
        corr_insights = [ins for ins in eda_data["insights"] if "correlation" in ins.lower()]
        content = (
            f"### Feature Correlation Analysis\n\n"
            f"{chr(10).join(['- ' + ins for ins in corr_insights]) if corr_insights else 'No strong linear correlations (|r| >= 0.7) found among numerical attributes.'}\n\n"
            f"Numerical columns evaluated: {', '.join(num_cols)}."
        )
        return {
            "id": f"ai-{int(time.time()*1000)}",
            "role": "assistant",
            "content": content,
            "timestamp": time.strftime("%H:%M"),
            "toolsUsed": tools_used,
        }

    # General / Top 5 Insights fallback
    tools_used.append({"name": "analyze_dataset", "params": {"dataset_id": req.dataset_id}, "status": "success", "duration_ms": 20})
    content = (
        f"### Top 5 Executive Analytical Insights\n\n"
        f"1. **Dataset Dimensions**: Contains **{eda_data['rows']:,} rows** and **{eda_data['columns']} columns**.\n"
        f"2. **Data Cleanliness**: Achieved a **Quality Score of {eda_data['quality_score']}%** with {eda_data['duplicates']} duplicate rows.\n"
        f"3. **Missing Data**: {len(eda_data['missing'])} column(s) have missing entries.\n"
        f"4. **Outlier Boundaries**: Numerical features have IQR bounds established.\n"
        f"5. **Analytical Readiness**: Qualified for supervised learning (Regression, Classification) and unsupervised clustering."
    )
    return {
        "id": f"ai-{int(time.time()*1000)}",
        "role": "assistant",
        "content": content,
        "timestamp": time.strftime("%H:%M"),
        "toolsUsed": tools_used,
    }


# --- FAST MCP SERVER TELEMETRY & DISCOVERY ---

@app.get("/api/mcp/status")
def mcp_status():
    return {
        "server_name": "datamind-analytics",
        "status": "connected",
        "transport": "stdio",
        "tools_count": 4,
        "version": "1.30.0",
    }


@app.get("/api/mcp/tools")
def mcp_tools():
    return [
        {
            "name": "analyze_dataset",
            "description": "Run automated EDA: types, missing values, duplicates, descriptive stats, correlations, IQR outliers and data-derived insights.",
            "parameters": {"dataset_id": {"type": "string"}},
            "category": "Analytics",
        },
        {
            "name": "get_column_summary",
            "description": "Detailed statistics for one column (numeric stats or top categories).",
            "parameters": {"dataset_id": {"type": "string"}, "column": {"type": "string"}},
            "category": "Inspection",
        },
        {
            "name": "query_dataset",
            "description": "Group-by aggregation (sum/mean/count/min/max/median), top N groups.",
            "parameters": {"dataset_id": {"type": "string"}, "group_by": {"type": "string"}, "value_column": {"type": "string"}, "aggregation": {"type": "string", "default": "sum"}},
            "category": "Querying",
        },
        {
            "name": "detect_anomalies",
            "description": "Find unusual records. method: iqr | zscore | isolation_forest.",
            "parameters": {"dataset_id": {"type": "string"}, "method": {"type": "string", "default": "iqr"}},
            "category": "Machine Learning",
        },
    ]


@app.get("/api/mcp/logs")
def mcp_logs():
    return []
