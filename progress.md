# Data Product Assistant — Progress Tracker

## Project Overview
AI-augmented Business Analyst tool for Thoughtworks Senior Data BA portfolio piece.
Transforms business discussions → structured, traceable data product requirements & delivery plans.

**Tech Stack:** Next.js 14 (frontend) + FastAPI (backend) + Claude API (AI) + SQLite (DB)

---

## Milestone 1: MVP Build ✅
**Status:** Complete — committed as initial MVP

| Task | Status | Notes |
|---|---|---|
| Backend: FastAPI skeleton + all routers | ✅ Done | main.py, 5 route modules |
| Backend: SQLAlchemy models + Pydantic schemas | ✅ Done | models/__init__.py, schemas/__init__.py |
| Backend: Claude AI integration (mock fallback) | ✅ Done | services/ai_service.py |
| Frontend: Next.js 14 App Router scaffold | ✅ Done | Tailwind, lucide-react, custom design system |
| Frontend: Landing page + workspace CRUD | ✅ Done | / route, create/delete workspaces |
| Frontend: Discovery page (submit + edit) | ✅ Done | Editable objectives, stakeholders, KPIs, risks |
| Frontend: Requirements page (generate + filter) | ✅ Done | Status filters, priority badges |
| Frontend: Delivery page (plan + stories) | ✅ Done | Epic/feature/story hierarchy, edit forms |
| Frontend: Impact analysis page | ✅ Done | Risk derivation, impacted KPIs/requirements/stories |
| Frontend: Traceability visualization | ✅ Done | 4-column SVG bezier curve layout |
| Frontend: Workspace dashboard | ✅ Done | Summary cards, workflow progress, traceability health |
| Reusable UI components | ✅ Done | Card, Button, Badge, Header, PageLoader, StatusBadge, TagGroup |

## Milestone 2: API Contract Alignment ✅
**Status:** Complete — all 7 mismatches fixed and verified

| # | Mismatch | Fix | Status |
|---|---|---|---|
| 1 | Discovery payload: frontend sent `{text}`, backend expects `{title, raw_input}` | Updated `DiscoverPayload` type + `submitDiscovery` call + discover page | ✅ Fixed |
| 2 | Discovery shape: frontend expected `objectives: string[]`, backend returns `BusinessObjective[]` | Updated `Discovery` type, added `BusinessObjective`/`Stakeholder` interfaces | ✅ Fixed |
| 3 | Requirements: frontend had `linked_kpis`, `updated_at` — backend doesn't | Removed from `DataRequirement` type, removed TagGroup from page | ✅ Fixed |
| 4 | Requirements: missing `"identified"` status | Added to `RequirementStatus` union + filter dropdown | ✅ Fixed |
| 5 | Delivery: `acceptance_criteria` as objects vs strings, missing `"planned"` status | Fixed type to `string[]`, added status, updated StoryCard | ✅ Fixed |
| 6 | Impact: frontend expected `summary`/`risk_level`, backend has `risk_assessment`/`recommendations` | Added `deriveRiskLevel()`, updated `ImpactAnalysis` type + page | ✅ Fixed |
| 7 | Traceability: frontend expected flat 4-column, backend returns hierarchical | Added `TraceabilityResponse` types + `transformTraceability()` in api.ts | ✅ Fixed |

**Verification:**
- `npx next build` — ✅ passes clean
- `python -c "from main import app"` — ✅ passes clean
- Git clean, pushed to origin/master

## Milestone 3: Deployment Prep ✅
**Status:** Complete — config committed

| Task | Status | Notes |
|---|---|---|
| render.yaml for backend | ✅ Done | Python web service, uvicorn, env vars |
| CORS configured for all origins | ✅ Done | `["*"]` in config.py |
| NEXT_PUBLIC_API_URL configurable | ✅ Done | Environment variable in api.ts |

## Milestone 4: E2E Testing ✅
**Status:** Complete — all endpoints tested locally (2026-06-26)

| Task | Status | Notes |
|---|---|---|
| Start backend server locally | ✅ Done | uvicorn on :8000, AI disabled (mock mode) |
| Start frontend server locally | ✅ Done | Next.js 16.2.9 on :3000 |
| Health check | ✅ Done | `{"status":"healthy","ai_enabled":false}` |
| Create workspace flow | ✅ Done | POST /api/workspaces → 200 |
| Discovery submission + edit | ✅ Done | POST discover → rich mock data (3 objectives, 5 stakeholders, 4 KPIs, 5 risks). PUT update → objectives reduced to 2 |
| Requirements generation | ✅ Done | 5 requirements generated, all status="identified", priorities correct |
| Delivery plan generation | ✅ Done | 3 epics with nested features/stories, all status="planned" |
| Impact analysis | ✅ Done | Returns impacted KPIs (3), requirements (2), stories (2+), risk_assessment text |
| Traceability view | ✅ Done | Hierarchical response with discoveries→requirements→artifacts chain |
| Dashboard metrics | ✅ Done | Workspace detail returns discovery_count=1, requirement_count=5, artifact_count=18 |
| List endpoints | ✅ Done | All 4 list endpoints return correct counts |
| Frontend pages (all 7) | ✅ Done | All return HTTP 200 |
| Delete workspace | ✅ Done | 204 No Content, clean cascade |

## Milestone 5: Production Deployment ✅
**Status:** Complete — both services live on Vercel (2026-06-26)

| Task | Status | Notes |
|---|---|---|
| Deploy backend | ✅ Done | Vercel serverless: `https://backend-sigma-six-19.vercel.app` |
| Deploy frontend | ✅ Done | Vercel: `https://frontend-one-chi-43.vercel.app` |
| Connect frontend → backend | ✅ Done | `NEXT_PUBLIC_API_URL` env var set on Vercel |
| Smoke test: health check | ✅ Done | `/api/health` returns healthy |
| Smoke test: create workspace | ✅ Done | POST /api/workspaces → 200 |
| Smoke test: discovery | ✅ Done | Returns 3 objectives, 4 KPIs, 5 risks |
| Set ANTHROPIC_API_KEY | ⬜ Optional | Mock data works without it; add key for live AI |

**Production URLs:**
- Frontend: https://frontend-one-chi-43.vercel.app
- Backend API: https://backend-sigma-six-19.vercel.app/api
- Health check: https://backend-sigma-six-19.vercel.app/api/health

**Note:** Backend uses `/tmp/data.db` (ephemeral SQLite on Vercel serverless). Data resets on cold starts. Fine for portfolio demo — AI generates mock data on every request.

## Milestone 6: Polish & Portfolio ⬜
**Status:** Not Started

| Task | Status | Notes |
|---|---|---|
| Error handling UX (toast notifications) | ⬜ Pending | |
| Loading states audit | ⬜ Pending | |
| Mobile responsive check | ⬜ Pending | |
| Demo walkthrough recording | ⬜ Pending | |
| Portfolio write-up | ⬜ Pending | |

---

## Git History
1. `Initial MVP commit` — full app with all pages, components, backend, AI service
2. `Add Render deployment configuration` — render.yaml + requirements.txt updates
3. `Add progress tracker after E2E testing verification` — progress.md
4. `Move render.yaml to repo root with rootDir for Render Blueprint` — deployment prep
5. `Deploy full stack to Vercel (frontend + backend)` — api/index.py, vercel.json, live URLs

## Architecture Notes
- **No API key?** AI service returns mock/structured data so app works without Claude API
- **Traceability transform:** `transformTraceability()` in api.ts converts backend's hierarchical response to frontend's flat 4-column TraceNode format
- **Risk derivation:** `deriveRiskLevel()` in impact page derives HIGH/MEDIUM/LOW from risk_assessment text since backend doesn't send explicit risk_level
