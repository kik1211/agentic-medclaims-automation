# Product Requirements Document (PRD)
# ClaimPilot India — AI-Assisted Hospital Insurance Claims Automation Platform

**Version**: 1.1 (Architecture Review Complete)  
**Status**: Architecture Finalized — Implementation Ready  
**Last Updated**: 2026-07-30  
**Cross-reference**: [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md), [MODULE_INTERFACE_SPEC.md](./MODULE_INTERFACE_SPEC.md)

---

## 1. Project Goals

### Primary Goal
Build a technically correct, modular, well-engineered MVP that demonstrates an end-to-end AI-assisted hospital insurance claims workflow for Indian hospitals.

### Secondary Goals
1. Demonstrate the technical feasibility of automating claims processing using OCR, LLMs, and browser automation
2. Create a portfolio project that can be discussed in technical interviews and published on GitHub
3. Preserve the original hackathon vision while achieving production engineering quality

### What This Is NOT
- Not an enterprise hospital system
- Not a licensed medical software product
- Not a replacement for hospital billing teams
- Not a regulatory-compliant production system (no IRDAI/NABH certification)

---

## 2. Scope

### In Scope (MVP)
1. Interactive React SPA with full navigation (not wireframe-only)
2. Express.js REST API backend
3. JWT-based authentication (hospital login)
4. File upload pipeline (PDF acceptance and storage)
5. OCR extraction from uploaded PDFs (Tesseract.js)
6. LLM-based clinical structuring (Google Gemini API)
7. ICD-10 code suggestion and conflict detection
8. Claim validation rule engine
9. Human-in-the-loop review workflow
10. Basic claims database (SQLite → PostgreSQL path)
11. Dashboard with real computed statistics
12. Denial recovery tracking
13. Audit log

### Out of Scope (Future Work)

> **Consistency note**: Whisper (M1), in-process workflow orchestration (M6), and Playwright portal automation (M8) are all **designed modules** in [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md). They are in scope architecturally. The items below are out of scope for the initial implementation sprint only — not out of scope for the project.

1. Whisper speech-to-text *(architecture designed in M1; implementation deferred to Milestone 4+)*
2. n8n workflow orchestration *(M6 uses in-process queue for MVP; n8n is the migration target at scale)*
3. Real insurer API integration *(M8 architecture designed; requires insurer agreements)*
4. Playwright portal submission *(M8 RPA path designed; implementation requires per-portal scripts)*
5. WhatsApp notifications
6. Multi-tenancy (multiple hospitals)
7. Role-based access control beyond Claims Officer / Admin
8. PDF report generation
9. NABH compliance certification
10. Real government scheme API integration (PM-JAY, CMCHIS)
11. Mobile/tablet responsive design

---

## 3. Functional Requirements

### FR-01: Authentication
- FR-01.1: Hospital staff can log in with email and password
- FR-01.2: System returns JWT on successful login
- FR-01.3: Protected routes reject unauthenticated requests
- FR-01.4: Login attempts are logged to audit trail

### FR-02: Document Upload
- FR-02.1: Users can upload PDF files (up to 5 per claim, max 20MB each)
- FR-02.2: System accepts drag-and-drop and file browser upload
- FR-02.3: System rejects non-PDF files with a clear error message
- FR-02.4: Upload creates a claim record in the database

### FR-03: OCR Processing
- FR-03.1: System automatically runs OCR on uploaded PDFs
- FR-03.2: OCR status is visible in the UI (processing / complete / failed)
- FR-03.3: Extracted text is stored and associated with the document record

### FR-04: Clinical Structuring (LLM)
- FR-04.1: After OCR, system sends text to Gemini API with a clinical extraction prompt
- FR-04.2: System extracts: patient name, DOB, diagnosis, procedure, physician, dates, cost, policy number
- FR-04.3: Extraction results are stored as structured JSON in the database
- FR-04.4: Confidence score is computed and stored

### FR-05: ICD-10 Code Suggestion
- FR-05.1: System suggests ICD-10 diagnosis codes based on clinical text
- FR-05.2: System detects conflicts between diagnosis code and procedure
- FR-05.3: User can override suggested codes
- FR-05.4: Final codes are stored with the claim

### FR-06: Claim Validation
- FR-06.1: System validates required fields based on claim type (pre-auth, discharge, final)
- FR-06.2: Missing required fields trigger the Missing Data screen
- FR-06.3: User can complete missing fields manually or upload additional documents
- FR-06.4: Validation rules are configurable per insurer (stored in database)

### FR-07: Human Approval
- FR-07.1: Before submission, a human review step is required
- FR-07.2: Reviewer sees all extracted data, suggested codes, and validation results
- FR-07.3: Reviewer can approve (proceed to submission) or reject (return to correction)
- FR-07.4: Approval action is logged in the audit trail

### FR-08: Claims Pipeline
- FR-08.1: Pipeline view shows all claims with status, insurer, stage, and amount
- FR-08.2: Pipeline is filterable by status, insurer, stage, and date range
- FR-08.3: Pipeline is searchable by patient name or reference number
- FR-08.4: Each claim links to a detail view

### FR-09: Denial Recovery
- FR-09.1: Denied claims are automatically flagged
- FR-09.2: System analyzes denial reason using Gemini API
- FR-09.3: System suggests corrective actions
- FR-09.4: Human reviewer can approve AI suggestion or escalate to manual handling
- FR-09.5: Recovery attempts are tracked (Attempt 1, Attempt 2, etc.)

### FR-10: Dashboard
- FR-10.1: Dashboard shows KPIs computed from real database queries
- FR-10.2: KPIs include: claims this month, approval rate, revenue recovered, avg processing time
- FR-10.3: Claims requiring attention are surfaced prominently
- FR-10.4: Activity feed shows recent system events in chronological order

### FR-11: Audit Log
- FR-11.1: Every system action is logged with timestamp, user, claim ID, and action type
- FR-11.2: Audit log is viewable in the Reports section
- FR-11.3: Audit log is exportable

---

## 4. Non-Functional Requirements

### NFR-01: Performance
- Page load time < 3 seconds on a standard broadband connection
- API response time < 500ms for non-AI endpoints
- OCR processing: < 60 seconds per 5-page PDF
- LLM structuring: < 10 seconds per document

### NFR-02: Reliability
- Application handles PDF upload failures gracefully (retry, user notification)
- LLM API failures fall back to manual entry mode
- Database connection errors surface user-friendly messages

### NFR-03: Security
- API key (GEMINI_API_KEY) must never be exposed to the browser
- All API endpoints protected by JWT authentication
- File uploads validated for type and size server-side (not just client-side)
- SQL injection prevention via parameterized queries
- HTTPS in production

### NFR-04: Maintainability
- TypeScript strict mode enabled
- ESLint + Prettier configured and enforced
- All components properly typed (no `any`)
- Functions documented with JSDoc
- Test coverage > 60% for backend services

### NFR-05: Observability
- Structured logging (JSON format) for all backend operations
- Error events include stack traces and context
- Each request has a unique request ID in logs

---

## 5. Security Requirements

### SR-01: Data Classification
Patient data (names, diagnoses, policy numbers) is **sensitive personal data** under India's DPDPA. Must be treated accordingly.

### SR-02: API Key Security
Gemini API key must be stored in server environment variables and called server-side only.

### SR-03: Authentication
- Passwords stored as bcrypt hashes (min rounds: 12)
- JWT expiry: 1 hour (access token), 7 days (refresh token)
- JWT stored in HttpOnly, Secure, SameSite=Strict cookie

### SR-04: File Security
- Uploaded files stored outside web root (not publicly accessible)
- Files served only to authenticated users with access to the associated claim
- File type validated by MIME type inspection, not just extension

---

## 6. Performance Expectations

Based on realistic MVP scale (single hospital, ~100 claims/day):

| Operation | Expected Throughput | Latency Target |
|-----------|---------------------|----------------|
| File upload (5 PDFs) | 10 concurrent | < 5s |
| OCR extraction | 5 concurrent | < 60s/doc |
| LLM structuring | 3 concurrent | < 10s/doc |
| API queries | 100 req/s | < 200ms |
| Dashboard load | N/A | < 1s |

---

## 7. System Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the current architecture.

Target MVP architecture:
```
Frontend (React SPA) → REST API (Express) → SQLite DB
                                          → Gemini API (server-side)
                                          → File System (uploads)
```

---

## 8. User Roles

| Role           | Permissions                                                    |
|----------------|----------------------------------------------------------------|
| Admin          | Full access: settings, user management, reports, all claims    |
| Claims Officer | Upload documents, review pipeline, complete missing data, approve claims |
| Viewer         | Read-only access to pipeline and dashboard                     |

---

## 9. Success Criteria

### Technical Success
- [ ] User can upload a PDF and see OCR extraction result in UI
- [ ] System correctly extracts patient name, diagnosis, and procedure from a sample document
- [ ] System suggests an ICD-10 code for a simple diagnosis
- [ ] Human approval step works end-to-end (approve/reject)
- [ ] Dashboard KPIs reflect real database values
- [ ] TypeScript compiles with no errors
- [ ] At least 5 unit tests pass

### Portfolio Success
- [ ] Repository is publicly accessible on GitHub
- [ ] README clearly explains the system and how to run it locally
- [ ] The AI processing pipeline (OCR → LLM → coding) is demonstrable
- [ ] The human-in-the-loop workflow is demonstrable
- [ ] Code is clean enough to discuss in a technical interview

---

## 10. Out-of-Scope Clarifications

### Why No Real Insurer Integration
- Indian insurer APIs are proprietary and require formal agreements
- Portal automation (Playwright/RPA) is architecturally correct but requires ongoing maintenance
- For a portfolio MVP, simulating the submission step is appropriate and honest

### Why No Whisper (Initially)
- Whisper adds audio recording complexity to the frontend
- A separate microphone UI screen is needed
- OCR from PDF documents is the more common hospital workflow
- Whisper can be added in a later milestone

### Why SQLite First (Not PostgreSQL)
- SQLite requires no installation or configuration
- Sufficient for single-hospital MVP scale
- `better-sqlite3` is already installed
- Migration to PostgreSQL is straightforward when needed
