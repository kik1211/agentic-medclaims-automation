# ClaimPilot India — System Architecture & Design Specification

## 1. High-Level System Architecture

ClaimPilot India is designed as a modular, monolithic Express and TypeScript platform for hospital claims processing, integrating document OCR, LLM-based clinical structuring, rule-based medical coding, validation rules, human-in-the-loop review, and automated portal submission.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & Orchestration Layer"]
        UI["React Dashboard (Vite + TypeScript)"]
        N8N["n8n Workflow Engine (External Webhooks)"]
    end

    subgraph APILayer ["Backend API Gateway (Express & TypeScript)"]
        AUTH["Authentication & RBAC (JWT + bcrypt)"]
        OBS["Observability & Probes (/health, /ready, /metrics)"]
        SWAGGER["OpenAPI 3.0 Documentation (/api/docs)"]
    end

    subgraph ServiceLayer ["Business Domain Services"]
        OCR["Document OCR (pdf-parse + Tesseract.js)"]
        LLM["Clinical Extraction (Gemini 2.5 Flash + Fallback)"]
        CODING["Medical Coding Engine (ICD-10 & CPT Dictionaries)"]
        VAL["Claim Validation Engine (Policy Rules)"]
        REV["Human Review & Audit Module"]
        SUB["Portal Submission Engine (Mock Adapters)"]
    end

    subgraph TaskLayer ["Background Task Processing"]
        WORKER["In-Process Task Queue (setImmediate)"]
        REDIS_STUB["Redis / BullMQ Layer (Architecture Target / Stubbed)"]
    end

    subgraph PersistenceLayer ["Persistence & Storage"]
        DB[("SQLite Database (better-sqlite3, WAL mode)")]
        STORAGE["Local Disk Document Storage (uploads/)"]
    end

    UI --> AUTH
    N8N --> APILayer
    APILayer --> ServiceLayer
    ServiceLayer --> WORKER
    ServiceLayer --> DB
    ServiceLayer --> STORAGE
    WORKER --> ServiceLayer
```

---

## 2. Multi-Layer Backend Design

The backend enforces strict separation of concerns across four discrete layers:

```mermaid
graph TD
    Client["Client Request (REST API / n8n Webhook)"] --> Controller["Controller Layer (Express Handlers)"]
    Controller --> Validation["Validation Middleware (Zod Schemas)"]
    Validation --> Service["Service Layer (Domain Business Logic)"]
    Service --> Repository["Repository Layer (SQL Queries via better-sqlite3)"]
    Repository --> Database[("Database (claimpilot.db)")]
```

1. **Controller Layer** (`backend/src/controllers/`): Handles HTTP transport, parses incoming requests, delegates to service classes, and serializes responses via a standardized envelope (`SuccessResponse<T>` / `ErrorResponse`).
2. **Middleware & Validation** (`backend/src/middleware/`, `backend/src/schemas/`): Enforces JWT authentication, role-based authorization (`ADMIN`, `REVIEWER`, `OPERATOR`), request ID tracing, structured request/error logging, and strict Zod schema validation.
3. **Service Layer** (`backend/src/services/`, `backend/src/ocr/`, `backend/src/llm/`, `backend/src/coding/`, `backend/src/validation/`, `backend/src/review/`, `backend/src/submission/`): Implements all business rules, LLM prompting, OCR execution, rule evaluation, and workflow state transitions.
4. **Repository Layer** (`backend/src/repositories/`): Isolates SQL operations and database access behind typed interfaces using parameterized queries.

---

## 3. End-to-End Claim Lifecycle & State Machine

The processing pipeline coordinates claim transitions sequentially. Each stage reads from SQLite, executes its business logic, updates output columns, and advances the claim status.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Claim record
    DRAFT --> DOCUMENTS_UPLOADED: Document file uploaded
    DOCUMENTS_UPLOADED --> OCR_COMPLETE: OCR text extracted
    OCR_COMPLETE --> CLINICAL_EXTRACTED: Clinical structuring (Gemini / Fallback)
    CLINICAL_EXTRACTED --> AUTO_CODED: ICD-10 & CPT mapping
    AUTO_CODED --> VALIDATED: Validation passed (no warnings)
    AUTO_CODED --> READY_FOR_REVIEW: Validation requires review (warnings / high value)
    
    READY_FOR_REVIEW --> APPROVED_BY_REVIEWER: Reviewer approves
    READY_FOR_REVIEW --> REJECTED_BY_REVIEWER: Reviewer rejects
    VALIDATED --> APPROVED_BY_REVIEWER: Auto-approval path
    
    APPROVED_BY_REVIEWER --> SUBMITTED: Portal submission executed
    SUBMITTED --> [*]
```

### State Classification

| State | Implementation Status | Triggering Component | Description |
| :--- | :--- | :--- | :--- |
| `DRAFT` | **Implemented** | `ClaimController.create` | Initial claim record created. |
| `DOCUMENTS_UPLOADED` | **Implemented** | `DocumentController.upload` | At least one PDF/image attached. |
| `OCR_COMPLETE` | **Implemented** | `OcrService.processDocumentOcr` | Raw text extracted via pdf-parse or Tesseract.js. |
| `CLINICAL_EXTRACTED` | **Implemented** | `ClinicalService.structureClaimClinicalData` | Clinical JSON generated via Gemini (or regex fallback). |
| `AUTO_CODED` | **Implemented** | `CodingService.processClaimCoding` | Primary/secondary ICD-10 and CPT codes assigned. |
| `VALIDATED` | **Implemented** | `ValidationService.validateClaim` | Policy rules evaluated with zero approval triggers. |
| `READY_FOR_REVIEW` | **Implemented** | `ValidationService.validateClaim` | Claim flagged for human review (policy warnings or thresholds). |
| `APPROVED_BY_REVIEWER` | **Implemented** | `ReviewController.approveClaim` | Medical reviewer approved the claim payload. |
| `REJECTED_BY_REVIEWER` | **Implemented** | `ReviewController.rejectClaim` | Medical reviewer rejected the claim with recorded refusal notes. |
| `SUBMITTED` | **Implemented** | `SubmissionService.submitClaim` | Submission executed via portal adapter; reference ID generated. |
| `INSURER_APPROVED` | *Planned* | Insurer Callback / Scraper | Final claim settlement confirmed by insurer. |
| `INSURER_REJECTED` | *Planned* | Insurer Callback / Scraper | Claim rejected by insurer portal. |
| `DENIAL_ANALYSIS_IN_PROGRESS` | *Planned* | Denial Appeal Engine | Automated extraction and appeal generation for rejected claims. |

---

## 4. Processing Modules Overview

The pipeline comprises six core domain components:

### M1: Document Intelligence & OCR (`backend/src/ocr/`)
- Accepts PDF, PNG, and JPEG documents up to 20MB.
- Uses `pdf-parse` for fast text extraction from digital PDFs.
- Falls back to `tesseract.js` worker (`eng` language trained data) for scanned files or image payloads.
- Results are stored in the `documents` table (`ocr_text`, `ocr_status`, `ocr_completed_at`).

### M2: Clinical Data Structuring (`backend/src/llm/`)
- Concatenates OCR text across all completed claim documents.
- Prompts Google Gemini (`gemini-2.5-flash`) via the `@google/genai` SDK with strict JSON response constraints (`responseMimeType: "application/json"`).
- Extracts patient demographics, clinical summary, diagnosis strings, procedures, and claimed amounts.
- **Offline / Fallback Mechanism**: If `GEMINI_API_KEY` is not configured, a deterministic regex extraction engine executes locally, ensuring offline testability and resilience.
- Output is validated using Zod (`JsonValidator`) and persisted in `claims.clinical_json`.

### M3: Medical Auto-Coding Engine (`backend/src/coding/`)
- Maps clinical diagnosis strings to ICD-10-CM codes (`IcdService`).
- Maps procedure strings to CPT procedure codes (`CptService`).
- Implemented via curated medical dictionaries with regex matching and confidence scoring.
- Flags unlisted entries with fallback codes (`R69` for unspecified illness, `99214` for evaluation/management).
- Persisted in `claims.coding_json`.

### M4: Claim Validation Engine (`backend/src/validation/`)
- Evaluates extracted and coded data against deterministic hospital and insurer policy rules:
  - Patient demographic completeness (name, age, gender).
  - Diagnostic and procedural code presence.
  - Claim amount caps and reasonable hospital tariff ranges.
  - Minimum coding confidence thresholds (triggers review if confidence < 80%).
  - Required supporting document verification (discharge summary, lab reports).
- Determines whether the claim can proceed directly or must route to `READY_FOR_REVIEW`.
- Persisted in `claims.validation_json`.

### M5: Human Review & Audit Workspace (`backend/src/review/`)
- Dedicated review queue (`GET /api/review/pending`) restricted to users with the `REVIEWER` role.
- Allows human hospital billing and medical officers to inspect clinical JSON, suggested codes, validation warnings, and source documents.
- Records structured decisions (`APPROVED_BY_REVIEWER` or `REJECTED_BY_REVIEWER`) with reviewer ID, timestamp, and comments into `review_history` and `audit_logs`.

### M6: Portal Submission Engine (`backend/src/submission/`)
- Uses an adapter interface (`IPortalAdapter`) to route claims based on insurer code.
- Current implementation uses `MockPortalAdapter` to simulate portal interaction, generate timestamped execution logs, and assign a unique tracking reference (`REF_SUB_...`).
- Persisted in `claims.submission_reference` and `claims.submission_json`.

---

## 5. Database Schema & Entity Relationships

The operational database is SQLite (`claimpilot.db`) managed via `better-sqlite3` with foreign key enforcement and Write-Ahead Logging (`WAL`) enabled.

```mermaid
erDiagram
    HOSPITALS ||--o{ USERS : employs
    HOSPITALS ||--o{ CLAIMS : files
    USERS ||--o{ CLAIMS : creates
    USERS ||--o{ REVIEW_HISTORY : reviews
    USERS ||--o{ AUDIT_LOGS : performs
    CLAIMS ||--o{ DOCUMENTS : contains
    CLAIMS ||--o{ REVIEW_HISTORY : records
    CLAIMS ||--o{ AUDIT_LOGS : tracks

    HOSPITALS {
        string id PK
        string name
        string code UK
        string created_at
    }

    USERS {
        string id PK
        string hospital_id FK
        string email UK
        string password_hash
        string name
        string role
        string created_at
    }

    CLAIMS {
        string id PK
        string hospital_id FK
        string created_by FK
        string claim_type
        string insurer_code
        string policy_number
        string status
        string clinical_json
        string coding_json
        string validation_json
        string submission_reference
        string submission_json
        string created_at
        string updated_at
    }

    DOCUMENTS {
        string id PK
        string claim_id FK
        string file_name
        string file_path
        string file_size
        string mime_type
        string document_type
        string ocr_status
        string ocr_text
        string ocr_started_at
        string ocr_completed_at
        string ocr_error
        string created_at
    }

    REVIEW_HISTORY {
        string id PK
        string claim_id FK
        string reviewer_id FK
        string decision
        string comments
        string created_at
    }

    AUDIT_LOGS {
        string id PK
        string claim_id FK
        string user_id FK
        string action
        string details
        string ip_address
        string created_at
    }
```

---

## 6. Asynchronous Task Processing & Queue Architecture

```mermaid
flowchart LR
    Upload["Document Upload / API Call"] --> Queue["OcrWorkerQueue (In-Process)"]
    Queue --> Process["setImmediate Event Loop Processing"]
    Process --> Engine["Tesseract OCR / Domain Service"]
    Engine --> Persist["SQLite DB Update"]
```

- **Current Implementation**: Asynchronous tasks (such as background OCR upon file upload) are managed through an in-process worker queue (`backend/src/workers/ocr.worker.ts`) using Node.js `setImmediate`.
- **Target Architecture**: Configuration stubs exist for Redis (`backend/src/config/redis.ts`) and BullMQ queue definitions (`backend/src/jobs/`). In the current development deployment, Redis runs in fallback mode and background jobs execute within the Node.js process.
