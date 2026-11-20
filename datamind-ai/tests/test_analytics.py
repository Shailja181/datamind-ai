import sys, uuid, asyncio
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
import pandas as pd, pytest
from fastapi.testclient import TestClient
from app.analytics import engine
from app.main import app

DF = pd.read_csv(ROOT / "sample_data" / "sales.csv")

def test_analyze():
    r = engine.analyze(DF)
    assert r["rows"] == 300 and "revenue" in r["column_types"]["numeric"]
    assert r["outliers_iqr"]["revenue"] >= 1

@pytest.mark.parametrize("m", ["iqr", "zscore", "isolation_forest"])
def test_anomalies(m):
    assert engine.detect_anomalies(DF, ["revenue"], m)["count"] > 0

def test_query_rejects_bad_agg():
    with pytest.raises(ValueError): engine.query(DF, "product", "revenue", "__import__")

def test_path_traversal_blocked():
    with pytest.raises(ValueError): engine.load_dataset("../../etc/passwd")

def test_upload_api():
    c = TestClient(app)
    ok = c.post("/api/datasets", files={"file": ("s.csv", (ROOT/"sample_data/sales.csv").read_bytes())})
    assert ok.status_code == 200
    did = ok.json()["id"]
    assert c.get(f"/api/datasets/{did}/eda").json()["rows"] == 300
    assert c.post("/api/datasets", files={"file": ("x.txt", b"hi")}).status_code == 400

def test_mcp_roundtrip():
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    did = uuid.uuid4().hex; engine.save_dataset(DF, did)
    async def run():
        p = StdioServerParameters(command=sys.executable, args=[str(ROOT/"mcp_server/server.py")])
        async with stdio_client(p) as (r, w):
            async with ClientSession(r, w) as s:
                await s.initialize()
                names = {t.name for t in (await s.list_tools()).tools}
                res = await s.call_tool("query_dataset", {"dataset_id": did, "group_by": "product", "value_column": "revenue"})
                return names, res
    names, res = asyncio.run(run())
    assert {"analyze_dataset", "detect_anomalies"} <= names and not res.isError
