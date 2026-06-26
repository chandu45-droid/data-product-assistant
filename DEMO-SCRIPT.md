# Demo Walkthrough Script

**App:** Data Product Discovery & Delivery Assistant
**URL:** https://frontend-one-chi-43.vercel.app
**Duration:** 3-4 minutes
**Audience:** Thoughtworks hiring panel (Senior Data BA role)

---

## Setup Before Recording

- Open Chrome, clear any existing workspaces (or start fresh — data resets on cold start)
- Set browser width to ~1280px for desktop view
- Have a second tab ready for mobile view (375px or DevTools responsive mode)

---

## Scene 1: The Problem (15 sec)

**Narration:** "In every data engagement, BAs face the same challenge: turning vague stakeholder conversations into structured, traceable requirements. This tool automates that pipeline."

**Action:** Show the landing page. Pause briefly on the empty state.

---

## Scene 2: Create Workspace (15 sec)

**Action:** Click "New Workspace" → Enter name: "Customer 360 Platform" → Click Create
**Narration:** "Each project lives in an isolated workspace."

---

## Scene 3: Discovery (45 sec)

**Action:** Navigate to Discovery page → Paste this input:

> "We need a unified view of our customers across all channels. Marketing wants attribution data, support needs ticket history linked to purchases, and the product team wants behavioral analytics. We're worried about data quality in the CRM — lots of duplicates. Compliance needs GDPR audit trails on all PII fields."

**Action:** Click "Analyze" → Wait for AI extraction

**Narration:** "The AI extracts structured elements from free-text input — business objectives, stakeholders, KPIs, assumptions, and risks. Everything is editable. The BA stays in control."

**Action:** Briefly click into an objective to show it's editable.

---

## Scene 4: Data Requirements (30 sec)

**Action:** Navigate to Requirements → Click "Generate from Discoveries"

**Narration:** "Requirements are generated with full traceability back to business objectives. Each requirement identifies the business entity, data points needed, source systems, dependencies, and gaps."

**Action:** Show the filter bar (filter by priority). Click edit on one requirement to show inline editing.

---

## Scene 5: Delivery Planning (30 sec)

**Action:** Navigate to Delivery → Click "Generate Delivery Plan"

**Narration:** "The tool generates an Agile delivery plan — epics, features, and user stories with acceptance criteria — all traceable back to the data requirements they fulfill."

**Action:** Expand one epic to show the feature/story hierarchy.

---

## Scene 6: Impact Analysis (30 sec)

**Action:** Navigate to Impact → Enter change description:

> "The CRM vendor is migrating to a new API. All customer endpoints will change, and historical data older than 3 years will be archived."

**Action:** Click "Analyze Impact" → Show results

**Narration:** "When scope changes happen — and they always do — the impact analysis shows exactly which KPIs, requirements, and delivery stories are affected, with a risk assessment."

---

## Scene 7: Traceability (30 sec)

**Action:** Navigate to Traceability → Show the full chain visualization

**Narration:** "The traceability view is the centerpiece. Every deliverable traces back through requirements and discoveries to the original business problem. Nothing falls through the cracks."

---

## Scene 8: Mobile & Polish (15 sec)

**Action:** Toggle browser to mobile width (or show DevTools responsive mode)

**Narration:** "The entire app is responsive — hamburger navigation, stacking layouts, touch-friendly controls."

**Action:** Show the hamburger menu opening, one page in mobile view.

---

## Scene 9: Close (15 sec)

**Narration:** "Built with Next.js, FastAPI, and Claude API. Deployed on Vercel. The entire pipeline — from vague conversation to traceable delivery plan — in under 5 minutes. That's what AI-augmented business analysis looks like."

**Action:** Return to dashboard, pause on the summary cards.

---

## Recording Tips

- Use OBS Studio or Loom for recording
- Record at 1080p minimum
- Keep mouse movements deliberate — no frantic clicking
- If AI takes a moment to respond, narrate what's happening ("The AI is now extracting...")
- Toast notifications will appear bottom-right — let them be visible for 2-3 seconds before moving on
