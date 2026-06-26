# Data Product Discovery & Delivery Assistant

## What This Is
AI-augmented Business Analyst tool that transforms vague business discussions into structured, traceable data product requirements and delivery plans. Portfolio piece for Senior Data BA role at Thoughtworks.

## Tech Stack
| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Tailwind CSS + shadcn/ui |
| Backend | FastAPI + SQLAlchemy | Python 3.11 |
| Database | SQLite (MVP) | PostgreSQL-ready via SQLAlchemy |
| AI | Claude API (Anthropic SDK) | Structured extraction + generation |

## Architecture

### Monorepo Structure
```
data-product-assistant/
├── backend/          # FastAPI application
│   ├── main.py       # App entry, CORS, lifespan
│   ├── config.py     # Settings (env-based)
│   ├── database.py   # SQLAlchemy engine + session
│   ├── models/       # SQLAlchemy ORM models
│   ├── schemas/      # Pydantic request/response schemas
│   ├── services/     # Business logic layer
│   ├── routers/      # API route handlers
│   └── ai/           # Claude API integration
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/  # UI components
│       ├── lib/      # API client, utilities
│       └── types/    # TypeScript types
```

### Core Domain Model
```
Workspace
  └── Discovery (extracted from input text)
        ├── Business Objectives
        ├── Stakeholders
        ├── KPIs
        ├── Assumptions
        └── Risks
  └── Data Requirements (generated from discoveries)
        ├── Business Entity
        ├── Data Points
        ├── Source Systems
        ├── Dependencies
        └── Gaps
  └── Delivery Artifacts (generated from requirements)
        ├── Epics
        │   └── Features
        │       └── User Stories
        │           └── Acceptance Criteria
        └── Dependencies
  └── Change Impact Analysis
        ├── Change Description
        ├── Impacted KPIs
        ├── Impacted Data Requirements
        ├── Impacted Stories
        └── Risk Assessment
```

### Traceability Chain
**Business Problem → KPIs → Data Requirements → Delivery Artifacts**
Every entity maintains foreign keys back to its parent in the chain.

## API Contract

### Workspaces
- `POST /api/workspaces` — Create workspace
- `GET /api/workspaces` — List workspaces
- `GET /api/workspaces/{id}` — Get workspace with summary counts
- `DELETE /api/workspaces/{id}` — Delete workspace

### Discovery
- `POST /api/workspaces/{id}/discover` — Submit text → AI extracts structured data
- `GET /api/workspaces/{id}/discoveries` — List discoveries
- `GET /api/discoveries/{id}` — Get single discovery
- `PUT /api/discoveries/{id}` — Edit discovery fields

### Data Requirements
- `POST /api/workspaces/{id}/data-requirements/generate` — AI generates from discoveries
- `GET /api/workspaces/{id}/data-requirements` — List requirements
- `PUT /api/data-requirements/{id}` — Edit requirement

### Delivery Planning
- `POST /api/workspaces/{id}/delivery-plan/generate` — AI generates from requirements
- `GET /api/workspaces/{id}/delivery-artifacts` — List artifacts (tree structure)
- `PUT /api/delivery-artifacts/{id}` — Edit artifact

### Change Impact
- `POST /api/workspaces/{id}/impact-analysis` — Submit change → AI analyzes impact

### Traceability
- `GET /api/workspaces/{id}/traceability` — Full traceability map

## Frontend Routes
| Route | Page |
|---|---|
| `/` | Workspace selector / landing |
| `/workspace/[id]` | Workspace dashboard |
| `/workspace/[id]/discover` | Discovery input + AI results |
| `/workspace/[id]/requirements` | Data requirements matrix |
| `/workspace/[id]/delivery` | Delivery plan (epics/stories) |
| `/workspace/[id]/impact` | Change impact analysis |
| `/workspace/[id]/traceability` | End-to-end traceability view |

## Design Principles
1. **Consultant-grade UI** — Clean, professional, minimal. Navy/blue primary palette.
2. **AI assists, human decides** — All AI outputs are editable.
3. **Traceability is sacred** — Every artifact traces back to a business problem.
4. **Workspace isolation** — Projects don't leak context.
5. **Show the chain** — Always make the Business Problem → Delivery connection visible.

## Running Locally
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000
```

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...   # Required for AI features
DATABASE_URL=sqlite:///./data.db  # Default SQLite
```
