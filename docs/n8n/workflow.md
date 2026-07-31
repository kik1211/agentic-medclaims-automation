# ClaimPilot India — n8n Workflow Orchestration Guide

## 1. Overview
n8n acts as an **external orchestrator** for ClaimPilot India. The Express TypeScript backend remains the sole source of business logic, database persistence, and API endpoints. n8n sequences HTTP requests to the backend REST API across all processing stages.

```
Document Uploaded ──► OCR Extraction ──► Clinical LLM ──► Auto-Coding ──► Validation Engine
                                                                               │
                                                      ┌────────────────────────┴────────────────────────┐
                                                      ▼                                                 ▼
                                        [Approval Required: False]                         [Approval Required: True]
                                                      │                                                 │
                                        Playwright Portal Submission                       Route to Human Review Queue
```

---

## 2. Stateless Backend Guarantee
- **Zero Business Logic in n8n**: n8n only passes HTTP requests and parameters. Code parsing, LLM prompt engineering, ICD/CPT dictionary lookup, validation rules, and Playwright execution remain inside `backend/src/`.
- **Database Idempotency**: All backend endpoints check current claim status before executing state transitions, ensuring safe retries if n8n nodes fail.

---

## 3. n8n Node Sequence (`claim-workflow.json`)

1. **Webhook Trigger (`POST /claim-event`)**: Receives payload containing `claimId`, `documentId`, and `backendUrl`.
2. **Trigger OCR Extraction**: Calls `POST /api/documents/:documentId/ocr`.
3. **Trigger Clinical LLM Structuring**: Calls `POST /api/claims/:claimId/clinical-extract`.
4. **Trigger ICD-10 & CPT Auto-Coding**: Calls `POST /api/claims/:claimId/coding`.
5. **Trigger Claim Validation Engine**: Calls `POST /api/claims/:claimId/validate`.
6. **Check Human Review Requirement (IF Node)**: Evaluates `approval_required`.
   - **True**: Routes claim status to `READY_FOR_REVIEW`.
   - **False**: Triggers Playwright Portal Submission (`POST /api/claims/:claimId/submit`).

---

## 4. Webhook Trigger & Retry Endpoints

- **Orchestration Webhook Event**: `POST /api/webhooks/claim-event`
  ```json
  {
    "event": "START_WORKFLOW",
    "claimId": "clm_123456",
    "documentId": "doc_789012"
  }
  ```

- **Workflow Stage Retry Event**: `POST /api/webhooks/workflow-retry`
  ```json
  {
    "claimId": "clm_123456",
    "stage": "OCR" // "OCR" | "CLINICAL" | "CODING" | "VALIDATION" | "SUBMISSION"
  }
  ```

---

## 5. Failure Handling & Retries
- Every n8n node is configured with 3 automatic retries and exponential backoff.
- If a stage fails after retries, `POST /api/webhooks/workflow-retry` can re-execute the failed stage without resetting previous successful stages.
