# Implementation Roadmap

> Incremental milestones for transforming the wireframe prototype into a production-quality MVP.
> Each milestone is designed to be a single, coherent Git commit.

---

## Guiding Principles

1. **Never break what works** — the wireframe canvas must remain functional throughout
2. **Incremental improvement** — each milestone produces a working, demonstrable state
3. **Documentation first** — update docs with every implementation change
4. **No fabrication** — only implement what is technically achievable

---

## Phase 1: Foundation Cleanup

### M1.1 — Fix package.json Hygiene
**Purpose**: Remove bloat and fix incorrect configurations before writing new code.

**Engineering rationale**: Building on incorrect dependency config creates technical debt that multiplies.

**Affected files**:
- `package.json` — remove duplicate `vite` from `dependencies`; move `vite` to `devDependencies` only
- `package.json` — add `rimraf` for cross-platform `clean` script
- `package.json` — update `clean` script from `rm -rf dist` to `rimraf dist`

**Testing**: `npm install` succeeds; `npm run lint` passes; `npm run build` produces `dist/`

**Expected commit message**: `fix(deps): remove duplicate vite, add rimraf for cross-platform clean`

---

### M1.2 — Add ESLint and Prettier
**Purpose**: Enforce consistent code style and catch common errors.

**Engineering rationale**: Without linting, code quality degrades as new contributors join.

**Affected files** (new):
- `.eslintrc.cjs` or `eslint.config.js`
- `.prettierrc`
- `.prettierignore`

**Dependencies to add** (`devDependencies`):
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier
```

**Update**:
- `package.json` — add `"lint:full": "eslint src --ext .ts,.tsx"` and `"format": "prettier --write src"`

**Testing**: `npm run lint:full` passes with no errors; `npm run format` reformats files consistently

**Expected commit message**: `chore(dev): add ESLint + Prettier configuration`

---

### M1.3 — TypeScript Strict Mode + Typed Props
**Purpose**: Replace all `any` props in WireframeUI with proper TypeScript interfaces.

**Engineering rationale**: Type safety prevents prop usage errors and improves IDE autocomplete.

**Affected files**:
- `src/components/WireframeUI.tsx` — define interfaces for all 7 components
- `tsconfig.json` — add `"strict": true`

**Expected commit message**: `refactor(types): add TypeScript interfaces for all WireframeUI components`

---

### M1.4 — Update README and Root Documentation
**Purpose**: Replace the generic AI Studio README with project-specific documentation.

**Engineering rationale**: The README is the first thing any developer or recruiter reads.

**Affected files**:
- `README.md` — complete rewrite with: project overview, demo GIF placeholder, architecture diagram, setup instructions, environment variables, scripts

**Expected commit message**: `docs: rewrite README with project overview, setup, and architecture`

---

## Phase 2: Navigation and Routing

### M2.1 — Install React Router and Define Routes
**Purpose**: Enable actual navigation between screens.

**Engineering rationale**: Without routing, the application cannot function as an interactive product.

**Dependencies**:
```bash
npm install react-router-dom
```

**Affected files**:
- `src/main.tsx` — wrap App in `RouterProvider`
- `src/App.tsx` — extract screen layout to router; keep canvas view as `/overview`
- New: `src/router.tsx` — route definitions

**Route structure**:
```
/              → redirect to /login
/login         → Screen1
/overview      → Canvas wireframe view (existing App.tsx canvas)
/dashboard     → Screen2
/claims/pre-auth → Screen3
/claims/discharge → Screen4
/claims/final  → Screen5
/claims/:id    → Screen11 (detail)
/pipeline      → Screen6
/denial        → Screen7
/reports       → Screen8
/settings      → Screen9
/settings/add-insurer → Screen16
```

**Testing**: Navigating directly to `/dashboard` renders Screen2; browser back button works

**Expected commit message**: `feat(routing): add React Router v6 with all screen routes`

---

### M2.2 — Wire Navigation into Buttons
**Purpose**: Make every navigation button functional.

**Engineering rationale**: Enables interactive demo flow.

**Affected files**:
- `src/screens/AuthScreens.tsx` — `btn-login` → navigate to `/dashboard`
- `src/screens/DashboardScreens.tsx` — sidebar and quick action buttons
- `src/screens/ClaimScreens.tsx` — upload, pipeline, missing data buttons
- `src/screens/PipelineScreens.tsx` — view, review, escalate buttons
- `src/screens/DenialScreens.tsx` — AI analysis, escalate, resubmit buttons
- `src/components/WireframeUI.tsx` — add `onClick?: () => void` to `WireButton`

**Testing**: Full walkthrough from login → dashboard → pre-auth → processing → pipeline → denial → manual review

**Expected commit message**: `feat(nav): wire all button clicks to React Router navigation`

---

### M2.3 — Preserve Wireframe Canvas as /overview
**Purpose**: The original canvas layout is a portfolio asset. Preserve it.

**Engineering rationale**: The canvas view demonstrates the full system architecture at a glance — useful for interviews.

**Affected files**:
- `src/pages/OverviewPage.tsx` — extract current `App.tsx` canvas content
- `src/App.tsx` — becomes router wrapper only
- Add "System Overview" link to sidebar

**Expected commit message**: `feat(canvas): preserve wireframe canvas at /overview route`

---

## Phase 3: Backend Foundation

### M3.1 — Create Express Server
**Purpose**: Establish the backend API server.

**Engineering rationale**: All data, AI calls, and file handling must happen server-side.

**Affected files** (new):
- `server/index.ts` — Express app, middleware stack, route registration
- `server/middleware/errorHandler.ts` — global error handler
- `server/middleware/requestLogger.ts` — request logging
- `.env.local` — add `PORT=3001`

**Testing**: `GET http://localhost:3001/health` returns `{ status: 'ok', timestamp: ... }`

**Expected commit message**: `feat(server): create Express server with health endpoint`

---

### M3.2 — Database Schema (SQLite)
**Purpose**: Create the data model for claims.

**Affected files** (new):
- `server/db/schema.sql` — table definitions
- `server/db/connection.ts` — `better-sqlite3` singleton connection
- `server/db/migrate.ts` — runs schema on startup

**Schema tables**:
```sql
hospitals, users, claims, documents, claim_fields, audit_log
```

**Testing**: Database file created on server start; all tables present

**Expected commit message**: `feat(db): add SQLite schema with claims, documents, and audit_log tables`

---

### M3.3 — Authentication Endpoints
**Purpose**: Implement JWT login/logout.

**Dependencies**:
```bash
npm install bcryptjs jsonwebtoken cookie-parser
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie-parser
```

**Affected files** (new):
- `server/routes/auth.ts` — POST /api/auth/login, POST /api/auth/logout
- `server/middleware/auth.ts` — JWT verification middleware

**Seed**: Create default hospital user in migration for development.

**Testing**: POST /api/auth/login with correct credentials returns JWT cookie; subsequent authenticated request succeeds

**Expected commit message**: `feat(auth): add JWT login/logout with bcrypt password hashing`

---

### M3.4 — Connect Frontend Login to API
**Purpose**: Make the login screen functional.

**Affected files**:
- `src/screens/AuthScreens.tsx` — add form state, POST to `/api/auth/login`, handle response
- `src/contexts/AuthContext.tsx` (new) — auth state, `useAuth` hook
- `src/components/ProtectedRoute.tsx` (new) — redirect unauthenticated users

**Testing**: Login with correct credentials navigates to dashboard; wrong credentials shows error message; refreshing dashboard while logged in stays logged in

**Expected commit message**: `feat(auth): connect login form to backend, add auth context and protected routes`

---

## Phase 4: File Upload and OCR

### M4.1 — File Upload Endpoint
**Purpose**: Accept PDF uploads server-side.

**Dependencies**:
```bash
npm install multer
npm install --save-dev @types/multer
```

**Affected files** (new):
- `server/routes/documents.ts` — POST /api/documents/upload
- `server/services/storageService.ts` — save file to `uploads/` directory
- `uploads/` directory (gitignored)

**Testing**: POST multipart/form-data with a PDF → file saved to disk → document record created in DB → claim ID returned

**Expected commit message**: `feat(upload): add file upload endpoint with multer and SQLite record creation`

---

### M4.2 — Make Upload UI Functional
**Purpose**: Wire the upload screens to the real API.

**Affected files**:
- `src/screens/ClaimScreens.tsx` — Screen3: add real file input, drag-drop handlers, POST to API
- `src/api/documents.ts` (new) — typed API client functions

**Testing**: Upload a PDF in the browser → file appears on server disk → claim record visible

**Expected commit message**: `feat(upload): wire upload UI to document API with progress feedback`

---

### M4.3 — OCR Processing (Tesseract.js)
**Purpose**: Extract text from uploaded PDFs.

**Dependencies**:
```bash
npm install tesseract.js pdf2pic
```

**Affected files** (new):
- `server/services/ocrService.ts` — convert PDF to images, run Tesseract, return text
- `server/jobs/processDocument.ts` — async job triggered after upload

**Testing**: Upload a simple PDF with typed text → OCR result stored in `documents.ocr_text` column

**Expected commit message**: `feat(ocr): add Tesseract.js OCR pipeline for uploaded PDF documents`

---

## Phase 5: AI Processing

### M5.1 — Gemini API Integration (Server-Side)
**Purpose**: Call Gemini for clinical structuring, keeping API key server-side.

**Affected files** (new):
- `server/services/aiService.ts` — `structureClinicalData(ocrText)`, `suggestIcdCodes(diagnosis)`
- `server/routes/ai.ts` — POST /api/ai/structure (internal, authenticated)

**Remove**:
- `vite.config.ts` — remove `process.env.GEMINI_API_KEY` define injection

**Testing**: POST OCR text → receive structured JSON with patient, diagnosis, procedure, policy number

**Expected commit message**: `feat(ai): add server-side Gemini API integration for clinical structuring`

---

### M5.2 — ICD-10 Code Suggestion and Validation
**Purpose**: Suggest and validate medical codes.

**Affected files** (new):
- `server/data/icd10.ts` — load ICD-10 code reference (public WHO dataset, small subset)
- `server/services/codingService.ts` — `suggestCode(diagnosisText)`, `validateCodePair(icdCode, procedureCode)`

**Testing**: "appendicitis" → suggests K35.x codes; conflict between O80 + C-section procedure is detected

**Expected commit message**: `feat(coding): add ICD-10 code suggestion and conflict validation`

---

### M5.3 — Connect Processing Pipeline to UI
**Purpose**: Make Screen3A show real processing steps.

**Affected files**:
- `src/screens/ClaimScreens.tsx` — Screen3A: poll `/api/claims/:id/status` every 2 seconds
- `server/routes/claims.ts` — GET /api/claims/:id/status returns stage and confidence

**Testing**: Upload document → Screen3A shows OCR → Structuring → Coding steps completing in sequence

**Expected commit message**: `feat(pipeline): connect processing state screen to real async pipeline status`

---

## Phase 6: Human-in-the-Loop

### M6.1 — Missing Data Detection and Completion
**Purpose**: Make Screen12 functional.

**Affected files**:
- `server/services/validationService.ts` — validate extracted fields, return missing fields list
- `server/routes/claims.ts` — GET /api/claims/:id/missing-fields, POST /api/claims/:id/complete
- `src/screens/ClaimScreens.tsx` — Screen12: load real missing fields, submit completion

**Expected commit message**: `feat(hitl): implement missing data detection and completion workflow`

---

### M6.2 — Human Approval Before Submission
**Purpose**: Gate claim progression on explicit human approval.

**Affected files** (new):
- `src/pages/ClaimReviewPage.tsx` — full claim data review with approve/reject
- `server/routes/claims.ts` — POST /api/claims/:id/approve

**Expected commit message**: `feat(hitl): add human approval gate with full claim review interface`

---

## Phase 7: Dashboard and Pipeline (Real Data)

### M7.1 — Dashboard KPIs from Database
**Purpose**: Replace hardcoded statistics with real computed values.

**Affected files**:
- `server/routes/dashboard.ts` — GET /api/dashboard/kpis with SQL aggregation
- `src/screens/DashboardScreens.tsx` — Screen2: fetch KPIs from API on mount

**Expected commit message**: `feat(dashboard): replace hardcoded KPIs with real database aggregations`

---

### M7.2 — Claims Pipeline with Real Data
**Purpose**: Screen6 shows real claims.

**Affected files**:
- `server/routes/claims.ts` — GET /api/claims with pagination, search, filtering
- `src/screens/PipelineScreens.tsx` — Screen6: fetch claims from API

**Expected commit message**: `feat(pipeline): load real claims into pipeline view with search and pagination`

---

## Phase 8: Quality and Polish

### M8.1 — Add Vitest Unit Tests
**Purpose**: Test backend services.

**Dependencies**:
```bash
npm install --save-dev vitest @vitest/ui
```

**Affected files** (new):
- `server/services/ocrService.test.ts`
- `server/services/codingService.test.ts`
- `server/services/validationService.test.ts`

**Expected commit message**: `test: add Vitest unit tests for OCR, coding, and validation services`

---

### M8.2 — Docker Configuration
**Purpose**: Enable reproducible local and cloud deployment.

**Affected files** (new):
- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml` — app + optional volume for uploads

**Expected commit message**: `feat(docker): add Dockerfile and docker-compose for local development`

---

### M8.3 — Denial Recovery with AI Analysis
**Purpose**: Make denial recovery AI analysis functional (Screen15).

**Affected files**:
- `server/services/denialService.ts` — analyze denial, suggest corrections using Gemini
- `src/screens/DenialScreens.tsx` — Screen15: load real AI analysis

**Expected commit message**: `feat(denial): implement AI-powered denial analysis and correction suggestions`

---

## Phase 9: Documentation and GitHub Publication

### M9.1 — Final Documentation Pass
**Purpose**: Ensure all docs are accurate and synchronized with implementation.

**Update**:
- All docs in `docs/` — update architecture diagrams, API reference
- `README.md` — add demo GIF, link to docs

**Expected commit message**: `docs: final documentation pass, synchronize with implementation`

---

### M9.2 — GitHub Repository Setup
**Purpose**: Prepare for public repository.

**Actions**:
- Create `.github/ISSUE_TEMPLATE/bug_report.md`
- Create `.github/ISSUE_TEMPLATE/feature_request.md`
- Create `CONTRIBUTING.md`
- Create `CHANGELOG.md`
- Tag `v0.1.0` — "Wireframe Prototype"
- Tag `v0.2.0` — "Interactive Navigation"
- Tag `v1.0.0` — "Functional MVP"

**Expected commit message**: `chore: add GitHub templates, CONTRIBUTING, CHANGELOG; tag v1.0.0`

---

## Milestone Summary

| Milestone | Phase | Priority | Effort | Unlocks |
|-----------|-------|----------|--------|---------|
| M1.1–M1.4 | Foundation | Now | 1 day | Clean codebase |
| M2.1–M2.3 | Navigation | Now | 1 day | Interactive demo |
| M3.1–M3.4 | Backend | Soon | 3 days | All backend features |
| M4.1–M4.3 | Upload + OCR | Soon | 2 days | Real document processing |
| M5.1–M5.3 | AI | Soon | 2 days | LLM structuring demo |
| M6.1–M6.2 | HITL | Later | 1 day | Complete workflow |
| M7.1–M7.2 | Real data | Later | 1 day | Real dashboard |
| M8.1–M8.3 | Quality | Later | 2 days | Production readiness |
| M9.1–M9.2 | Publish | Last | 0.5 days | GitHub publication |

**Total estimated effort**: ~14 days of focused engineering work
