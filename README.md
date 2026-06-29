# Data Product Discovery & Delivery Assistant

An AI-augmented Business Analyst tool that transforms unstructured business discussions into structured, traceable data product requirements and delivery plans.

**[Live Demo](https://frontend-one-chi-43.vercel.app)**

---

## What It Does

Paste a business discussion, stakeholder transcript, or problem statement — the assistant extracts structured insights and builds a complete delivery pipeline:

```
Business Discussion → Discovery → Data Requirements → Delivery Plan → Impact Analysis
```

Every artifact maintains full traceability back to the original business problem.

### The Pipeline

| Step | What Happens |
|---|---|
| **1. Discovery** | AI extracts business objectives, stakeholders, KPIs, assumptions, and risks from unstructured text |
| **2. Data Requirements** | Generates structured data requirements — entities, data points, source systems, dependencies, gaps |
| **3. Delivery Planning** | Creates epics, features, user stories with acceptance criteria — ready for sprint planning |
| **4. Impact Analysis** | Submit a change request → see which KPIs, requirements, and stories are affected |
| **5. Traceability** | End-to-end view: Business Problem → KPIs → Data Requirements → Delivery Artifacts |

### Why It Matters

Traditional BA workflows lose context between phases. A requirement traced to "the stakeholder meeting" isn't traceable. This tool maintains explicit, queryable links from business problems through to user stories — so every delivery artifact can answer "why does this exist?"

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, SQLAlchemy ORM, Python 3.11 |
| **Database** | SQLite (MVP) — PostgreSQL-ready via SQLAlchemy |
| **AI** | Claude API (Anthropic) — structured extraction + generation |
| **Deployment** | Frontend on Vercel, Backend on Render |
| **Testing** | Playwright end-to-end tests |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            Next.js 14 (App Router)               │
│                                                  │
│  Landing → Workspace → Discover → Requirements  │
│              → Delivery → Impact → Traceability  │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────┐
│                   Backend                        │
│                  FastAPI                          │
│                                                  │
│  Routers: workspaces / discovery / requirements  │
│           delivery / impact / traceability        │
│                                                  │
│  Services ──→ Claude AI (structured extraction)  │
│  Models   ──→ SQLAlchemy ORM                     │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────┴────────┐
              │    SQLite DB    │
              │  (PostgreSQL    │
              │    ready)       │
              └─────────────────┘
```

### Domain Model

```
Workspace
  ├── Discoveries (extracted from input text)
  │     ├── Business Objectives
  │     ├── Stakeholders
  │     ├── KPIs
  │     ├── Assumptions
  │     └── Risks
  ├── Data Requirements (generated from discoveries)
  │     ├── Business Entity & Data Points
  │     ├── Source Systems
  │     ├── Dependencies & Gaps
  ├── Delivery Artifacts (generated from requirements)
  │     ├── Epics → Features → User Stories
  │     └── Acceptance Criteria
  └── Change Impact Analysis
        ├── Impacted KPIs & Requirements
        ├── Impacted Stories
        └── Risk Assessment
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/workspaces` | Create a new workspace |
| `POST` | `/api/workspaces/{id}/discover` | Submit text → AI extracts structured data |
| `POST` | `/api/workspaces/{id}/data-requirements/generate` | Generate data requirements from discoveries |
| `POST` | `/api/workspaces/{id}/delivery-plan/generate` | Generate delivery plan from requirements |
| `POST` | `/api/workspaces/{id}/impact-analysis` | Analyze impact of a proposed change |
| `GET` | `/api/workspaces/{id}/traceability` | Full traceability map |

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...   # Required for AI features
DATABASE_URL=sqlite:///./data.db  # Default SQLite
```

## Design Principles

1. **AI assists, human decides** — All AI-generated outputs are fully editable
2. **Traceability is sacred** — Every artifact traces back to a business problem
3. **Workspace isolation** — Projects don't leak context across workspaces
4. **Consultant-grade UI** — Clean, professional, minimal navy/blue palette

---

Built with AI-assisted development using Claude.
