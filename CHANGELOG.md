# Changelog

All notable changes to the **ClaimPilot India** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-30

### Added
- **Milestone M1**: Established core project layout, Vite React frontend, vanilla CSS design tokens, and modular folder structure.
- **Milestone M2**: Implemented responsive navigation layout, claim list view, claim detail view, and canonical domain data models.
- **Milestone M3.1 - M3.5**: Established Express TypeScript backend, SQLite database persistence layer, repository pattern, error middleware, JWT authentication, and bcrypt password hashing.
- **Milestone M4.1**: Implemented document upload storage (`diskStorageService`) and document metadata repository.
- **Milestone M4.2**: Implemented background Tesseract.js OCR extraction pipeline for PDF and image documents.
- **Milestone M4.3**: Integrated Gemini LLM clinical document structuring into validated JSON (`ClinicalDocumentDataSchema`).
- **Milestone M4.4**: Implemented ICD-10-CM and CPT medical auto-coding engine (`IcdService`, `CptService`) with confidence scoring.
- **Milestone M4.5**: Implemented Claim Validation Engine and policy rules engine (`RequiredFieldsRule`, `ClaimAmountRule`, `CodingConfidenceRule`).
- **Milestone M5.1**: Created Human Review & Approval module (`READY_FOR_REVIEW`, `APPROVED_BY_REVIEWER`, `REJECTED_BY_REVIEWER`, `INFO_REQUESTED`) with persistent audit trails.
- **Milestone M5.2**: Created Playwright Portal Submission Engine with `IPortalAdapter` and `MockPortalAdapter` generating portal reference IDs (`submission_reference`).
- **Milestone M6**: Integrated n8n workflow orchestration webhooks (`POST /api/webhooks/claim-event`, `POST /api/webhooks/workflow-retry`).
- **Milestone M7**: Production infrastructure readiness with multi-stage Docker containerization (`Dockerfile.backend`, `Dockerfile.frontend`), `docker-compose.yml`, BullMQ background task queues, PostgreSQL/SQLite dual-mode DB abstraction, Swagger UI documentation (`/api/docs`), and telemetry probes (`/health`, `/ready`, `/metrics`).
- **Milestone M8**: Comprehensive GitHub open-source documentation, Mermaid architecture diagrams, developer guides, and issue templates.
