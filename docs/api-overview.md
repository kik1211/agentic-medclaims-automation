# ClaimPilot India — API Reference Overview

## Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://api.claimpilot.in`

---

## Response Contract Standard
Every API response adheres strictly to the standardized envelope contract:

### Success Response Format (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-07-30T19:00:00.000Z",
  "requestId": "5b966208-ad38-42aa-ab08-445cf90b84f1"
}
```

### Error Response Format (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error message"
  },
  "timestamp": "2026-07-30T19:00:00.000Z",
  "requestId": "5b966208-ad38-42aa-ab08-445cf90b84f1"
}
```

---

## Active Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health status & uptime | No |
| `GET` | `/ready` | Database & Redis readiness probe | No |
| `GET` | `/metrics` | Telemetry request metrics & RAM usage | No |
| `GET` | `/api/docs` | Swagger UI OpenAPI specification | No |
| `POST` | `/api/auth/register` | Register user account | No |
| `POST` | `/api/auth/login` | Authenticate credentials & issue JWT | No |
| `GET` | `/api/claims` | List hospital insurance claims | Yes |
| `POST` | `/api/claims` | Create new claim record | No |
| `POST` | `/api/documents/upload` | Upload document file (PDF/PNG/JPEG) | Yes |
| `POST` | `/api/documents/:id/ocr` | Trigger Tesseract.js OCR extraction | Yes |
| `POST` | `/api/claims/:id/clinical-extract` | Trigger Gemini LLM clinical structuring | Yes |
| `POST` | `/api/claims/:id/coding` | Auto-code ICD-10 & CPT medical codes | Yes |
| `POST` | `/api/claims/:id/validate` | Evaluate Claim Validation Policy Rules | Yes |
| `GET` | `/api/review/pending` | List claims requiring human review | Yes (`REVIEWER`) |
| `POST` | `/api/review/:claimId/approve` | Approve claim (`APPROVED_BY_REVIEWER`) | Yes (`REVIEWER`) |
| `POST` | `/api/review/:claimId/reject` | Reject claim (`REJECTED_BY_REVIEWER`) | Yes (`REVIEWER`) |
| `POST` | `/api/claims/:id/submit` | Submit claim via Playwright Portal Adapter | Yes |
| `POST` | `/api/webhooks/claim-event` | n8n Orchestration trigger webhook | No |
| `POST` | `/api/webhooks/workflow-retry` | Retry failed workflow stage | No |
