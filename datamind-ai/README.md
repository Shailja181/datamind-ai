# DataMind AI: Agentic Data Analytics Platform
*Turn Data into Decisions with AI.*

## Status (Phase 1-2 core + Phase 5 start)
Done and tested: analytics engine, FastAPI upload/EDA/anomaly API, standalone MCP server (STDIO) with
`analyze_dataset`, `get_column_summary`, `query_dataset`, `detect_anomalies`.
Not yet built: React frontend, ML playground, Gemini agent, PDF/Excel reports, DB persistence,
`train_ml_model` / `generate_visualization` / `generate_report` MCP tools.

## Run
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --reload     # API on :8000 (docs at /docs)
python mcp_server/server.py                      # MCP server over STDIO (from repo root)
pytest tests -v                                  # from repo root
```
Architecture: `backend/app/analytics/engine.py` is the single source of truth; the API and MCP server both call it,
so the LLM never computes numbers itself. Dataset IDs are validated 32-hex strings (no path traversal),
queries use a whitelist of operations (no eval / raw SQL).
