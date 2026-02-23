# IRIS — Infrastructure Risk Intelligence System

> Rule-based multi-agent platform for real-time bridge safety monitoring, risk assessment, and emergency response coordination — built for Chennai infrastructure.

---

## Problem

India maintains over **150,000 bridges** across national and state highways. Many are aging, under-monitored, or rely on periodic manual inspection. Current systems are **reactive** — alerts come *after* failure begins. IRIS makes structural monitoring **proactive** using a 4-agent rule-based pipeline that continuously analyzes sensor data, computes weighted risk scores, and recommends deterministic action protocols before catastrophic events occur.

---

## Solution

IRIS deploys four specialized rule-based agents that operate as a real-time decision pipeline:

```
Sensors → [Ingestion] → [Risk Scorer] → [Decision] → [Alerter] → Dashboard
            Validate       Score 0-100    MONITOR/WARN   Notify
            Normalize      + Risk Level   RESTRICT/EVAC  Stakeholders
```

Every decision includes a **deterministic justification** — full transparency and explainability for safety-critical systems. No black-box models — all logic is weighted scoring with configurable thresholds.

The pilot deployment monitors **Chennai bridges** — Adyar River Bridge (Anna Salai), Kathipara Flyover (NH-45), Napier Bridge (Cooum River), with stakeholder coordination across TN-PWD, NHAI, Chennai Police, and TNFRS.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                         │
│                                                          │
│  ┌───────────────────┐      ┌──────────────────────────┐ │
│  │   FRONTEND (3000) │      │   BACKEND (8000)         │ │
│  │                   │      │                          │ │
│  │  Nginx            │─/api─│  FastAPI                 │ │
│  │  ├─ Static Build  │      │  ├─ REST API             │ │
│  │  ├─ SPA Routing   │      │  ├─ SSE Stream           │ │
│  │  └─ Reverse Proxy │      │  ├─ Scenario Runner      │ │
│  │                   │      │  │                        │ │
│  │  React + TS       │◀─SSE─│  │  Agent Pipeline:       │ │
│  │  ├─ Dashboard     │      │  │  1. Ingestion Agent    │ │
│  │  ├─ Risk Map      │      │  │  2. Risk Scorer Agent  │ │
│  │  ├─ Analytics     │      │  │  3. Decision Agent     │ │
│  │  ├─ Stakeholders  │      │  │  4. Alert Agent        │ │
│  │  └─ Settings      │      │  └────────────────────────│ │
│  └───────────────────┘      └──────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Python + FastAPI | 3.12 / 0.115 |
| Data Validation | Pydantic v2 | 2.x |
| SSE Streaming | sse-starlette | 2.x |
| ASGI Server | Uvicorn | 0.34 |
| Frontend | React + TypeScript | 19 / 5.9 |
| Build Tool | Vite | 7.3 |
| CSS | TailwindCSS | 4.2 |
| PDF Export | jsPDF + jspdf-autotable | 4.2 / 5.0 |
| Package Manager | pnpm | 10.x |
| Deployment | Docker + Docker Compose | — |

---

## Features

- **Real-time SSE streaming** — Live sensor data pushed to browser every 3 seconds
- **4-Agent Rule-Based Pipeline** — Modular, deterministic agents with clear inputs/outputs
- **Explainable Decisions** — Every MONITOR/WARN/RESTRICT/EVACUATE includes justification
- **Interactive Dashboard** — 5 pages: Overview, Risk Map, Analytics, Stakeholders, Settings
- **Professional Landing Page** — Feature showcase, workflow visualization, one-click dashboard entry
- **PDF Export** — One-click branded incident reports with Chennai-specific emergency contacts
- **Scenario Simulation** — Normal Day, Storm Escalation, Critical Failure demos
- **Indian Localization** — Chennai bridges, TN-PWD/NHAI stakeholders, realistic +91 contacts
- **Browser Notifications** — Native alerts on RED risk level
- **Mobile Responsive** — Bottom tab navigation on mobile devices
- **Dark Command Theme** — Military/operations center aesthetic with cyan accent system
- **Error Boundaries** — Crash isolation per page with graceful recovery
- **Loading States** — Skeleton cards for every data section

---

## Quick Start

### Docker (Recommended)

```bash
docker compose up --build
# Open http://localhost:3000
```

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd iris-frontend
pnpm install
pnpm dev
# Open http://localhost:5173
```

**Production Build:**
```bash
cd iris-frontend
pnpm build
# Output in dist/
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/status` | Current system status |
| GET | `/api/alerts` | Alert history (last 50) |
| GET | `/api/stream` | SSE real-time event stream |
| GET | `/api/scenarios` | Available simulation scenarios |
| POST | `/api/scenarios/:name/start` | Start a named scenario |

---

## Risk Scoring

```
Score = (Stress × 0.35 + Vibration × 0.25 + Load × 0.20 + Environmental × 0.20) × 100
```

| Level | Score Range | Action |
|---|---|---|
| GREEN | 0 – 30 | MONITOR — standard operation |
| YELLOW | 31 – 55 | WARN — increase monitoring |
| ORANGE | 56 – 75 | RESTRICT — reduce traffic, inspect |
| RED | 76 – 100 | EVACUATE — close bridge, emergency services |

**Compound rules:** Stress > 0.8 AND Vibration > 0.7 → Force RED regardless of score.

---

## Demo Script (3 Minutes)

1. **Minute 1:** Landing page walkthrough → click "Open Live Dashboard" → explain 4-agent pipeline → click "Normal Day" → show GREEN state with Chennai bridge data
2. **Minute 2:** Click "Critical Failure" → watch live escalation GREEN → YELLOW → ORANGE → RED → show EVACUATE protocol with justification → browser notification fires
3. **Minute 3:** Navigate to Map (Adyar River Bridge, Kathipara Flyover markers) → Stakeholders (TN-PWD, NHAI contacts, export PDF) → Analytics (historical charts) → click IRIS logo to return to landing → show mobile view

---

## Project Structure

```
iris-frontend/
├── src/
│   ├── api/          # SSE connection + REST client
│   ├── components/   # Reusable UI components
│   │   ├── LandingPage.tsx    # Professional landing with feature grid
│   │   ├── AboutModal.tsx     # Project info modal (4 tabs)
│   │   ├── ErrorBoundary.tsx  # Crash isolation
│   │   ├── SkeletonCard.tsx   # Loading states
│   │   ├── Sidebar.tsx        # Desktop + mobile nav
│   │   ├── Header.tsx         # Top bar + status
│   │   ├── RiskCard.tsx       # Risk gauge
│   │   ├── DecisionCard.tsx   # Action protocol
│   │   ├── AlertFeed.tsx      # Alert stream
│   │   ├── SystemStatus.tsx   # Agent pipeline viz
│   │   └── ScenarioControls.tsx
│   ├── pages/        # Full page views
│   ├── types/        # TypeScript schemas
│   ├── utils/        # PDF export utilities
│   ├── App.tsx       # Root with routing + state
│   └── index.css     # Dark theme design system
├── Dockerfile
├── nginx.conf
└── package.json

backend/
├── agents/           # 4 rule-based agents
│   ├── ingestion.py
│   ├── risk_scorer.py
│   ├── decision.py
│   └── alerter.py
├── main.py           # FastAPI app + SSE
├── scenarios.py      # Simulation engine
├── Dockerfile
└── requirements.txt
```

---

## Future Roadmap

- **ML Risk Scorer** — Upgrade to trained regression model for adaptive scoring
- **Anomaly Detection** — Isolation Forest for sensor anomaly flagging
- **PostgreSQL + Redis** — Persistent storage + pub/sub for multi-client SSE
- **Real IoT** — MQTT sensor ingestion from physical devices (NHAI bridge sensors)
- **SMS/Email Alerts** — Multi-channel notification dispatch via Indian telecom APIs
- **Kubernetes** — Horizontal scaling for multi-bridge, multi-city monitoring
- **Multi-city Expansion** — Mumbai, Bengaluru, Kolkata bridge networks
- **NHAI Integration** — Direct feed from National Highway Authority sensor grids

---

## Team

IRIS — Hackathon 2026

---

## License

MIT
