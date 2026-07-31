# Directory Guide

> A complete map of every file in the repository with its purpose, contents, and role.

---

## Root Directory

```
Claim_bot_2-main/
```

| File / Dir        | Type   | Purpose                                                                 |
|-------------------|--------|-------------------------------------------------------------------------|
| `index.html`      | HTML   | Single-page app entry. Declares `<div id="root">`, loads main.tsx       |
| `package.json`    | Config | npm manifest: project name, scripts, all dependencies                   |
| `package-lock.json`| Lock  | Exact dependency tree (auto-generated, do not edit manually)            |
| `tsconfig.json`   | Config | TypeScript compiler options (target ES2022, JSX react-jsx, bundler res) |
| `vite.config.ts`  | Config | Vite build config: React plugin, Tailwind plugin, env var injection      |
| `metadata.json`   | Config | Google AI Studio project metadata (name, description, permissions)       |
| `.env.example`    | Config | Documents required env vars (GEMINI_API_KEY, APP_URL)                   |
| `.gitignore`      | Config | Ignores node_modules, dist, .env.local                                  |
| `README.md`       | Docs   | Generic AI Studio README (not project-specific)                         |

---

## `src/` — Application Source

### Frontend Directory Structure (Established in M1.3.5)

| Directory | Purpose | Key Contents |
|---|---|---|
| `src/api` | API client services | Typed REST API endpoints (`auth.ts`, `claims.ts`, etc.) |
| `src/components` | Shared UI primitives | `WireframeUI.tsx` (typed wireframe components) |
| `src/config` | Configuration | `env.ts` (centralized environment variable access) |
| `src/constants` | App constants | System constants, state labels, route paths |
| `src/contexts` | React Contexts | Global state providers (`AuthContext`, `ClaimContext`) |
| `src/hooks` | Custom React hooks | `useAuth`, `useClaim`, `useDebounce` |
| `src/layouts` | Page layouts | `AppLayout.tsx` (permanent shell), `AuthLayout.tsx` (login wrapper) |
| `src/pages` | Route page components | `OverviewCanvasPage`, `LoginPage`, `DashboardPage`, etc. |
| `src/routes` | Routing architecture | `AppRouter.tsx` (React Router v7 route definitions) |
| `src/screens` | Wireframe screens | `AuthScreens`, `ClaimScreens`, `DashboardScreens`, `DenialScreens`, `PipelineScreens` |
| `src/services` | Client utilities | Formatting helpers, local storage managers |
| `src/types` | TypeScript types | Shared domain models (`claim.ts`, `patient.ts`, `hospital.ts`, `insurance.ts`, `workflow.ts`, `document.ts`, `audit.ts`, `api.ts`, `index.ts`) |
| `src/utils` | Pure utility functions | ClassName merging (`cn`), form field validators |

### `src/main.tsx`
**Type**: React entry point  
**Purpose**: Mounts the `<App>` component into `#root`. Wraps in `<StrictMode>`.  
**Imports**: React, ReactDOM, App component, index.css  
**Size**: 11 lines — extremely minimal

### `src/index.css`
**Type**: Global stylesheet  
**Purpose**: Imports Tailwind CSS using the new v4 `@import "tailwindcss"` syntax  
**Size**: 2 lines — nothing custom, no CSS variables, no custom classes  
**Note**: Tailwind v4 is configured via the Vite plugin (`@tailwindcss/vite`), not a `tailwind.config.js` file

### `src/App.tsx`
**Type**: Root Application Component  
**Purpose**: Mounts `<AppRouter />` to provide client-side routing across all application views and the preserved wireframe canvas map at `/overview`.

---

## `src/components/`

### `src/components/WireframeUI.tsx`
**Type**: Shared UI component library  
**Purpose**: Defines 7 reusable primitive components used across all screen files  
**Size**: 108 lines

| Export           | Type    | Description                                               |
|------------------|---------|-----------------------------------------------------------|
| `WireButton`     | Component | Button with 3 variants (primary/secondary/outline). Accepts `id` prop for arrow connections |
| `WireInput`      | Component | Text input with optional leading icon and defaultValue    |
| `WireCard`       | Component | Bordered container with optional title header             |
| `WireBadge`      | Component | Inline tag, 2 variants (default / high-severity)          |
| `WireSidebar`    | Component | Left nav rail, 8 hardcoded menu items, highlights activeId |
| `WireHeader`     | Component | Top header with hospital name, agent status pulse, bell icon, user avatar |
| `ScreenContainer`| Component | Outer 1024×768px screen frame with screen title label     |

**Design pattern**: All props are typed as `any` — this was intentional for prototype speed, not for production quality.

**Hardcoded values in WireframeUI**:
- Hospital name: "Sri Ramakrishna Hospital, Coimbatore" (in WireHeader)
- Nav items and their screen labels (in WireSidebar)
- Screen dimensions: 1024×768px (in ScreenContainer)

---

## `src/screens/`

### `src/screens/AuthScreens.tsx`
**Exports**: `Screen1`  
**Content**: Login page with hospital name branding, email/password form, login button  
**Notable IDs**: `btn-login` (connects to screen-2)

### `src/screens/DashboardScreens.tsx`
**Exports**: `Screen2`, `Screen8`, `Screen9`, `Screen16`  
**Size**: 339 lines

| Screen   | Content |
|----------|---------|
| Screen2  | Main dashboard: 4 KPI cards, claims-needing-attention table, quick actions, agent activity feed |
| Screen8  | Reports page: 6 report cards with generate/PDF download, scheduled reports table |
| Screen9  | Settings: hospital profile, insurer connections table, notification prefs, user management, compliance banner |
| Screen16 | Add insurer modal: dropdown, connection type, API credentials form, TPA/state scheme fields |

**Notable IDs**: `nav-pre-auth`, `nav-discharge`, `nav-final-claims`, `nav-pipeline`, `nav-denial`, `nav-reports`, `nav-settings`, `btn-9-add-insurer`

### `src/screens/ClaimScreens.tsx`
**Exports**: `Screen3`, `Screen3A`, `Screen4`, `Screen5`, `Screen12`, `Screen13`  
**Size**: 384 lines

| Screen   | Content |
|----------|---------|
| Screen3  | Pre-auth upload zone, document checklist, pre-auth queue table (6 patients) |
| Screen3A | Processing state overlay: animated step progress for 3 patients (OCR → Validation → Submission) |
| Screen4  | Discharge authorization upload zone + discharge queue (2 patients with urgency badges) |
| Screen5  | Final claims upload zone + final claims queue (1 patient) |
| Screen12 | Missing data modal: 3 specific missing fields with inline input or document upload |
| Screen13 | Approval success screen: amount requested/approved, reference number, expected payment date |

**Notable IDs**: `btn-upload-start`, `btn-3a-pipeline`, `btn-row-missing`, `btn-row-approved`, `btn-row-rejected`, `btn-12-submit`

### `src/screens/PipelineScreens.tsx`
**Exports**: `Screen6`, `Screen10`, `Screen11`  
**Size**: 301 lines

| Screen   | Content |
|----------|---------|
| Screen6  | Claims pipeline master table: 9 rows, search + 4 filter dropdowns, pagination, export |
| Screen10 | Notifications slide-in panel: 5 notifications (warning/success/info), tab filter |
| Screen11 | Claim detail view: patient info, 7-step progress tracker, timeline feed, documents panel |

**Notable IDs**: `btn-6-view`, `btn-6-review`, `btn-11-escalate`, `btn-10-view`

### `src/screens/DenialScreens.tsx`
**Exports**: `Screen7`, `Screen14`, `Screen15`  
**Size**: 266 lines

| Screen   | Content |
|----------|---------|
| Screen7  | Denial recovery: 3 KPI cards, denial reason bar chart, active denial cases table |
| Screen14 | Manual review / escalation: claim summary, AI analysis panel, rejection history, suggested next steps |
| Screen15 | AI error analysis: errors found, cross-reference with accepted claims, proposed corrections |

**Notable IDs**: `btn-7-view-ai`, `btn-7-escalate`, `btn-14-manual`, `btn-15-resubmit`

---

## `backend/` — Express Backend & Persistence Application

| Directory / File | Purpose |
|---|---|
| `backend/src/config` | Environment variables configuration (`env.ts`) |
| `backend/src/controllers` | HTTP Controllers (`health.controller.ts`, `claim.controller.ts`) |
| `backend/src/database` | SQLite Persistence Architecture (`client.ts`, `schema.sql`, `migrate.ts`, `index.ts`) |
| `backend/src/errors` | Custom Error Classes (`AppError.ts`) |
| `backend/src/middleware` | Express Middlewares (`errorHandler.ts`, `requestId.ts`, `validate.ts`) |
| `backend/src/repositories` | Data Access Repositories (`base.repository.ts`, `claim.repository.ts`) |
| `backend/src/responses` | Standardized API Response Helpers (`success.ts`, `error.ts`, `helpers.ts`) |
| `backend/src/routes` | Express Routers (`health.routes.ts`, `claim.routes.ts`) |
| `backend/src/schemas` | Zod Validation Schemas (`claim.schema.ts`) |
| `backend/src/services` | Business Logic Services (`health.service.ts`, `claim.service.ts`) |
| `backend/src/app.ts` | Express Application Initialization |
| `backend/src/server.ts` | Backend HTTP Server Listener Entry Point |

---

## `docs/` — Documentation

25 comprehensive engineering documents covering architecture, data models, state machine, and milestones.

