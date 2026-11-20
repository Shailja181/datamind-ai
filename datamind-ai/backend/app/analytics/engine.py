"""Shared analytics engine. Used by both the FastAPI routes and the MCP server."""
import os, re
from pathlib import Path
import numpy as np
import pandas as pd

DATA_DIR = Path(os.getenv("DATAMIND_DATA_DIR",
                Path(__file__).resolve().parents[3] / "data" / "uploads"))
_ID = re.compile(r"^[a-f0-9]{32}$")  # blocks path traversal


def _path(dataset_id: str) -> Path:
    if not _ID.match(dataset_id):
        raise ValueError("Invalid dataset id")
    return DATA_DIR / f"{dataset_id}.csv"


def save_dataset(df: pd.DataFrame, dataset_id: str) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(_path(dataset_id), index=False)


def load_dataset(dataset_id: str) -> pd.DataFrame:
    p = _path(dataset_id)
    if not p.exists():
        raise FileNotFoundError(f"Dataset {dataset_id} not found")
    df = pd.read_csv(p)
    for c in df.select_dtypes(include=["object", "string"]):  # auto-detect datetimes
        parsed = pd.to_datetime(df[c], errors="coerce")
        if parsed.notna().mean() > 0.9:
            df[c] = parsed
    return df


def column_types(df: pd.DataFrame) -> dict:
    return {
        "numeric": df.select_dtypes("number").columns.tolist(),
        "datetime": df.select_dtypes("datetime").columns.tolist(),
        "categorical": df.select_dtypes(exclude=["number", "datetime"]).columns.tolist(),
    }


def _clean(o):
    if isinstance(o, dict): return {str(k): _clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [_clean(v) for v in o]
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, (np.floating, float)): return None if np.isnan(o) else float(o)
    if isinstance(o, pd.Timestamp): return o.isoformat()
    return o


def analyze(df: pd.DataFrame) -> dict:
    types = column_types(df)
    num = df[types["numeric"]]
    missing = df.isna().sum()
    out = {
        "rows": len(df), "columns": df.shape[1], "column_types": types,
        "duplicates": int(df.duplicated().sum()),
        "missing": {c: int(v) for c, v in missing.items() if v},
        "descriptive": num.describe().T.assign(
            median=num.median(), variance=num.var()).to_dict("index") if not num.empty else {},
        "correlation": num.corr().round(3).to_dict() if num.shape[1] > 1 else {},
        "outliers_iqr": {}, "insights": [],
    }
    for c in num:
        out["outliers_iqr"][c] = int(detect_anomalies(df, [c], "iqr")["count"])
    quality = 100 - 100 * (missing.sum() / max(df.size, 1)) - min(out["duplicates"], 100) * 0.1
    out["quality_score"] = round(max(quality, 0), 1)
    # Insights derived strictly from computed values
    for c, n in out["missing"].items():
        out["insights"].append(f"Column '{c}' has {n} missing values ({n/len(df):.1%}).")
    if out["duplicates"]:
        out["insights"].append(f"{out['duplicates']} duplicate rows found.")
    for a, row in out["correlation"].items():
        for b, v in row.items():
            if a < b and v is not None and abs(v) >= 0.7:
                out["insights"].append(f"Strong correlation between '{a}' and '{b}' (r={v}).")
    for c, n in out["outliers_iqr"].items():
        if n: out["insights"].append(f"'{c}' has {n} IQR outliers.")
    return _clean(out)


def column_summary(df: pd.DataFrame, column: str) -> dict:
    if column not in df.columns:
        raise ValueError(f"Unknown column '{column}'")
    s = df[column]
    base = {"column": column, "dtype": str(s.dtype), "missing": int(s.isna().sum()),
            "unique": int(s.nunique())}
    if pd.api.types.is_numeric_dtype(s):
        base.update(mean=s.mean(), median=s.median(), std=s.std(), var=s.var(),
                    min=s.min(), max=s.max(), skew=s.skew())
        base["mode"] = s.mode().iloc[0] if not s.mode().empty else None
    else:
        base["top_values"] = s.value_counts().head(10).to_dict()
    return _clean(base)


def query(df: pd.DataFrame, group_by: str, value: str, agg: str = "sum", top_n: int = 5) -> dict:
    """Validated operation only: whitelist of aggregations, no eval/SQL."""
    if agg not in {"sum", "mean", "count", "min", "max", "median"}:
        raise ValueError("agg must be one of sum, mean, count, min, max, median")
    for c in (group_by, value):
        if c not in df.columns:
            raise ValueError(f"Unknown column '{c}'")
    top_n = max(1, min(int(top_n), 100))
    res = df.groupby(group_by)[value].agg(agg).sort_values(ascending=False).head(top_n)
    return _clean({"group_by": group_by, "value": value, "agg": agg, "result": res.to_dict()})


def detect_anomalies(df: pd.DataFrame, columns: list[str] | None = None,
                     method: str = "iqr", threshold: float = 3.0, max_rows: int = 50) -> dict:
    cols = columns or df.select_dtypes("number").columns.tolist()
    bad = [c for c in cols if c not in df.columns or not pd.api.types.is_numeric_dtype(df[c])]
    if bad or not cols:
        raise ValueError(f"Need numeric columns; invalid: {bad}")
    X = df[cols]
    if method == "iqr":
        q1, q3 = X.quantile(.25), X.quantile(.75)
        iqr = q3 - q1
        mask = ((X < q1 - 1.5 * iqr) | (X > q3 + 1.5 * iqr)).any(axis=1)
    elif method == "zscore":
        z = (X - X.mean()) / X.std(ddof=0).replace(0, np.nan)
        mask = (z.abs() > threshold).any(axis=1)
    elif method == "isolation_forest":
        from sklearn.ensemble import IsolationForest
        Xf = X.fillna(X.median())
        mask = pd.Series(IsolationForest(random_state=42, contamination="auto")
                         .fit_predict(Xf) == -1, index=df.index)
    else:
        raise ValueError("method must be iqr, zscore or isolation_forest")
    mask = mask.fillna(False)
    return _clean({"method": method, "columns": cols, "count": int(mask.sum()),
                   "percent": round(100 * mask.mean(), 2),
                   "records": df[mask].head(max_rows).to_dict("records")})
