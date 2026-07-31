# Data Flow

> A description of how data moves through the application — and where it does not.

---

## Current State: No Data Flow

In the current prototype, there is no data flow. All "data" is hardcoded JSX strings rendered directly into components. There is no:

- State management
- Props drilling
- Context API
- Data fetching
- Form submission
- Database reads/writes
- API calls

Every piece of information displayed in the UI is a literal string in the source code.

---

## Static Data Locations

### Dashboard KPIs (Screen2 — DashboardScreens.tsx)
```
Claims This Month: 1,284
Approval Rate: 94.2%
Revenue Recovered: ₹4.2Cr
Avg Processing Time: 14m
```
Source: Hardcoded in JSX, lines 15–31 of DashboardScreens.tsx

### Claims Table (Screen6 — PipelineScreens.tsx)
```javascript
{ name: 'Rajesh Kumar', age: 45, scheme: 'Star Health', stage: 'Pre-Auth', proc: 'Appendectomy', req: '₹45,000', app: '-', status: 'Extracting', days: 0 },
{ name: 'Meena Devi', age: 62, scheme: 'CMCHIS', stage: 'Pre-Auth', proc: 'Cataract', ... },
... 7 more rows
```
Source: Inline array in PipelineScreens.tsx, lines 53–62

### Activity Feed (Screen2)
```javascript
[
  { time: '10:42 AM', action: 'Pre-auth submitted', details: 'Rajesh Kumar - Star Health' },
  { time: '10:38 AM', action: 'Claim approved', details: 'Meena Devi - CMCHIS' },
  ...
]
```
Source: Inline array in DashboardScreens.tsx, lines 91–96

### Denial Data (Screen7 — DenialScreens.tsx)
```
Total Denials: 142 (11% of claims)
Successfully Recovered: 89 (62% recovery rate)
Revenue Recovered: ₹1.8Cr
```
Source: Hardcoded in JSX

### Insurer List (Screen9 — Settings)
```
Star Health — API — Connected — Today, 09:00 AM
HDFC Ergo — RPA — Connected — Yesterday
```
Source: Hardcoded table rows

---

## Navigation Data Flow (ArrowsOverlay)

The only "data flow" in the application is the `connections` array that drives the SVG arrows:

```typescript
// In App.tsx
const connections = [
  { from: 'btn-login', to: 'screen-2' },
  { from: 'nav-pre-auth', to: 'screen-3' },
  ...33 total connections
];
```

This flows into `ArrowsOverlay`:

```
connections[] → DOM queries (getElementById) → getBoundingClientRect() 
    → coordinate calculation → useState(lines) → SVG <path> elements
```

This is the only state update in the entire application.

---

## Intended Data Flow (Production Vision)

### Claim Creation Flow
```
User uploads PDF → FormData POST → Backend API
    → File stored (S3 / local disk)
    → OCR job queued (Tesseract / AWS Textract)
    → OCR result stored in DB
    → LLM called (Gemini API) with OCR text
    → Structured claim data extracted
    → ICD-10 codes assigned
    → Claim record created in PostgreSQL
    → WebSocket event → Frontend updates claim status
```

### Human-in-the-Loop Flow
```
AI detects missing field → Missing fields list stored in DB
    → Frontend polls / WebSocket receives event
    → Screen12 (Missing Data) displayed with specific fields
    → User fills fields → POST to /api/claims/{id}/complete
    → Backend validates → Updates claim record
    → Triggers next pipeline stage
```

### Denial Recovery Flow
```
Insurer API / portal returns rejection → n8n webhook triggered
    → n8n workflow: parse rejection reason
    → Gemini API: generate counter-appeal letter
    → Human review screen (Screen14/15) populated with AI analysis
    → Human approves → n8n triggers resubmission
```

### Dashboard Data Flow (Intended)
```
PostgreSQL aggregation query → Express API endpoint
    → GET /api/dashboard/kpis
    → React Query / SWR polling
    → Dashboard KPI cards update in real-time
```

---

## Environment Variables (Data Entry Points)

Two environment variables are documented but only one is used by the build:

| Variable        | Used By                 | Current Effect                              |
|-----------------|-------------------------|---------------------------------------------|
| `GEMINI_API_KEY`| `vite.config.ts` inject | Injects into `process.env.GEMINI_API_KEY` but no code reads it |
| `APP_URL`       | Not used anywhere       | Documented in `.env.example` but never referenced in code |

---

## Form Inputs (Data Capture)

All inputs in the application are **uncontrolled** React inputs (`defaultValue` only, no `value` + `onChange`). Nothing is captured, validated, or submitted.

Inputs present in the UI:
- Login form: Hospital Name, Email, Password (Screen1)
- Missing data fields: 3 inline inputs (Screen12)
- Settings: Hospital profile, notification preferences (Screen9)
- Add insurer: API key, endpoint, credentials (Screen16)
- Pipeline search bar (Screen6)

None of these inputs trigger any action or update any state.
