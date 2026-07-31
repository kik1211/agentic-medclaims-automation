# API Reference

> Documents what APIs exist, what is planned, and what is installed but unused.

---

## Current State: Express Backend with Standardized API Response Contract (Milestone M3.1)

The backend Express application resides in `backend/` and exposes a modular REST architecture.

All backend endpoints strictly enforce the standardized **API Response Contract**:

### Standardized Success Response Structure (`SuccessResponse<T>`)
```json
{
  "success": true,
  "data": { "status": "ok" },
  "timestamp": "2026-07-30T17:44:40.127Z",
  "requestId": "361cbd67-9b50-4c78-a718-341a9394e442",
  "meta": { "page": 1, "total": 100 }
}
```

### Standardized Error Response Structure (`ErrorResponse`)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Requested route not found",
    "details": { "resource": "/api/unknown" }
  },
  "timestamp": "2026-07-30T17:44:44.646Z",
  "requestId": "7f491351-3020-4345-a525-ae160473a61d"
}
```

### Active Endpoints
- `GET /health` — System health check (returns operational status, timestamp, and `requestId`).
- `GET /ready` — Infrastructure readiness probe (verifies database and Redis connectivity).
- `GET /metrics` — Observability telemetry endpoint (returns request counts, latency metrics, and system memory stats).
- `GET /api/docs` — Swagger UI interactive OpenAPI 3.0 specification documentation.
- `POST /api/auth/register` — Registers a hospital user account, returns JWT access token and profile (password hash omitted).

- `POST /api/auth/login` — Authenticates user credentials via bcrypt, returns JWT access token.
- `GET /api/auth/me` — Protected endpoint returning current user profile (`authenticate` middleware required).
- `GET /api/claims` — Lists claims in database.
- `GET /api/claims/:id` — Fetches claim details by ID.
- `POST /api/claims` — Creates new claim record.
- `PATCH /api/claims/:id` — Updates claim status / notes.
- `POST /api/documents/upload` — Uploads PDF/PNG/JPEG document (max 20MB), saves file to disk, stores metadata in SQLite, and enqueues background OCR worker.
- `GET /api/documents/:id` — Fetches document metadata, OCR status, and extracted text.
- `GET /api/claims/:id/documents` — Fetches all documents associated with a claim.
- `POST /api/documents/:id/ocr` — Explicitly triggers/executes OCR extraction pipeline on document.
- `POST /api/claims/:id/clinical-extract` — Structures OCR text from completed documents into validated clinical JSON via Gemini LLM.
- `GET /api/review/pending` — Fetches claims requiring human reviewer decision (`READY_FOR_REVIEW`, `VALIDATED`).
- `GET /api/review/:claimId` — Fetches comprehensive claim review context including clinical JSON, coding, validation results, documents, and historical review timeline.
- `POST /api/review/:claimId/approve` — Approves claim (`APPROVED_BY_REVIEWER`), records comments, and creates audit entry.
- `POST /api/review/:claimId/reject` — Rejects claim (`REJECTED_BY_REVIEWER`), records refusal reason, and creates audit entry.
- `POST /api/webhooks/claim-event` — Receives n8n/external workflow trigger events; sequentially executes OCR, LLM extraction, coding, validation, and auto-submission.
- `POST /api/webhooks/workflow-retry` — Receives stage retry requests (`OCR`, `CLINICAL`, `CODING`, `VALIDATION`, `SUBMISSION`) to re-execute failed workflow steps safely.

---








## Installed Backend Infrastructure: Express & TypeScript

`backend/package.json` includes:
```json
"express": "^4.21.2",
"helmet": "^8.0.0",
"cors": "^2.8.5",
"zod": "^3.24.1"
```

The Express application entry point is [backend/src/server.ts](file:///c:/Users/rskir/OneDrive/Desktop/Claim_bot_2-main/Claim_bot_2-main/backend/src/server.ts) with app initialization in [backend/src/app.ts](file:///c:/Users/rskir/OneDrive/Desktop/Claim_bot_2-main/Claim_bot_2-main/backend/src/app.ts).

---

## Installed but Uncalled: Gemini SDK

`package.json` includes:
```json
"@google/genai": "^1.29.0"
```

The environment variable `GEMINI_API_KEY` is injected by Vite, suggesting this was planned for use. No calls to `@google/genai` exist anywhere in the source code.

**Intended usage** (not implemented):
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const result = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `Extract structured medical claim data from this OCR text: ${ocrText}`,
});
```

---

## Planned API Endpoints (Production Vision)

These endpoints represent what a production implementation would require. **None exist yet.**

### Authentication

| Method | Endpoint               | Description                            |
|--------|------------------------|----------------------------------------|
| POST   | `/api/auth/login`      | Hospital login, returns JWT            |
| POST   | `/api/auth/logout`     | Invalidate session                     |
| GET    | `/api/auth/me`         | Get current user                       |

### Claims Management

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| POST   | `/api/claims`                   | Create new claim from uploaded docs   |
| GET    | `/api/claims`                   | List all claims (paginated, filtered) |
| GET    | `/api/claims/:id`               | Get single claim with full detail     |
| PATCH  | `/api/claims/:id`               | Update claim data or status           |
| DELETE | `/api/claims/:id`               | Remove claim                          |
| POST   | `/api/claims/:id/complete`      | Submit missing data fields            |
| POST   | `/api/claims/:id/approve`       | Human approval before submission      |
| POST   | `/api/claims/:id/escalate`      | Escalate to manual review             |
| POST   | `/api/claims/:id/resubmit`      | Resubmit denied claim                 |

### Documents

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| POST   | `/api/documents/upload`         | Upload PDFs, trigger OCR pipeline     |
| GET    | `/api/documents/:id`            | Get document metadata                 |
| GET    | `/api/documents/:id/download`   | Download original file                |

### Dashboard

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/dashboard/kpis`           | Summary statistics                    |
| GET    | `/api/dashboard/activity`       | Recent agent activity feed            |
| GET    | `/api/dashboard/attention`      | Claims requiring human attention      |

### Insurers

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/insurers`                 | List configured insurer connections   |
| POST   | `/api/insurers`                 | Add new insurer connection            |
| POST   | `/api/insurers/:id/test`        | Test insurer connection               |

### Denials

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/denials`                  | List all denial cases                 |
| GET    | `/api/denials/stats`            | Denial analytics and reason breakdown |
| POST   | `/api/denials/:id/appeal`       | Trigger AI appeal generation          |

### Reports

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/reports/monthly`          | Monthly claims summary                |
| GET    | `/api/reports/insurer-perf`     | Insurer performance report            |
| GET    | `/api/reports/audit-log`        | Full audit trail                      |

---

## External APIs (Intended Integrations)

### Google Gemini API
- **Purpose**: LLM-based clinical structuring, ICD-10 code suggestion, denial appeal letter generation
- **SDK**: `@google/genai` v1.29.0 (installed)
- **Auth**: `GEMINI_API_KEY` environment variable
- **Status**: Not called

### OpenAI Whisper (via API)
- **Purpose**: Speech-to-text transcription of doctor-patient consultations
- **SDK**: None installed
- **Status**: Not implemented

### Tesseract.js or Cloud OCR
- **Purpose**: OCR extraction from uploaded PDF documents
- **Options**: `tesseract.js` (browser/Node), AWS Textract, Google Document AI
- **Status**: Not implemented

### n8n Webhook
- **Purpose**: Trigger workflow automation for submission to insurers
- **Integration point**: POST to n8n webhook URL after human approval
- **Status**: Not implemented

### Insurer APIs / Portals
- **Purpose**: Submit claims and receive approval/rejection responses
- **Reality**: Most Indian insurers (HDFC Ergo, Star Health) do not have public REST APIs. Portal submission via browser automation (Playwright) is the realistic approach.
- **Status**: Not implemented

---

## WebSocket (Intended)

For real-time claim status updates:

```
Client subscribes: ws://api/claims/updates
Server pushes: { claimId, status, message, timestamp }
```

Not implemented. Not installed.
