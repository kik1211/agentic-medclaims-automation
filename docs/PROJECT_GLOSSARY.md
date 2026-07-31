# Project Glossary

> Definitions for all domain-specific, technical, and project-specific terms used across the codebase and documentation.

---

## Business / Domain Terms

### Aarogyasri
Government health insurance scheme of Andhra Pradesh and Telangana, India. Provides cashless treatment for below-poverty-line (BPL) families. Similar to CMCHIS but specific to AP/Telangana.

### Cashless Claim
A claim where the insurer directly pays the hospital, and the patient pays no out-of-pocket amount (beyond deductibles). Requires pre-authorization from the insurer. This is the primary claim type addressed by ClaimPilot.

### CMCHIS (Chief Minister's Comprehensive Health Insurance Scheme)
Government health insurance scheme for Tamil Nadu, India. Covers families earning below ₹72,000 per year. Administered through a network of government and private empanelled hospitals. Relevant because the demo hospital (Sri Ramakrishna Hospital) is in Coimbatore, Tamil Nadu.

### CPT Code (Current Procedural Terminology)
A standardized code set maintained by the American Medical Association (AMA) for describing medical, surgical, and diagnostic procedures. Used for claim billing. Example: `44950` = Appendectomy. Note: India typically uses ICD-10-PCS for procedure coding, not CPT — CPT is more common in US-context billing.

### Denial Recovery
The process of appealing a rejected insurance claim. Involves analyzing the rejection reason, correcting errors, and resubmitting. Screen7 (Denial Recovery Page) and Screens 14-15 represent this workflow.

### Discharge Authorization
Pre-approval from the insurer required before a patient can be discharged from the hospital for cashless treatment. Screen4 represents this workflow stage.

### DPDPA (Digital Personal Data Protection Act, 2023)
Indian law governing how personal data must be handled. Relevant to ClaimPilot because patient data (names, diagnoses, policy numbers) is processed. Compliance requirements include data encryption, audit logging, and user consent.

### Empanelment
The formal process by which a hospital gets listed/approved as a network hospital by an insurer or government scheme. An empanelment ID is a hospital's unique identifier in an insurer's system.

### Final Claim
The final billing submission to an insurer after a patient is discharged. Includes actual costs incurred vs. estimated costs from pre-authorization. Screen5 represents this workflow.

### HDFC Ergo
HDFC ERGO General Insurance Company — a major private health insurer in India (joint venture of HDFC and ERGO International). Uses RPA (browser automation) for portal submission in this project.

### ICD-10 (International Classification of Diseases, 10th Revision)
A system of alphanumeric codes maintained by the WHO for classifying diseases, symptoms, and causes of death. Used in medical records and insurance claims. Examples:
- `O80` = Normal delivery
- `O82` = Cesarean section
- `K35.80` = Acute appendicitis

### IRDAI (Insurance Regulatory and Development Authority of India)
The statutory body that regulates insurance companies in India. Sets guidelines for claim processing timelines and documentation requirements. Screen9 references IRDAI compliance.

### NABH (National Accreditation Board for Hospitals)
Accreditation body for hospitals in India. NABH-accredited hospitals often receive better empanelment rates. Relevant to coding standards used in claims.

### PM-JAY (Pradhan Mantri Jan Arogya Yojana / Ayushman Bharat)
Central government health insurance scheme covering 500 million+ Indians. Provides coverage of up to ₹5 lakh per family per year. Claims submitted through the NHA (National Health Authority) portal.

### Pre-Authorization (Pre-Auth)
Approval required from an insurer before a planned medical procedure. The hospital submits patient details, diagnosis, and procedure plan. The insurer approves or rejects. Screen3 and Screen3A represent this workflow.

### SBI General
SBI General Insurance — insurance arm of State Bank of India. One of the major insurers in India.

### Star Health
Star Health and Allied Insurance — India's largest standalone health insurer. Serves both corporate and individual customers.

### TPA (Third-Party Administrator)
An intermediary between hospitals and insurance companies. Handles claim processing, verification, and settlement on behalf of insurers. Examples: Medi Assist, Health India TPA, Raksha Health Insurance TPA. Screen9 (Settings) and Screen16 (Add Insurer) reference TPA configuration.

---

## Technical Terms

### ArrowsOverlay
A React component in `App.tsx` that renders SVG Bezier curves between screen elements on the wireframe canvas. Represents navigation flow visually.

### Bezier Curve (Cubic)
A smooth curve defined by 4 control points. Used by `ArrowsOverlay` to draw navigation arrows: `M startX startY C cp1x cp1y, cp2x cp2y, endX endY`.

### Canvas Container
The outer `div#canvas-container` in `App.tsx` — a scrollable viewport over the 8000×6000px wireframe canvas.

### ClaimPilot India
The product name used in this project.

### Connections Array
The `connections[]` array in `App.tsx` that maps button IDs to screen IDs, driving the SVG arrow overlay.

### Document AI
Google Cloud Document AI — a cloud API for structured data extraction from documents (PDFs, images). An alternative to Tesseract.js for OCR.

### Extraction Confidence
A percentage shown on Screen3A ("Extraction Confidence: 94%"). Represents the AI system's confidence in the accuracy of OCR + clinical structuring output. Not currently calculated — hardcoded as a demo value.

### Gemini
Google's large language model family. The `@google/genai` SDK in this project is intended to call Gemini models for clinical structuring and denial appeal generation.

### Human-in-the-Loop (HITL)
A workflow design pattern where an AI system processes data but pauses for human review before taking consequential actions. Screen12, Screen14, and Screen15 represent HITL checkpoints in the claim workflow.

### ICD-10 Code Conflict
When a diagnosis code and procedure code are medically inconsistent. Example: Screen15 shows diagnosis O80 (Normal Delivery) conflicting with a C-Section procedure — these should be O82 (Cesarean Section) and the C-Section procedure code.

### n8n
An open-source workflow automation platform. Used to orchestrate the claim submission pipeline: receiving webhooks from the backend, triggering Playwright scripts, and coordinating multi-step automation.

### OCR (Optical Character Recognition)
Technology that converts images of text (scanned PDFs, photos) into machine-readable text strings. The foundation of the document extraction pipeline.

### Playwright
Microsoft's browser automation library for Node.js. Intended use in this project: automating insurer web portals that do not have REST APIs (e.g., HDFC Ergo portal submission, referred to as "RPA" in the Settings screen).

### RPA (Robotic Process Automation)
Automating repetitive tasks that normally require human interaction with a UI (like filling forms in a browser). In ClaimPilot, RPA = Playwright-based automation of insurer web portals.

### Screen Container
The `ScreenContainer` React component — a fixed 1024×768px bordered frame that wraps each wireframe screen on the canvas.

### SQLite
A file-based relational database. `better-sqlite3` is the Node.js library installed for this. Suitable for MVP; would need to migrate to PostgreSQL for production scale.

### Vite
A modern JavaScript build tool. Serves the React app during development and bundles it for production. Configured in `vite.config.ts`.

### Whisper
OpenAI's open-source speech-to-text model. Planned for converting doctor-patient audio consultations into medical transcripts. Not yet implemented.

### Wireframe
A low-fidelity visual representation of a UI. In this project, the entire application IS the wireframe — a visual prototype intended for stakeholder review, not end-user operation.

---

## Project-Specific Terms

### Screen N (Screen numbering)
Screens are numbered 1–16 with gaps (Screen3A is a variant). The numbering reflects design iteration order during the hackathon, not the navigation order in the application.

### Processing State
The UI state shown in Screen3A where documents are being extracted and validated. Represented by spinning loaders and sequential step indicators.

### Missing Data Screen
Screen12 — appears when the AI's OCR + validation detects required fields that are absent or unreadable in the uploaded documents. Triggers a human-in-the-loop pause.

### Agent Active
The animated indicator in `WireHeader` showing that the AI processing agent is running. Currently purely cosmetic (the pulsing dot always animates regardless of actual system state).

### Claims Pipeline
The master view (Screen6) showing all claims across all stages in a single paginated table. The central management interface for hospital billing staff.

### Denial Case
A claim that has been rejected by an insurer. Screen7 tracks active denial cases and their AI recovery status.

### Escalation
The act of moving a claim from automated AI processing to manual human review. Triggered when AI cannot resolve a denial after multiple attempts (e.g., Screen14).
