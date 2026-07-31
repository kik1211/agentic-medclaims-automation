# PROJECT MASTERY GUIDE
# ClaimPilot India — AI-Assisted Hospital Insurance Claims Automation Platform

> This document is designed to make a new engineer independently capable of maintaining, extending, and explaining every part of this project. Read it once before touching the code.

---

## Part 1: What This Project Is

### The Business Problem

Indian hospitals process thousands of insurance claims per month. The process is:
1. Manual — billing staff fills forms by hand or copy-paste from patient records
2. Error-prone — wrong ICD-10 codes, missing documents, mismatched fields cause rejections
3. Slow — manual submission to insurer portals takes hours; responses take days
4. Financially critical — rejected claims mean the hospital doesn't get paid

The average Indian hospital loses 5–15% of revenue to claim rejections and delays. A hospital processing ₹10 crore/month in claims can lose ₹50 lakh to ₹1.5 crore per month to rejections.

### The Solution Vision

ClaimPilot India automates this workflow:
1. Doctor-patient conversation → AI transcribes it (Whisper)
2. Patient documents uploaded as PDFs → AI extracts text (OCR)
3. AI reads the clinical text → generates a structured claim (Gemini)
4. AI suggests ICD-10 codes → validates them for consistency
5. AI validates against insurer rules → flags missing data
6. Human reviews and approves (Human-in-the-Loop)
7. System submits to insurer (API or Playwright portal automation)
8. Dashboard tracks all claims and their statuses

### The Current Reality

The repository contains a **visual wireframe** — 16 screens showing exactly what this system would look like if it were built. None of the AI, OCR, backend, or submission features are implemented. The wireframe is built in React + TypeScript using Vite and Tailwind CSS.

This is the starting point. Your job is to build the real system incrementally on top of this foundation.

---

## Part 2: Domain Knowledge You Need

Before touching the code, understand these concepts. They will come up in every interview and every design discussion.

### Insurance Claim Stages

Every cashless hospital insurance claim in India goes through exactly these stages:

**1. Pre-Authorization (Pre-Auth)**
- Happens BEFORE the procedure
- Hospital submits: patient ID, diagnosis, proposed procedure, estimated cost
- Insurer responds: approved / rejected / approved with different amount
- Without pre-auth approval, the hospital takes financial risk
- Relevant screens: Screen3, Screen3A, Screen12, Screen13

**2. Discharge Authorization**
- Happens AFTER the procedure, BEFORE patient leaves hospital
- Hospital submits: operation notes, anaesthesia report, post-op summary, final bill draft
- Insurer responds: approved to discharge / needs more information
- Relevant screen: Screen4

**3. Final Claim**
- Happens AFTER patient is discharged
- Hospital submits: full discharge summary, all lab reports, actual final bill
- Insurer responds: approved / partially approved / rejected
- Relevant screens: Screen5, Screen13

### Insurer Types

**Private Insurers** (Star Health, HDFC Ergo, ICICI Lombard, Care Health):
- Have their own portals for claim submission
- Some have REST APIs, most require portal automation
- Processing time: 3–10 days for pre-auth, 7–21 days for final settlement

**TPAs (Third-Party Administrators)** (Medi Assist, Health India TPA):
- Intermediaries — handle claims on behalf of multiple insurers
- One TPA integration can cover many insurers
- Have their own portals

**Government Schemes** (CMCHIS, PM-JAY/Ayushman Bharat):
- Claim submission to government portals
- Stricter documentation requirements
- No REST APIs — portal-only submission

### Medical Coding Systems

**ICD-10** (International Classification of Diseases, 10th Revision):
- Used for DIAGNOSES
- Alphanumeric codes, e.g.: `K35.80` = Acute appendicitis, `O82` = C-section delivery
- Required on every insurance claim
- Must match the clinical documentation

**CPT** (Current Procedural Terminology):
- Used for PROCEDURES (US-standard)
- India more commonly uses ICD-10-PCS for procedures
- Mentioned in the project vision but CPT is less relevant in Indian context

**Code Conflicts**: A common rejection reason is when the diagnosis code and procedure code are inconsistent. Example: Diagnosis O80 (Normal Delivery) paired with a C-section procedure is a conflict. The AI must detect and flag these.

### Why Claim Rejections Happen (Domain-Critical)

Understanding rejection reasons is core to the denial recovery feature:

1. **Missing Clinical Notes** (35% of rejections) — a required document is absent or incomplete
2. **Procedure Not Covered** (25%) — the insurer's policy doesn't cover the specific procedure
3. **Incorrect Diagnosis Code** (20%) — ICD-10 code doesn't match the clinical documentation
4. **Late Submission** (15%) — submitted after the insurer's deadline
5. **Other** (5%) — insurer-specific requirements not met

The AI system's value proposition is preventing category 1 and 3 rejections automatically.

---

## Part 3: Repository Structure (Every File Explained)

### Root Level

#### `package.json`
The npm manifest. Two things to know:
1. `vite` appears in BOTH `dependencies` AND `devDependencies` — this is a bug, fix it in M1.1
2. `better-sqlite3`, `express`, `motion`, `@google/genai` are installed but unused

#### `vite.config.ts`
Configures the development server and build process. Key line:
```typescript
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
```
**THIS IS A SECURITY PROBLEM.** This embeds the API key in client-side JavaScript. Remove this when implementing Gemini API calls server-side (M5.1).

#### `tsconfig.json`
TypeScript configuration. Key setting: `"noEmit": true` means TypeScript only type-checks, never compiles. Vite's esbuild handles the actual compilation.

#### `metadata.json`
Google AI Studio project file. Not used by your code — you can update the name/description if you want but don't delete it if deploying to AI Studio.

---

### `src/` — Source Code

#### `src/main.tsx` — Application Entry Point
11 lines. Creates a React root and mounts `<App>`. Wraps in `<StrictMode>` which causes double-rendering in development (intentional React behavior).

**Interview question**: "Why does React Strict Mode render components twice?"  
**Answer**: To detect side effects. Components should be pure. If they produce different results on two renders, something is wrong. In development, React deliberately double-invokes render functions and lifecycle hooks to surface these bugs.

#### `src/index.css` — Global CSS
2 lines: `@import "tailwindcss"`. This is Tailwind v4 syntax — different from v2/v3. There's no `tailwind.config.js` because v4 is configured via the Vite plugin and CSS `@theme` directives.

#### `src/App.tsx` — Root Component (Most Complex File)

This file does three things:

**1. Defines `connections[]`**
```typescript
const connections = [
  { from: 'btn-login', to: 'screen-2' },
  ...33 more
];
```
Every button ID and screen ID that appear in this array. The `from` must be an HTML element ID of a button, the `to` must be an HTML element ID of a `ScreenContainer`. If you add a new button and want an arrow from it to a screen, add it here.

**2. Defines `ArrowsOverlay`**
An inline React component that:
- Takes `connections[]`
- After mount, finds each button and screen with `document.getElementById()`
- Reads their position with `getBoundingClientRect()`
- Calculates SVG path coordinates (accounting for scroll)
- Renders SVG `<path>` elements as dashed Bezier curves with arrowheads

**Why the 1-second timeout?**
```typescript
const timeout = setTimeout(updateLines, 1000);
```
React finishes the DOM updates synchronously, but sometimes layout calculations (especially for large canvas) haven't settled by the time the first `useEffect` runs. The second call after 1 second catches any elements that weren't measured correctly on first render. This is a hack. For production, use a `ResizeObserver` or `MutationObserver` instead.

**3. Renders all 16 screens on the canvas**
```jsx
<div className="relative" style={{ width: 8000, height: 6000 }}>
  <ArrowsOverlay connections={connections} />
  <div className="absolute top-[100px] left-[100px]"><Screen1 /></div>
  <div className="absolute top-[100px] left-[1300px]"><Screen2 /></div>
  ...
</div>
```
The outer `div#canvas-container` has `overflow-auto` — it's a scrollable viewport. The inner `div` is the large canvas. All screens are positioned absolutely within it.

**Common bug**: If you add a new screen component to a screen file but forget to import it in App.tsx and position it on the canvas, it won't appear. Check imports first.

---

### `src/components/WireframeUI.tsx` — UI Primitives

The most important file for understanding the visual design system. 7 exports.

**`WireButton`** — All buttons in the app use this.
- Primary variant: `bg-gray-800 text-white` (dark, dominant)
- Secondary variant: `bg-white text-gray-800` (light, secondary action)
- Outline variant: `bg-transparent border-dashed` (least important)
- The `id` prop is how ArrowsOverlay finds buttons to draw arrows from

**`WireInput`** — All form inputs use this.
- `defaultValue` sets the initial text but the input is uncontrolled (no React state tracks it)
- `icon` prop renders a Lucide icon on the left side
- Currently all inputs are decorative — nothing captures the typed value

**`WireCard`** — A bordered content container.
- If `title` is provided, renders a header with a bottom border
- `className` allows flex layout control (`h-full`, `flex-1`, etc.)

**`WireBadge`** — A small status indicator.
- `default` variant: just a border, no fill — for normal/in-progress states
- `high` variant: gray background fill — for problem states (Missing, Rejected, Escalated)
- **Warning**: Both variants use the same dark color scheme. There's no green/red differentiation. This is intentional for the wireframe aesthetic but will need color in production.

**`WireSidebar`** — Left navigation rail.
- Hardcoded 8 menu items
- `activeId` prop highlights the current section
- Each item has an HTML `id` that ArrowsOverlay can draw arrows from (nav-pre-auth, etc.)

**`WireHeader`** — Top bar.
- Hardcoded hospital name "Sri Ramakrishna Hospital, Coimbatore"
- "Agent Active" indicator — always pulsing, purely decorative
- `btn-notifications` button ID connects to Screen10 via ArrowsOverlay

**`ScreenContainer`** — Wrapper for each screen.
- Fixed `1024×768px` — matches the canvas grid
- The `id` prop is what ArrowsOverlay targets for arrow endpoints
- The `title` is displayed in the top-left corner badge (e.g., "SCREEN 2 - MAIN DASHBOARD")

---

### `src/screens/` — Screen Components

Each file exports one or more screen components. They're all stateless functional components using only the WireframeUI primitives and Lucide icons.

#### `AuthScreens.tsx` — Screen1 (Login)
Simple split layout:
- Left panel: branding (logo icon + name + tagline)
- Right panel: form (hospital ID, email, password)
- The `Activity` Lucide icon is used as the logo placeholder

#### `DashboardScreens.tsx` — Screens 2, 8, 9, 16

**Screen2 (Main Dashboard)**: The most information-dense screen.
- 4 KPI cards: hardcoded numbers (1,284, 94.2%, ₹4.2Cr, 14m)
- Claims requiring attention: 3 rows (Ramesh K., Anita S., Mohammed A.) — note these reference patients not in the pre-auth queue
- Quick Actions: 3 buttons (Upload Pre-Auth, Upload Claim, View Pipeline) — these have no IDs and can't be targeted by arrows
- Agent Activity Feed: 5 items, hardcoded timestamps from "this morning"

**Screen8 (Reports)**: 6 report cards + scheduled reports table. All buttons are non-functional. Report names are realistic (Monthly Claims Summary, Insurer Performance, Denial Analysis, etc.).

**Screen9 (Settings)**: 5 sections.
- Hospital profile: pre-filled with Sri Ramakrishna Hospital data
- Insurer Connections: Star Health (API), HDFC Ergo (RPA) — this is the only place where the API vs. RPA distinction is visible
- Notification preferences: toggle-style switches (purely visual, not actual toggles)
- User management: Dr. Sharma as admin
- Data compliance: IRDAI + DPDPA compliance badge

**Screen16 (Add Insurer)**: Form for connecting a new insurer.
- Dropdown for insurer selection (not a real select — just styled div)
- Connection type field (auto-filled — not functional)
- API credentials fields

#### `ClaimScreens.tsx` — Screens 3, 3A, 4, 5, 12, 13

**Screen3 (Pre-Auth)**: Upload zone + queue table.
- Queue has 6 patient rows with different statuses: Extracting, Validating, Missing Data, Submitted, Approved, Rejected
- `btn-row-missing` → Screen12; `btn-row-approved` → Screen13; `btn-row-rejected` → Screen14

**Screen3A (Processing State)**: Agent processing overlay.
- Dark background suggests a modal/overlay feel
- 3 patient cards side-by-side (hardcoded as "Patient 1/2/3 placeholder")
- Each card shows 6 steps: OCR Extraction (✓), Spell Check (✓), Field Validation (✓), Insurer Identified (spinning), Submitting (pending), Waiting (pending)
- Bottom: "View Full Pipeline" button → Screen6

**Screen4 (Discharge Auth)**: Similar structure to Screen3 but with different document checklist (Operation Notes, Anaesthesia Report, Post-Op Summary, etc.) and only 2 patients in queue with urgency badges.

**Screen5 (Final Claims)**: Simplified upload zone + minimal queue (1 patient: Karthik R.).

**Screen12 (Missing Data)**: Human-in-the-loop data entry.
- 3 specific missing fields (Policy Number, Previous Treatment Records, Estimated Procedure Cost)
- Each field has inline text input OR document upload option
- First and third fields: text input + outline upload button (editable)
- Second field: text input is disabled, only document upload available
- Bottom: "Cancel and Remove" (red text) vs "Submit Missing Information and Continue" (btn-12-submit → Screen3A)

**Screen13 (Approval Confirmation)**: Success state.
- Large checkmark in circle
- "CLAIM APPROVED" in large bold text
- Amount Requested vs Amount Approved side-by-side (both ₹1,20,000 — full approval)
- Reference number and expected payment date

#### `PipelineScreens.tsx` — Screens 6, 10, 11

**Screen6 (Pipeline)**: The most data-rich table view.
- 9 patient rows with all claim details
- Row highlighting: rejected/escalated rows get `bg-gray-100`
- First "View" button has id `btn-6-view` → Screen11
- 5th "Review" button has id `btn-6-review` → Screen14
- Pagination: "Showing 1-9 of 1,284 claims" (1,284 is the same number on the dashboard — intentional consistency)
- Filter dropdowns: All Schemes, All Statuses, All Stages, Last 30 Days (non-functional divs, not real selects)

**Screen10 (Notifications)**: Slide-in panel.
- Absolute positioning, right-anchored, `z-50`
- Blurred background: low-opacity gray divs representing the page underneath
- 5 notifications: warning (Anita S.), success (John D.), info (Rajesh K.), warning (Suresh V.), success (Priya M.)
- "View" buttons: first one has id `btn-10-view` → Screen11

**Screen11 (Claim Detail)**: Most complex single screen.
- Breadcrumb: Ref CLM-2023-889900 (hardcoded)
- Patient Info card: Rajesh Kumar, 45M, Star Health, Appendectomy
- Stage Progress Tracker: 7 steps (Upload ✓, OCR Extraction spinning, Validation/Submission/Insurer/Response/Complete pending)
- The spinning step uses `animate-spin` on a dashed border — the border spins, not an icon
- Timeline feed: 3 events (Claim Created, Documents Uploaded, OCR Started)
- Documents panel: 5 PDF files listed with file sizes

#### `DenialScreens.tsx` — Screens 7, 14, 15

**Screen7 (Denial Recovery)**: Management overview.
- 3 KPI cards: 142 denials, 89 recovered (62%), ₹1.8Cr
- Bar chart (inline CSS width `style={{ width: '35%' }}` etc.) — not a chart library, pure CSS
- Active denial cases: 2 rows
  - Anita S.: Missing Clinical Notes → AI suggests "Resubmit with Notes" → `btn-7-view-ai` → Screen15
  - Kavitha R.: Procedure Not Covered (Attempt 2) → "Manual Escalation" → `btn-7-escalate` → Screen14

**Screen14 (Manual Review)**: For escalated claims.
- Left panel: Claim Summary — patient details + rejection history (2 attempts)
- Right panel: AI Analysis — what AI tried, why it failed, suggested next steps
- "Why It Still Failed" text is technically sophisticated: "The insurer requires Form 4B - Emergency Cardiac Justification which AI cannot generate automatically" — this is honest and realistic
- 4 action buttons: Handle Manually (btn-14-manual → Screen15), Contact Insurer, Raise Grievance, Back to Pipeline

**Screen15 (AI Error Analysis)**: Detailed error report.
- Section 1: 2 specific errors found (Missing Document — blank pages 2-3; Code Mismatch — O80 vs C-Section)
- Section 2: Cross-reference table comparing submission vs accepted standard (red/green color coding — the only color in the entire app!)
- Section 3: Proposed corrections list + action buttons
  - `btn-15-resubmit` → Screen3A (restart the pipeline with corrections)

---

## Part 4: The Navigation Graph

This is the complete set of connections defined in `App.tsx`. Study this before implementing routing.

```
Login (Screen1) ──[btn-login]──► Dashboard (Screen2)

Dashboard (Screen2) ──[nav-pre-auth]──► Pre-Auth (Screen3)
Dashboard (Screen2) ──[nav-discharge]──► Discharge (Screen4)
Dashboard (Screen2) ──[nav-final-claims]──► Final Claims (Screen5)
Dashboard (Screen2) ──[nav-pipeline]──► Pipeline (Screen6)
Dashboard (Screen2) ──[nav-denial]──► Denial (Screen7)
Dashboard (Screen2) ──[nav-reports]──► Reports (Screen8)
Dashboard (Screen2) ──[nav-settings]──► Settings (Screen9)
Dashboard (Screen2) ──[btn-notifications]──► Notifications (Screen10)

Pre-Auth (Screen3) ──[btn-upload-start]──► Processing (Screen3A)
Pre-Auth (Screen3) ──[btn-row-missing]──► Missing Data (Screen12)
Pre-Auth (Screen3) ──[btn-row-approved]──► Approval (Screen13)
Pre-Auth (Screen3) ──[btn-row-rejected]──► Manual Review (Screen14)

Processing (Screen3A) ──[btn-3a-pipeline]──► Pipeline (Screen6)

Missing Data (Screen12) ──[btn-12-submit]──► Processing (Screen3A)

Pipeline (Screen6) ──[btn-6-view]──► Claim Detail (Screen11)
Pipeline (Screen6) ──[btn-6-review]──► Manual Review (Screen14)

Notifications (Screen10) ──[btn-10-view]──► Claim Detail (Screen11)

Claim Detail (Screen11) ──[btn-11-escalate]──► Manual Review (Screen14)

Denial (Screen7) ──[btn-7-view-ai]──► AI Error Analysis (Screen15)
Denial (Screen7) ──[btn-7-escalate]──► Manual Review (Screen14)

Manual Review (Screen14) ──[btn-14-manual]──► AI Error Analysis (Screen15)

AI Error Analysis (Screen15) ──[btn-15-resubmit]──► Processing (Screen3A)

Settings (Screen9) ──[btn-9-add-insurer]──► Add Insurer (Screen16)
```

---

## Part 5: Common Development Tasks

### Adding a New Screen

1. Choose the correct screen file based on domain:
   - Auth → `AuthScreens.tsx`
   - Dashboard/Settings → `DashboardScreens.tsx`
   - Claims → `ClaimScreens.tsx`
   - Pipeline → `PipelineScreens.tsx`
   - Denial → `DenialScreens.tsx`

2. Export a new component:
```typescript
export const Screen17 = () => (
  <ScreenContainer id="screen-17" title="SCREEN 17 - NEW SCREEN">
    <WireSidebar activeId="nav-pipeline" />
    {/* content */}
  </ScreenContainer>
);
```

3. Import in `App.tsx`:
```typescript
import { Screen17 } from './screens/YourScreenFile';
```

4. Position on canvas in `App.tsx`:
```jsx
<div className="absolute top-[5200px] left-[4900px]"><Screen17 /></div>
```

5. Add navigation connections:
```typescript
const connections = [
  ...existing connections,
  { from: 'btn-trigger-17', to: 'screen-17' },
];
```

### Adding a Navigation Button with Arrow

1. Add an `id` prop to a `WireButton`:
```tsx
<WireButton id="btn-trigger-17">Go to Screen 17</WireButton>
```

2. Add to `connections[]` in `App.tsx`:
```typescript
{ from: 'btn-trigger-17', to: 'screen-17' }
```

The arrow will appear after the next render + 1 second (due to the setTimeout in `ArrowsOverlay`).

### Adding a Sidebar Navigation Item

Edit `WireSidebar` in `WireframeUI.tsx`:
```typescript
const items = [
  ...existing items,
  { id: 'nav-new-section', label: 'New Section', screen: 'Screen 17' },
];
```

Then add the corresponding connection in `App.tsx`.

### Making a Form Functional (When Backend Exists)

1. Convert `defaultValue` to controlled `value` + `onChange`:
```tsx
// Before:
<WireInput placeholder="Email" defaultValue="admin@hospital.com" />

// After:
const [email, setEmail] = useState('admin@hospital.com');
<WireInput placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
```

2. Add `onClick` to `WireButton`:
```tsx
<WireButton onClick={handleSubmit}>Submit</WireButton>
```

Note: `WireButton` currently doesn't accept `onClick` — add it to the `WireButtonProps` interface first.

---

## Part 6: Configuration Reference

### Environment Variables

| Variable | Required | Purpose | Security Note |
|----------|----------|---------|---------------|
| `GEMINI_API_KEY` | Yes (future) | Gemini API auth | Never expose client-side |
| `APP_URL` | No | Self-referential links | Only for OAuth/callbacks |

### npm Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Starts Vite dev server on port 3000 |
| `npm run build` | Creates production bundle in `dist/` |
| `npm run preview` | Serves `dist/` locally |
| `npm run lint` | TypeScript type check only (no ESLint yet) |
| `npm run clean` | Deletes `dist/` (FAILS ON WINDOWS — see below) |

**Windows fix for clean**: Use `Remove-Item -Recurse -Force dist` or add rimraf.

---

## Part 7: Common Bugs and Solutions

### Bug: Arrows Don't Appear
**Symptom**: SVG canvas is empty, no arrows drawn  
**Cause 1**: Button or screen has wrong/missing `id`  
**Cause 2**: `connections[]` entry uses ID that doesn't exist in DOM  
**Fix**: Open browser DevTools → Console → check for errors. Check that `document.getElementById('btn-login')` returns an element.

### Bug: Screen Overlaps Another
**Symptom**: Two screens rendered on top of each other  
**Cause**: Two screens assigned to the same absolute position in `App.tsx`  
**Fix**: Check all `top-[Npx] left-[Mpx]` values in `App.tsx` for duplicates

### Bug: TypeScript Error on `any` Props
**Symptom**: TypeScript complains about missing property  
**Cause**: A prop was added to a component that has `}: any` typing  
**Fix**: This is expected — TypeScript ignores `any` typed props. The fix is to properly type the component.

### Bug: `better-sqlite3` Cannot be Loaded
**Symptom**: `Error: Cannot find module 'better-sqlite3'` or native build error  
**Cause**: Native addon requires compilation during `npm install`  
**Fix on Windows**: Install Visual C++ Build Tools via `npm install -g windows-build-tools` or Visual Studio Installer

### Bug: HMR Not Working
**Symptom**: Code changes don't reflect in browser automatically  
**Cause**: `DISABLE_HMR=true` is set (AI Studio behavior)  
**Fix**: Ensure `DISABLE_HMR` is not set in your `.env.local`. Restart dev server.

---

## Part 8: Interview Questions and Answers

### Q: What does this project do?
**A**: ClaimPilot India automates the insurance claims workflow for hospitals. It takes patient documents, runs OCR to extract text, uses an LLM (Gemini) to structure the clinical data into a standardized claim format, suggests ICD-10 medical codes, validates against insurer rules, routes through a human approval step, and submits to the insurer. The current state is a complete interactive wireframe — 16 screens representing every workflow state — built to validate the business concept.

### Q: What technology choices would you make if starting from scratch?
**A**: For the frontend, React + TypeScript + Vite is the right choice. I'd add React Router v6 for navigation from day one. For the backend, Express.js is appropriate for a Node.js MVP — Python FastAPI would be an alternative if the ML components were heavier. For OCR, I'd evaluate Google Document AI vs Tesseract.js based on document quality. For the LLM, Gemini makes sense since it's installed; I'd use the structured output feature (JSON response mode) for reliable extraction. For the database, SQLite for development, PostgreSQL for production. For workflow orchestration, n8n is reasonable but I'd evaluate whether the backend itself can handle orchestration for an MVP.

### Q: What's the hardest technical challenge in this project?
**A**: The OCR quality problem. Indian hospital documents are often scanned at low DPI, contain mixed scripts (English + Tamil/Telugu), and handwritten sections. Standard Tesseract accuracy will be 60–80% on these documents, not the 94% implied in the wireframe. Solving this requires either a commercial OCR API (Google Document AI, AWS Textract) or significant document preprocessing (denoising, deskewing, upscaling). The accuracy expectation versus reality gap is the most significant technical risk.

### Q: How does the ArrowsOverlay work?
**A**: It's a React component that reads the DOM position of button and screen elements after render, calculates cubic Bezier curve coordinates (accounting for scroll position), and renders SVG path elements. It re-calculates on window resize and once after a 1-second delay to handle layout settling. The arrowhead is an SVG marker element. It's purely visual — the arrows communicate navigation intent but don't implement it.

### Q: Why is `GEMINI_API_KEY` in `vite.config.ts`? Is that safe?
**A**: No, it's not safe for production. Vite's `define` performs string replacement at build time, embedding the key literally in the client JavaScript bundle. Anyone can view the key in browser DevTools. This was scaffolded by AI Studio, which manages the key server-side. For production, all Gemini API calls must be proxied through a backend endpoint, and the key must never touch the client bundle.

### Q: What would you test first?
**A**: The OCR-to-structuring pipeline, because it's the core value proposition and the most likely to have accuracy issues. Specifically: take 20 real Indian hospital discharge summaries, run them through Tesseract, pass the output to Gemini with the structuring prompt, and measure how many of the 8 required fields are correctly extracted. This test determines whether the fundamental approach is viable before writing any other backend code.

### Q: How would you handle a situation where the insurer rejects a claim and the AI can't figure out why?
**A**: That's exactly what Screen14 (Manual Review / Escalation) handles. The AI logs its attempts, explains what it tried and why it failed, and escalates to a human with specific next steps. For example, if the insurer requires a specific form (like "Form 4B - Emergency Cardiac Justification") that the AI can't generate, it documents this and routes to a human. The key design principle is: the AI should never silently fail. It should always surface its failures transparently to enable human recovery.

---

## Part 9: Improvement Opportunities

In order of impact:

1. **Proper TypeScript interfaces** for all WireframeUI components (1 hour, high impact on code quality)
2. **React Router integration** (3 hours, makes the app interactive)
3. **Express backend with health endpoint** (2 hours, foundation for everything)
4. **SQLite schema + migrations** (2 hours, enables data persistence)
5. **Real file upload** (3 hours, first user-visible backend feature)
6. **Gemini API integration server-side** (4 hours, core AI feature)
7. **OCR pipeline** (6 hours, technically complex, high risk)
8. **Dashboard from real data** (3 hours, impressive visual impact)
9. **Playwright submission automation** (8+ hours, complex, high maintenance burden)
10. **Whisper transcription** (5 hours, differentiating feature)

---

## Part 10: References

### Indian Healthcare Insurance
- IRDAI guidelines: https://www.irdai.gov.in/
- PMJAY (Ayushman Bharat) portal: https://pmjay.gov.in/
- CMCHIS scheme information: https://www.mhfw.gov.in/

### ICD-10 Coding
- WHO ICD-10 browser: https://icd.who.int/browse10/2019/en
- Free ICD-10 data download: https://www.cms.gov/Medicare/Coding/ICD10

### Technology Documentation
- Gemini API (`@google/genai`): https://ai.google.dev/gemini-api/docs
- Tesseract.js: https://github.com/naptha/tesseract.js
- React Router v6: https://reactrouter.com/
- Tailwind CSS v4: https://tailwindcss.com/docs
- Vite: https://vitejs.dev/
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Playwright: https://playwright.dev/
- n8n: https://docs.n8n.io/

### This Repository's Own Docs
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — What the project is
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture
- [DIRECTORY_GUIDE.md](./DIRECTORY_GUIDE.md) — Every file explained
- [EXECUTION_FLOW.md](./EXECUTION_FLOW.md) — What happens when you run it
- [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md) — React component specs
- [DATA_FLOW.md](./DATA_FLOW.md) — How data moves (or doesn't)
- [API_REFERENCE.md](./API_REFERENCE.md) — API endpoints (current and planned)
- [DEPENDENCY_GUIDE.md](./DEPENDENCY_GUIDE.md) — Every npm package explained
- [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) — How to configure and run
- [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) — Why things are built this way
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) — Honest technical assessment
- [TECH_DEBT.md](./TECH_DEBT.md) — Prioritized debt register
- [IMPLEMENTATION_GAPS.md](./IMPLEMENTATION_GAPS.md) — Gap analysis vs. vision
- [PROJECT_GLOSSARY.md](./PROJECT_GLOSSARY.md) — Domain and technical terms
- [PRD.md](./PRD.md) — Product requirements
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) — Milestone-based roadmap
