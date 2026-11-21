# DataMind AI

### Turn Data into Decisions with AI.

DataMind AI is an agentic data analytics platform that combines automated data analysis, machine learning and Model Context Protocol (MCP) integration to make data exploration smarter and more accessible.

**Key principle:** The LLM never calculates statistical results itself. All numerical computations are performed by a dedicated analytics engine to ensure reliable, data-driven results.

## ✨ Features

- **Automated EDA:** Statistical summaries, missing-value analysis and dataset insights.
- **Data Explorer:** Upload and explore structured datasets.
- **AI Analyst:** Natural-language interaction with datasets.
- **ML Playground:** Machine learning model training and evaluation.
- **Anomaly Detection:** Identify unusual patterns and outliers.
- **Interactive Visualizations:** Explore analytical results through charts.
- **MCP Integration:** Expose analytics capabilities through reusable MCP tools.
- **REST API:** FastAPI-powered backend with interactive API documentation.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI
- **Data Analysis:** Pandas, NumPy
- **Machine Learning:** Scikit-learn
- **AI Integration:** Gemini API, MCP
- **Testing:** Pytest

## 📁 Project Structure

```text
datamind-ai/
├── backend/
│   ├── app/
│   │   ├── analytics/
│   │   └── main.py
│   ├── data/uploads/
│   └── requirements.txt
├── frontend/
├── mcp_server/
│   ├── requirements.txt
│   └── server.py
├── sample_data/
│   └── sales.csv
├── docs/
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Getting Started

**1. Create a virtual environment**

```bash
python -m venv .venv
```

**2. Activate the environment**

Windows:
```bash
.venv\Scripts\activate
```

Linux/macOS:
```bash
source .venv/bin/activate
```

**3. Install backend dependencies**

```bash
pip install -r backend/requirements.txt
```

**4. Start the backend**

```bash
cd backend
uvicorn app.main:app --reload
```

**5. Start the frontend** (in a separate terminal)

```bash
cd frontend
npm install
npm run dev
```

**6. Run tests** (from the project root)

```bash
pytest tests -v
```

## 🔌 MCP Tools

- `analyze_dataset`
- `get_column_summary`
- `query_dataset`
- `detect_anomalies`

The MCP server uses STDIO transport to communicate with compatible MCP clients.

## 🗺️ Roadmap

- [x] Analytics engine and FastAPI backend
- [x] React frontend
- [x] MCP server integration
- [x] Dataset validation and automated tests
- [ ] Advanced reporting and exports
- [ ] Gemini-powered agent enhancements
- [ ] Database persistence

## 📄 License

MIT License

---

**DataMind AI — Making data analysis smarter, safer, and more accessible.**
