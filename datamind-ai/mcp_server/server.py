"""Standalone DataMind MCP server (STDIO). Run: python mcp_server/server.py"""
import sys, logging
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from mcp.server.fastmcp import FastMCP
from app.analytics import engine

logging.basicConfig(level=logging.INFO, stream=sys.stderr)  # never log to stdout on STDIO
mcp = FastMCP("datamind-analytics")


def _safe(fn):
    try:
        return {"ok": True, "result": fn()}
    except (ValueError, FileNotFoundError) as e:
        return {"ok": False, "error": str(e)}


@mcp.tool()
def analyze_dataset(dataset_id: str) -> dict:
    """Run automated EDA: types, missing values, duplicates, descriptive stats,
    correlations, IQR outliers and data-derived insights."""
    return _safe(lambda: engine.analyze(engine.load_dataset(dataset_id)))


@mcp.tool()
def get_column_summary(dataset_id: str, column: str) -> dict:
    """Detailed statistics for one column (numeric stats or top categories)."""
    return _safe(lambda: engine.column_summary(engine.load_dataset(dataset_id), column))


@mcp.tool()
def query_dataset(dataset_id: str, group_by: str, value_column: str,
                  aggregation: str = "sum", top_n: int = 5) -> dict:
    """Group-by aggregation (sum/mean/count/min/max/median), top N groups.
    Use for questions like 'which product has the highest revenue'."""
    return _safe(lambda: engine.query(engine.load_dataset(dataset_id),
                                      group_by, value_column, aggregation, top_n))


@mcp.tool()
def detect_anomalies(dataset_id: str, method: str = "iqr",
                     columns: list[str] | None = None) -> dict:
    """Find unusual records. method: iqr | zscore | isolation_forest."""
    return _safe(lambda: engine.detect_anomalies(engine.load_dataset(dataset_id), columns, method))


if __name__ == "__main__":
    mcp.run(transport="stdio")
