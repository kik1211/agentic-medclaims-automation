# Implementation Gaps

> A precise comparison between the current wireframe and the intended production system. Maps each gap to its current state, required implementation, complexity, and priority.

---

## Gap Analysis Summary

| Gap | Category | Current State | Priority | Complexity |
|-----|----------|---------------|----------|------------|
| G-01 | Backend | No server | Critical | High |
| G-02 | Auth | Visual only | Critical | Medium |
| G-03 | Navigation | ✅ React Router (M2.2) | Done | Low |
| G-04 | OCR | Not built | High | Medium |
| G-05 | Whisper | Not built | Medium | Medium |
| G-06 | LLM Structuring | Not built | High | Medium |
| G-07 | ICD-10 Coding | Not built | High | Medium |
| G-08 | Claim Validation | Not built | High | Medium |
| G-09 | Scheme Selection | Not built | High | Medium |
| G-10 | Human Approval | Visual only | High | Low |
| G-11 | n8n Integration | Not built | Medium | Medium |
| G-12 | Portal Submission | Not built | Medium | High |
| G-13 | Database | Not built | Critical | Medium |
| G-14 | File Upload | Visual only | Critical | Low |
| G-15 | Real-time Updates | Not built | Medium | Medium |
| G-16 | Denial Appeal | Visual only | Medium | Medium |
| G-17 | Reports | Visual only | Low | Medium |
| G-18 | Settings | Visual only | Low | Low |
| G-19 | Notifications | Visual only | Low | Low |
| G-20 | Tests | None | High | Medium |
| G-21 | Docker | None | Medium | Low |

---

## Detailed Gap Analysis

---

### G-01: No Backend / API Server

**Current State**: Express is installed in `package.json` but no server file exists. Zero API endpoints.

**Required Implementation**:
```
server/
├── index.ts          # Express app entry point
├── routes/
│   ├── auth.ts       # Login, logout, JWT refresh
│   ├── claims.ts     # CRUD + state machine
│   ├── documents.ts  # Upload + OCR trigger
│   ├── dashboard.ts  # KPI aggregation
│   └── insurers.ts   # Insurer config management
├── middleware/
│   ├── auth.ts       # JWT verification
│   └── errorHandler.ts
├── services/
│   ├── claimsService.ts
│   ├── ocrService.ts
│   └── aiService.ts
└── db/
    ├── schema.sql
    └── connection.ts
```

**Complexity**: High  
**Priority**: Critical (blocks all other backend features)  
**Risks**: Defining clean boundaries between the claim state machine stages is complex

---

### G-02: No Authentication

**Current State**: Login form (Screen1) is visual only. No JWT, no session, no user context.

**Required Implementation**:
- POST `/api/auth/login` → validates credentials → returns JWT
- JWT stored in HttpOnly cookie (not localStorage — CSRF protection)
- React Auth Context with `useAuth` hook
- Protected route wrapper component
- Token refresh mechanism

**Complexity**: Medium  
**Priority**: Critical  
**Risks**: DPDPA compliance requires logging all authentication events

---

### G-03: No Client-Side Navigation

**Current State**: Buttons have IDs but no `onClick` handlers. The `connections[]` array is purely decorative (draws SVG arrows).

**Required Implementation**:
```typescript
// Install: npm install react-router-dom
// Each screen becomes a route

const router = createBrowserRouter([
  { path: '/login', element: <Screen1 /> },
  { path: '/dashboard', element: <Screen2 /> },
  { path: '/claims/pre-auth', element: <Screen3 /> },
  // ...
]);

// Each button:
<button onClick={() => navigate('/dashboard')}>LOGIN</button>
```

**Complexity**: Low  
**Priority**: Critical  
**Risks**: None significant; React Router v6 is well-documented

---

### G-04: OCR Extraction

**Wireframe representation**: Screen3A shows "Step 1: OCR Extraction" with a checkmark. Screen11 shows "OCR Extraction Started" in the timeline.

**Current State**: Not implemented.

**Required Implementation**:
- Accept PDF upload via multipart form
- Convert PDF pages to images (pdf2pic or pdfjs)
- Run OCR on images (Tesseract.js in Node, or cloud API)
- Return structured text keyed by page

**Technology options**:
- **Tesseract.js**: Open source, runs in Node.js, good for typed text. Struggles with handwritten notes and scan quality variance common in Indian hospitals.
- **Google Document AI**: Cloud API, better accuracy, costs money per page, handles forms natively
- **AWS Textract**: Similar to Document AI, good form extraction

**Complexity**: Medium  
**Priority**: High  
**Risks**: Indian medical documents are often scanned at low resolution or in Tamil/Telugu/Hindi + English mix. OCR accuracy will vary significantly.

---

### G-05: Whisper Speech-to-Text

**Wireframe representation**: The intended workflow (PROJECT_OVERVIEW.md) shows Whisper as the first step.

**Current State**: Not shown in any wireframe screen. Not implemented.

**Required Implementation**:
- Audio recording UI (microphone button on a new screen)
- Audio file upload (WAV/MP3)
- POST audio to `/api/transcribe`
- Server calls OpenAI Whisper API (or runs `whisper.cpp` locally)
- Returns transcript text
- Transcript feeds into LLM structuring pipeline

**Technology options**:
- **OpenAI Whisper API**: Easiest. Costs $0.006/minute. Medical terminology accuracy is good.
- **faster-whisper (local)**: Python-based, runs on CPU or GPU. Free but requires Python backend.
- **whisper.cpp**: C++ implementation. More complex setup.

**Complexity**: Medium  
**Priority**: Medium (differentiating feature but not core to claim submission)  
**Risks**: Audio in noisy hospital environment. Multi-speaker detection needed for doctor-patient conversation. Indian English accents may reduce accuracy.

---

### G-06: LLM-Based Clinical Structuring

**Wireframe representation**: Screen3A shows "Step 3: Field Validation" and Screen11 shows "Extraction Confidence: 94%".

**Current State**: `@google/genai` is installed but never called.

**Required Implementation**:
```typescript
// In aiService.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function structureClinicalData(ocrText: string): Promise<ClaimData> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: CLINICAL_STRUCTURING_PROMPT + ocrText,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text);
}
```

Prompt must extract:
- Patient demographics (name, DOB, ID)
- Diagnosis (free text + ICD-10 suggestion)
- Procedure (free text + CPT suggestion)
- Treating physician
- Admission/discharge dates
- Estimated cost
- Insurance policy number

**Complexity**: Medium  
**Priority**: High  
**Risks**: LLM output consistency. Must validate JSON structure. Hallucination risk on specific codes.

---

### G-07: ICD-10 / CPT Coding

**Wireframe representation**: Screen15 shows "Diagnosis Code: O80 (Normal Delivery) conflicts with procedure code for C-Section" — demonstrates awareness of the coding system.

**Current State**: Not implemented.

**Required Implementation**:
- LLM suggests ICD-10 and CPT codes based on clinical text
- Validation against known ICD-10 / CPT databases
- Conflict detection (e.g., O80 + C-section procedure)
- Manual override UI

**Data sources**:
- ICD-10 codes: WHO public dataset (downloadable)
- CPT codes: AMA dataset (requires license for commercial use) or SNOMED CT (open)

**Complexity**: Medium  
**Priority**: High  
**Risks**: CPT code licensing. Indian hospitals may use ICD-10 differently from US standards. NABH guidelines may require specific coding practices.

---

### G-08: Claim Validation

**Wireframe representation**: Screen3A shows "Step 3: Field Validation". Screen12 shows the missing data detection result.

**Current State**: Not implemented.

**Required Implementation**:
- Per-insurer validation rule engine
- Required field checklist by claim type (pre-auth, discharge, final)
- Missing field detection
- Policy coverage validation (is procedure covered?)
- Budget limit checks

**Complexity**: Medium  
**Priority**: High  
**Risks**: Each insurer has different validation rules. Maintaining rule configurations per insurer is ongoing operational work.

---

### G-09: Government Scheme Selection

**Wireframe representation**: CMCHIS, PM-JAY visible in data tables.

**Current State**: Not implemented. Scheme selection is visual only (insurer name in dropdown).

**Required Implementation**:
- Scheme identification from patient's insurance card (via OCR)
- Scheme-specific form templates (government schemes have standardized forms)
- PMJAY empanelment number validation
- State scheme (CMCHIS, AAROGYASRI, etc.) routing

**Complexity**: Medium  
**Priority**: High  
**Risks**: Government scheme APIs are not standardized. Integration often requires manual portal access.

---

### G-10: Human Approval (Human-in-the-Loop)

**Wireframe representation**: Screen12 (missing data), Screen14 (manual review), Screen15 (AI error analysis) all represent human-in-the-loop moments.

**Current State**: Screens exist but are not connected to any data. Buttons do not trigger actions.

**Required Implementation**:
- Backend identifies when human review is needed
- Frontend receives notification (WebSocket or polling)
- Human reviews structured data and AI suggestions
- Human clicks approve/reject → POST to backend
- Backend continues pipeline

**Complexity**: Low (frontend-side implementation given a working backend)  
**Priority**: High  
**Risks**: None significant; the UI design already captures this well

---

### G-11: n8n Workflow Orchestration

**Wireframe representation**: Not directly visible in any screen. Referenced in the product vision.

**Current State**: Not implemented. No n8n instance configured.

**Required Implementation**:
- Self-hosted or cloud n8n instance
- Webhook trigger from backend when claim is ready to submit
- n8n workflow:
  1. Receive claim data
  2. Determine insurer submission method (API vs. portal)
  3. Prepare submission payload
  4. Submit to insurer
  5. Wait for response
  6. POST response back to ClaimPilot backend
- Dashboard shows n8n workflow status

**Complexity**: Medium  
**Priority**: Medium  
**Risks**: n8n adds operational complexity. Alternatively, the orchestration logic can live directly in the Express backend (simpler for MVP).

---

### G-12: Insurer Portal Submission (Playwright RPA)

**Wireframe representation**: Screen9 (Settings) shows "HDFC Ergo — RPA — Connected". This explicitly acknowledges browser automation.

**Current State**: Not implemented.

**Required Implementation**:
- Playwright scripts per insurer portal
- Session management (login, maintain session, re-login on expiry)
- Form filling with claim data
- Document upload
- Confirmation number capture
- Error detection (portal rejection messages)

**Technology**: Playwright (already referenced in resume)

**Complexity**: High  
**Priority**: Medium  
**Risks**: 
- Portal UI changes break scripts (maintenance burden)
- Insurers may block automated access (IP blocking, CAPTCHA)
- Session management is fragile
- Legal risk: some insurers may prohibit automated portal access in their ToS

---

### G-13: Database

**Current State**: `better-sqlite3` installed but no schema exists.

**Required Implementation**:
```sql
-- Minimum viable schema
CREATE TABLE hospitals (id, name, registration_number, ...);
CREATE TABLE users (id, hospital_id, email, password_hash, role, ...);
CREATE TABLE claims (id, hospital_id, patient_name, insurer, stage, status, ...);
CREATE TABLE documents (id, claim_id, filename, path, ocr_text, ...);
CREATE TABLE audit_log (id, claim_id, user_id, action, timestamp, ...);
```

**Complexity**: Medium  
**Priority**: Critical  

---

### G-14: Real File Upload

**Wireframe representation**: All three upload pages (Screen3, Screen4, Screen5) show drag-and-drop upload zones.

**Current State**: Upload zones are visual. No `<input type="file">`, no file processing.

**Required Implementation**:
- `<input type="file" multiple accept=".pdf">` 
- File drag-and-drop event handlers
- Client-side file size validation (max 20MB per file)
- Multipart form POST to `/api/documents/upload`
- Upload progress indicator
- Server: multer middleware for file handling

**Complexity**: Low  
**Priority**: Critical  

---

### G-15: Real-Time Status Updates

**Wireframe representation**: The "Agent Activity Feed" and claim status updates imply real-time behavior.

**Current State**: All activity data is static.

**Required Implementation**:
- WebSocket connection from frontend
- Backend emits events on claim state changes
- React state updates on received events
- Reconnection logic

**Complexity**: Medium  
**Priority**: Medium  

---

### G-16 onward: Reports, Settings, Notifications

These screens exist as wireframes with good UI design but need backend data:

- **Reports (G-16)**: Need PostgreSQL aggregation queries + PDF generation (e.g., `pdf-lib` or Puppeteer)
- **Settings (G-17)**: Needs CRUD for hospital profile, insurer config management, user management
- **Notifications (G-18)**: Needs notification storage, WebSocket delivery, read/unread state

**Priority**: Low (can implement after core claim workflow works)

---

## Total Feature Completion

| Category | Screens Done | Architecture Done | Backend Done | E2E Done |
|----------|-------------|------------------|--------------|----------|
| Auth | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Dashboard | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Pre-Auth | ✅ (wireframe) | ✅ | ❌ | ❌ |
| OCR Pipeline | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Claim Validation | ✅ (wireframe) | ✅ | ❌ | ❌ |
| ICD-10 Coding | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Human-in-Loop | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Denial Recovery | ✅ (wireframe) | ✅ | ❌ | ❌ |
| Portal Submission | ❌ | ✅ | ❌ | ❌ |
| Whisper STT | ❌ | ✅ | ❌ | ❌ |
| n8n Orchestration | ❌ | ✅ (in-process MVP) | ❌ | ❌ |
| State Machine | N/A | ✅ (30 states) | ❌ | ❌ |
| Data Model | N/A | ✅ (15 objects) | ❌ | ❌ |
| Failure Recovery | N/A | ✅ (all modules) | ❌ | ❌ |
| Audit / Observability | N/A | ✅ | ❌ | ❌ |

**Overall**: ~30% complete (UI/wireframes) / **100% complete (architecture)** / ~0% complete (backend code)

> Architecture review completed 2026-07-30. See [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md), [STATE_MACHINE.md](./STATE_MACHINE.md), [MODULE_INTERFACE_SPEC.md](./MODULE_INTERFACE_SPEC.md).

