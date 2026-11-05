# ClaimPilot India — Known Limitations & Technical Constraints

This document provides an engineering evaluation of the current technical constraints, architectural trade-offs, and implementation boundaries of ClaimPilot India.

---

## 1. Architectural & Infrastructure Limitations

### Single-Host SQLite Database
- **Current State**: The operational database is SQLite (`claimpilot.db`) using `better-sqlite3` with Write-Ahead Logging (`WAL`).
- **Limitation**: While well-suited for single-process deployments, development, and low-to-medium hospital concurrency, SQLite does not support distributed multi-instance horizontal scaling, network replication, or connection clustering.
- **PostgreSQL Abstraction Status**: The `DatabaseAbstractionLayer` (`backend/src/config/postgres.ts`) provides configuration interfaces for PostgreSQL, but query execution currently runs against SQLite.

### In-Memory Task Processing & Queue Persistence
- **Current State**: Background asynchronous execution (such as document OCR extraction) is handled via `OcrWorkerQueue` (`backend/src/workers/ocr.worker.ts`) using Node.js `setImmediate`.
- **Limitation**: Tasks are held in process memory. If the backend server restarts or crashes while jobs are queued, pending tasks are lost and must be re-triggered manually via `POST /api/documents/:id/ocr`.
- **Redis / BullMQ Status**: The BullMQ queue architecture and Redis configuration (`backend/src/config/redis.ts`) exist as design templates. Redis currently operates in in-memory development fallback mode.

---

## 2. AI & Domain Service Limitations

### Medical Coding via Static Dictionaries
- **Current State**: `IcdService` and `CptService` map diagnoses and procedures using static TypeScript lookup tables (10 ICD-10 codes and 9 CPT codes) and basic regex string matching.
- **Limitation**: Diagnostic coding does not utilize dynamic semantic vector search, full WHO ICD-10/11 databases, or licensed AMA CPT datasets. Diagnoses outside the dictionary map to generic fallback codes (`R69` for unspecified diagnosis, `99214` for evaluation/management).

### Mocked Portal Submission Automation
- **Current State**: The portal submission layer implements `IPortalAdapter` (`backend/src/submission/portal.adapter.ts`) using `MockPortalAdapter`.
- **Limitation**: The adapter logs simulated submission steps and returns a generated synthetic reference number (`REF_SUB_<timestamp>_<id>`). Live browser automation interacting with actual insurer portals (e.g. Star Health, PM-JAY) using Playwright headless sessions is not implemented.

### Speech Recognition (Whisper) Unimplemented
- **Current State**: Speech recognition is referenced in type definitions (`whisper_model`).
- **Limitation**: There is no audio recording, file upload pipeline, or speech-to-text inference integration (OpenAI Whisper or local `whisper.cpp`). Ingestion is currently restricted to document uploads (`PDF`, `PNG`, `JPEG`).

### Denial Analysis & Appeals
- **Current State**: Denial management exists as frontend wireframe screens (`src/pages/DenialPage.tsx`, `src/screens/DenialScreens.tsx`).
- **Limitation**: The backend does not implement automated denial prediction, root-cause categorization, or LLM-generated appeal letters.

---

## 3. Security & Operational Limitations

### Client-Side API Key Exposure Risk in Vite Configuration
- **Current State**: The frontend build script (`vite.config.ts`) defines:
  ```typescript
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  }
  ```
- **Limitation**: If `GEMINI_API_KEY` is present in the root `.env` during `npm run build`, Vite will inject the raw API key directly into the public client JavaScript bundle.
- **Mitigation**: All production LLM extraction calls are executed server-side via `backend/src/llm/gemini.service.ts`. The root `.env` should not contain the Gemini API key; it should only be configured in `backend/.env`.

### Real-Time Telemetry & WebSocket Updates
- **Current State**: Claim status transitions and dashboard metrics are fetched via standard HTTP REST queries.
- **Limitation**: Real-time push notifications over WebSockets or Server-Sent Events (SSE) are not implemented. Users must refresh or poll endpoints to observe state changes.

### Automated Test Coverage
- **Current State**: Testing is currently performed via manual walkthroughs and API probe verification (`/health`, `/ready`, `/metrics`).
- **Limitation**: Automated unit test suites (Vitest/Jest), integration test suites, and end-to-end browser automation suites are not yet established in the repository.
