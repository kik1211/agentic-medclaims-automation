# ClaimPilot India — System Architecture & Design Specification

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer"]
        UI["Vite / React Frontend Dashboard"]
        n8n["n8n Workflow Engine"]
    end

    subgraph APILayer ["Backend API Gateway (Express & TypeScript)"]
        AUTH["Authentication & RBAC Middleware"]
        METRICS["Observability & Telemetry (/metrics, /health, /ready)"]
        SWAGGER["OpenAPI 3.0 Swagger UI (/api/docs)"]
    end

    subgraph ServiceLayer ["Business Domain Services"]
        OCR["OCR Processing Service (Tesseract.js)"]
        LLM["Clinical Extraction Service (Gemini LLM)"]
        CODING["Medical Coding Engine (ICD-10 & CPT)"]
        VAL["Claim Validation Engine (Policy Rules)"]
        REV["Human Review & Approval Module"]
        SUB["Playwright Portal Submission Engine"]
    end

    subgraph AsyncQueue ["Async Queue Layer (BullMQ & Redis)"]
        Q_OCR["OCR Queue"]
        Q_LLM["Clinical LLM Queue"]
        Q_CODE["Coding Queue"]
        Q_VAL["Validation Queue"]
        Q_SUB["Submission Queue"]
    end

    subgraph PersistenceLayer ["Persistence Layer"]
        DB[("Database (PostgreSQL / SQLite3)")]
        STORAGE["Disk Storage (PDF / PNG / JPEG)"]
    end

    UI --> AUTH
    n8n --> APILayer
    APILayer --> ServiceLayer
    ServiceLayer --> AsyncQueue
    ServiceLayer --> DB
    ServiceLayer --> STORAGE
```

---

## 2. Multi-Layer Backend Architecture

```mermaid
graph TD
    Client["HTTP Client / n8n Webhook"] --> Controller["Controller Layer (Express Handlers)"]
    Controller --> Validation["Middleware (Zod Schema Validation)"]
    Validation --> Service["Service Layer (Business Logic)"]
    Service --> Repository["Repository Layer (SQL Queries)"]
    Repository --> Database[("Database Layer (PostgreSQL / SQLite3)")]
```

---

## 3. End-to-End Claim Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Claim
    DRAFT --> OCR_COMPLETE: Upload Document & Extract OCR
    OCR_COMPLETE --> CLINICAL_EXTRACTED: Gemini LLM Structuring
    CLINICAL_EXTRACTED --> AUTO_CODED: ICD-10 & CPT Mapping
    AUTO_CODED --> VALIDATED: Validation Engine (No Warnings)
    AUTO_CODED --> READY_FOR_REVIEW: Validation Engine (Warnings / Low Confidence)
    
    READY_FOR_REVIEW --> APPROVED_BY_REVIEWER: Reviewer Approval
    READY_FOR_REVIEW --> REJECTED_BY_REVIEWER: Reviewer Rejection
    READY_FOR_REVIEW --> INFO_REQUESTED: Reviewer Requests Info
    
    INFO_REQUESTED --> READY_FOR_REVIEW: Info Provided
    VALIDATED --> APPROVED_BY_REVIEWER: Auto / Expedited Approval
    APPROVED_BY_REVIEWER --> SUBMITTED: Playwright Portal Submission
    SUBMITTED --> [*]
```

---

## 4. Queue Architecture (BullMQ & Redis)

```mermaid
flowchart LR
    Webhook["Webhook Controller"] --> AddJob["QueueService.addJob()"]
    AddJob --> Redis[("Redis Broker")]
    Redis --> Worker["BackgroundWorker.processJob()"]
    Worker --> DomainService["Domain Service Execution"]
    DomainService --> DB[("Database")]
```

---

## 5. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    HOSPITAL ||--o{ USER : employs
    HOSPITAL ||--o{ CLAIM : submits
    USER ||--o{ CLAIM : reviews
    CLAIM ||--o{ DOCUMENT : contains
    CLAIM ||--o{ REVIEW_HISTORY : records
    CLAIM ||--o{ AUDIT_LOG : generates

    HOSPITAL {
        string id PK
        string name
        string code UK
    }

    USER {
        string id PK
        string hospital_id FK
        string email UK
        string password_hash
        string role
    }

    CLAIM {
        string id PK
        string hospital_id FK
        string claim_type
        string status
        string clinical_json
        string coding_json
        string validation_json
        string submission_reference
    }

    DOCUMENT {
        string id PK
        string claim_id FK
        string file_name
        string ocr_text
        string ocr_status
    }

    REVIEW_HISTORY {
        string id PK
        string claim_id FK
        string reviewer_id FK
        string decision
        string comments
    }

    AUDIT_LOG {
        string id PK
        string claim_id FK
        string user_id FK
        string action
        string details
    }
```
