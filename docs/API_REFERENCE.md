# ClaimPilot India — API Reference

This document describes the active REST API endpoints, request/response contracts, authentication rules, and external service integrations for the ClaimPilot backend.

Interactive OpenAPI 3.0 documentation is available at `http://localhost:3001/api/docs` when the backend is running.

---

## 1. Response Envelope Contract

Every backend response adheres to a standardized JSON envelope.

### Success Response (`SuccessResponse<T>`)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-07-30T17:44:40.127Z",
  "requestId": "361cbd67-9b50-4c78-a718-341a9394e442",
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### Error Response (`ErrorResponse`)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error description",
    "details": { ... }
  },
  "timestamp": "2026-07-30T17:44:44.646Z",
  "requestId": "7f491351-3020-4345-a525-ae160473a61d"
}
```

Standard error codes: `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

---

## 2. Authentication & Authorization

- **Mechanism**: Bearer token via `Authorization: Bearer <jwt_token>` header.
- **Roles**:
  - `ADMIN`: Full administrative access.
  - `REVIEWER`: Access to human review queues and approval/rejection endpoints.
  - `OPERATOR`: Access to standard claim creation, document uploads, and pipeline triggers.

---

## 3. Active Endpoint Reference

### Health & Observability

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | Operational status, uptime, and request ID. |
| `GET` | `/ready` | No | Verifies SQLite connectivity and Redis status. |
| `GET` | `/metrics` | No | Telemetry metrics: request counts, error rates, RAM usage. |
| `GET` | `/api/docs` | No | Swagger UI OpenAPI specification. |

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Register new user account. Returns profile & JWT. |
| `POST` | `/api/auth/login` | No | Authenticate credentials. Returns profile & JWT. |
| `GET` | `/api/auth/me` | Yes | Return authenticated user identity. |

### Claims Management (`/api/claims`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/claims` | Yes | List claims with pagination and optional hospital filtering. |
| `POST` | `/api/claims` | No | Create a new claim in `DRAFT` state. |
| `GET` | `/api/claims/:id` | Yes | Get full details of a specific claim. |
| `PATCH` | `/api/claims/:id` | Yes | Update claim status or metadata fields. |
| `POST` | `/api/claims/:id/clinical-extract` | Yes | Trigger clinical structuring from completed OCR texts. |
| `POST` | `/api/claims/:id/coding` | Yes | Execute ICD-10 and CPT auto-coding on structured clinical data. |
| `POST` | `/api/claims/:id/validate` | Yes | Run deterministic policy validation rules on claim. |
| `POST` | `/api/claims/:id/submit` | Yes | Execute portal submission adapter and record reference. |

### Documents & OCR (`/api/documents`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/documents/upload` | Yes | Upload document (PDF/PNG/JPEG, max 20MB). Triggers background OCR. |
| `GET` | `/api/documents/:id` | Yes | Fetch document record, OCR status, and extracted text. |
| `GET` | `/api/claims/:id/documents` | Yes | List all documents attached to a claim. |
| `POST` | `/api/documents/:id/ocr` | Yes | Synchronously trigger/re-run OCR processing on document. |

### Human Review Queue (`/api/review`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/review/pending` | Yes (`REVIEWER`) | List claims requiring review (`READY_FOR_REVIEW`, `VALIDATED`). |
| `GET` | `/api/review/:claimId` | Yes (`REVIEWER`) | Fetch review dossier (clinical JSON, codes, warnings, documents). |
| `POST` | `/api/review/:claimId/approve` | Yes (`REVIEWER`) | Approve claim (`APPROVED_BY_REVIEWER`). |
| `POST` | `/api/review/:claimId/reject` | Yes (`REVIEWER`) | Reject claim (`REJECTED_BY_REVIEWER`) with refusal reasons. |

### External Workflow Webhooks (`/api/webhooks`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/webhooks/claim-event` | No | External trigger (e.g. n8n). Runs OCR -> LLM -> Coding -> Validation -> Submission pipeline. |
| `POST` | `/api/webhooks/workflow-retry` | No | Re-executes a failed stage (`OCR`, `CLINICAL`, `CODING`, `VALIDATION`, `SUBMISSION`). |

---

## 4. Integration Implementation Details

### Clinical Extraction & Gemini LLM (`backend/src/llm/gemini.service.ts`)
- **Library**: `@google/genai` (v1.29.0).
- **Model**: `gemini-2.5-flash` (configurable via `GEMINI_MODEL`).
- **Input**: Concatenated OCR text from all completed documents attached to the claim.
- **Behavior with API Key**:
  Sends a structured prompt requesting JSON matching `ClinicalDocumentDataSchema` (patient name, age, gender, diagnosis, procedures, claimed amount, dates).
- **Behavior without API Key (Fallback Mode)**:
  Executes a local regex heuristic extractor (`fallbackExtractor`) that extracts patient demographics, diagnosis, and cost patterns directly from text. This ensures testing and core flows function without external API dependencies.
- **Note on Scope**:
  The Gemini API is utilized exclusively for clinical document structuring in `ClinicalService`. It is **not** used for ICD-10/CPT coding (which uses static dictionaries) or denial analysis (which is currently mock UI).

### Document OCR Engine (`backend/src/ocr/tesseract.service.ts`)
- For digital PDFs, `pdf-parse` extracts native text streams directly for fast processing.
- For image formats (PNG, JPEG) or scanned PDFs, `tesseract.js` worker (`eng` language) is invoked.
- File storage defaults to local filesystem under `backend/uploads/` (or configured `UPLOAD_DIR`).

### Medical Coding (`backend/src/coding/`)
- `IcdService`: Maps clinical diagnosis strings using regex matches against a curated dictionary of common ICD-10-CM codes, falling back to `R69` if unlisted.
- `CptService`: Maps procedural phrases against a curated CPT dictionary, falling back to `99214` if unlisted.

### Portal Submission (`backend/src/submission/`)
- Built around the `IPortalAdapter` interface (`portal.adapter.ts`).
- Current implementation uses `MockPortalAdapter`, which generates formatted audit logs and a synthetic submission reference string (`REF_SUB_<timestamp>_<id>`).
- Real browser automation against live insurer portals via Playwright is an architectural target, not currently executed in production.
