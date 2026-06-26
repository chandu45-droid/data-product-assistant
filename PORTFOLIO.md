# Data Product Discovery & Delivery Assistant

## Portfolio Summary

**Role demonstrated:** Senior Data Business Analyst
**Built for:** Thoughtworks portfolio submission
**Live demo:** https://frontend-one-chi-43.vercel.app
**Source code:** https://github.com/chandu45-droid/data-product-assistant

---

## What It Does

An AI-augmented business analysis tool that transforms unstructured stakeholder conversations into structured, traceable data product requirements and delivery plans.

The full pipeline:

1. **Discovery** — Paste free-text from stakeholder interviews. AI extracts business objectives, stakeholders, KPIs, assumptions, and risks.
2. **Data Requirements** — Generate structured requirements with business entities, data points, source systems, dependencies, and gaps — all traced back to discoveries.
3. **Delivery Planning** — Generate an Agile delivery plan (epics, features, user stories with acceptance criteria) traceable to requirements.
4. **Impact Analysis** — Submit a scope change and see exactly which KPIs, requirements, and stories are affected, with risk assessment.
5. **Traceability** — End-to-end visualization: Business Problem -> KPIs -> Data Requirements -> Delivery Artifacts.

---

## Why This Matters

In data engagements, the gap between "what the business wants" and "what gets built" is where projects fail. Requirements drift, traceability is maintained in spreadsheets (if at all), and impact analysis for scope changes is manual and error-prone.

This tool addresses three real problems I've seen in data BA work:

1. **Extraction is slow** — Manually structuring insights from stakeholder conversations takes hours. AI does the first pass in seconds, then the BA refines.
2. **Traceability breaks** — Once requirements move to delivery, the chain back to business value gets lost. This tool enforces traceability as a structural property, not a documentation afterthought.
3. **Impact analysis is reactive** — When scope changes happen, teams scramble to figure out what's affected. This tool surfaces the blast radius instantly.

---

## Technical Architecture

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Modern React with server-side rendering, responsive design |
| Backend | FastAPI + SQLAlchemy | Python async API with ORM for database portability |
| AI | Claude API (Anthropic) | Structured extraction and generation with mock fallback |
| Database | SQLite (demo) / PostgreSQL-ready | SQLAlchemy abstraction allows seamless migration |
| Deployment | Vercel (both frontend + serverless Python backend) | Zero-ops deployment with instant global CDN |

### Key Design Decisions

- **AI assists, human decides:** All AI-generated outputs are fully editable. The tool augments the BA's judgment, it doesn't replace it.
- **Workspace isolation:** Each project is a self-contained workspace. No data leaks between engagements.
- **Mock AI fallback:** When no API key is configured, the app returns realistic structured mock data. The demo always works.
- **Traceability as architecture:** Foreign keys enforce the Business Problem -> KPI -> Requirement -> Artifact chain at the database level, not just the UI level.

---

## BA Skills Demonstrated

| Skill | How It's Shown |
|---|---|
| **Requirements elicitation** | Discovery page transforms unstructured input into structured business artifacts |
| **Data modeling** | Domain model captures business entities, data points, source systems, and their relationships |
| **Stakeholder analysis** | AI identifies stakeholders, their concerns, and influence from conversation text |
| **Agile delivery planning** | Epic/feature/story hierarchy with acceptance criteria and dependency tracking |
| **Impact analysis** | Change propagation through the requirement chain with risk assessment |
| **Traceability management** | End-to-end visualization from business objectives to delivery artifacts |
| **Technical communication** | Clean, consultant-grade UI that could be presented to stakeholders |

---

## What I'd Add Next

If this were a real product for a data consultancy:

- **PostgreSQL + auth** — Multi-user with role-based access (BA lead, analyst, reviewer)
- **Export to Jira/Confluence** — Push delivery artifacts directly into project tools
- **Version history** — Track how requirements evolve over the engagement lifecycle
- **Real-time collaboration** — Multiple BAs working on the same workspace
- **Custom AI prompts** — Let senior BAs tune extraction templates per domain (healthcare, finance, retail)

---

## Running It

```bash
# Clone
git clone https://github.com/chandu45-droid/data-product-assistant.git

# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
# Open http://localhost:3000
```

Set `ANTHROPIC_API_KEY` for live AI. Without it, the app uses realistic mock data.
