# Pipeline Architecture
# ClaimPilot India — Modular Processing System Design

**Version**: 1.0  
**Status**: Architecture Design (Pre-Implementation)  
**Scope**: Backend processing modules only — the React UI remains unchanged

---

## Governing Principles

1. **Every module is independently testable.** A module can be exercised by providing a `claimId` with the correct pre-conditions in the database. No module requires another module to be running.

2. **Modules communicate through shared state, not direct calls.** Each module reads what it needs from the database, does its work, and writes its output back. Downstream modules are triggered by the state change, not by the upstream module calling them directly.

3. **The claim is the unit of work.** Every module operates on a single claim. There are no batch operations in the module layer.

4. **Failure is a first-class state.** Every module defines what failure looks like, what should be retried, and what requires a human. No module silently discards errors.

5. **Deployment simplicity is preserved.** Everything runs as a single Express process. The modular structure is a code organization principle, not a microservices architecture.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Express API Server                            │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Claim State Machine                           │  │
│  │         (Central coordinator — all state in SQLite)             │  │
│  └───────────────────────────┬─────────────────────────────────────┘  │
│                               │                                        │
│  ┌────────────┐  ┌────────────▼───────────┐  ┌────────────────────┐  │
│  │  M1        │  │  M2                     │  │  M3                │  │
│  │  Speech    │  │  Document               │  │  Clinical          │  │
│  │  Intell.   │  │  Intelligence           │  │  Structuring       │  │
│  └────────────┘  └────────────────────────┘  └────────────────────┘  │
│                                                                        │
│  ┌────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
│  │  M4        │  │  M5                     │  │  M6                │  │
│  │  Medical   │  │  Claim                  │  │  Workflow          │  │
│  │  Coding    │  │  Validation             │  │  Orchestration     │  │
│  └────────────┘  └─────────────────────────┘  └────────────────────┘  │
│                                                                        │
│  ┌────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
│  │  M7        │  │  M8                     │  │  M9                │  │
│  │  Human     │  │  Submission             │  │  Analytics         │  │
│  │  Review    │  │  Automation             │  │                    │  │
│  └────────────┘  └─────────────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                               │
                         ┌─────▼─────┐
                         │  SQLite   │
                         │ (claims,  │
                         │  docs,    │
                         │  audit)   │
                         └───────────┘
```

---

## The Claim State Machine

The state machine is the architectural backbone. Every module reads the current state and writes the next state. This is what makes modules independently testable — you can put a claim into any state and test the module that handles that state.

### State Definitions

```
CREATED
  └─► DOCUMENTS_UPLOADED
        └─► OCR_IN_PROGRESS
              ├─► OCR_FAILED           (retry → OCR_IN_PROGRESS)
              └─► OCR_COMPLETE
                    └─► STRUCTURING_IN_PROGRESS
                          ├─► STRUCTURING_FAILED    (retry → STRUCTURING_IN_PROGRESS)
                          └─► STRUCTURING_COMPLETE
                                └─► CODING_IN_PROGRESS
                                      ├─► CODING_FAILED    (retry → CODING_IN_PROGRESS)
                                      └─► CODING_COMPLETE
                                            └─► VALIDATION_IN_PROGRESS
                                                  ├─► VALIDATION_FAILED_MISSING_DATA
                                                  │     └─► AWAITING_HUMAN_DATA_ENTRY
                                                  │           └─► DATA_ENTRY_COMPLETE
                                                  │                 └─► VALIDATION_IN_PROGRESS
                                                  └─► VALIDATION_PASSED
                                                        └─► AWAITING_HUMAN_APPROVAL
                                                              ├─► HUMAN_APPROVED
                                                              │     └─► SUBMISSION_QUEUED
                                                              │           ├─► SUBMISSION_IN_PROGRESS
                                                              │           │     ├─► SUBMISSION_FAILED   (retry → SUBMISSION_QUEUED)
                                                              │           │     └─► SUBMITTED
                                                              │           │           ├─► INSURER_APPROVED
                                                              │           │           │     └─► COMPLETE
                                                              │           │           └─► INSURER_REJECTED
                                                              │           │                 └─► DENIAL_ANALYSIS_IN_PROGRESS
                                                              │           │                       ├─► DENIAL_RESUBMIT_QUEUED
                                                              │           │                       └─► DENIAL_ESCALATED
                                                              └─► HUMAN_REJECTED
                                                                    └─► ABANDONED
```

### State Transition Rules

- Only one module may write a state transition at a time (enforced by the claim being locked during processing)
- State always moves forward — no backward transitions except via human override
- Every state transition is written to `audit_log` with timestamp, actor, and reason
- A claim cannot be deleted — only abandoned or archived

---

## Module Contracts

Every module in this system implements this interface:

```
Module.process(claimId: string) → ProcessingResult

ProcessingResult:
  success: boolean
  nextState: ClaimState
  output: ModuleOutput        // specific to each module
  errors: ProcessingError[]
  warnings: ProcessingWarning[]
  requiresHumanReview: boolean
  humanReviewReason?: string
```

This contract is what makes each module independently unit-testable.

---

## Module 1: Speech Intelligence

**Resume claim this maps to**: Whisper-based transcription

---

### Purpose

Convert recorded doctor-patient consultation audio into a structured medical transcript. This is the earliest possible entry point into the system — before any PDF documents exist. It is an optional input path; claims can also enter via document upload (M2).

---

### Input

```
claimId:      string     — pre-created claim record in CREATED state
audioFilePath: string    — path to uploaded audio file (WAV, MP3, M4A)
audioFormat:  string
durationSeconds: number
speakerCount: number     — 1 (doctor dictation) or 2 (consultation)
languageHint: string     — 'en-IN', 'ta-IN', 'te-IN', 'hi-IN'
```

**Precondition**: Claim exists in `CREATED` state. Audio file is accessible on disk.

---

### Output

Written to `documents` table with `document_type = 'TRANSCRIPT'`:

```
rawTranscript:         string   — full text as returned by Whisper
speakerSegments:       array    — [{speaker, startTime, endTime, text}]
detectedLanguage:      string
confidenceScore:       number   — 0.0 to 1.0
durationProcessed:     number   — seconds of audio successfully processed
clinicalKeywords:      string[] — keywords extracted pre-structuring
transcriptWordCount:   number
```

---

### Internal Workflow

```
1. Validate audio file exists and is within size limits (max 25MB)
2. Detect or confirm language from languageHint
3. Submit to Whisper API (OpenAI) or whisper.cpp (local)
   - If audio > 25MB: split into 10-minute chunks, process sequentially, merge
4. Receive raw transcript segments with timestamps
5. If speakerCount = 2: apply speaker diarization heuristic
   (alternating segments, keyword-based role detection: "doctor", "patient")
6. Extract clinical keyword candidates using regex patterns:
   - symptom verbs: "complaining of", "presenting with", "diagnosed with"
   - medication patterns: drug names, dosage formats
   - procedure mentions: "will undergo", "scheduled for"
7. Write transcript to documents table
8. Update claim state: CREATED → DOCUMENTS_UPLOADED
9. Automatically trigger M2 (Document Intelligence) with transcript as input
```

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `AUDIO_FILE_NOT_FOUND` | File path invalid or deleted | Terminal — notify operator |
| `AUDIO_FORMAT_UNSUPPORTED` | Non-audio file submitted | Terminal — user must re-upload |
| `WHISPER_API_TIMEOUT` | API did not respond within 60s | Retry up to 3 times with backoff |
| `WHISPER_API_ERROR` | API returned 4xx/5xx | Retry if 5xx; terminal if 4xx |
| `LOW_CONFIDENCE_TRANSCRIPT` | Score < 0.6 | Continue but flag for human review |
| `EMPTY_TRANSCRIPT` | Whisper returned no text | Terminal — notify operator |

---

### Retry Behavior

- Max retries: 3
- Backoff: 5s → 15s → 45s (exponential)
- After 3 failures: state set to `OCR_FAILED`, human notified
- Retry context preserved: chunk position tracked so partial failures can resume

---

### Validation

Before triggering M3 (Clinical Structuring):
- Transcript is not empty
- Word count > 50 (a transcript with fewer words is likely too short to extract clinical data from)
- No PII scrubbing issue (transcript may contain patient ID numbers — validated against claim's patient record)

---

### Future AI Opportunities

- Real-time transcription: streaming Whisper for live consultations (reduces latency from minutes to seconds)
- Medical terminology correction: post-process transcript through a medical vocabulary model
- Automatic clinical note generation: directly generate SOAP notes from the conversation, bypassing the raw transcript
- Speaker intent classification: distinguish history-taking from diagnosis from treatment planning

---

### Human Approval Points

- **Transcript review**: If confidence score < 0.75, the transcript is flagged for human verification before proceeding. A human can correct segments or approve as-is.
- This is a soft gate — the claim can proceed if the human approves a low-confidence transcript.

---

### Interaction with Downstream Modules

- **Output consumed by**: M3 (Clinical Structuring) — the transcript text is included in the structuring prompt alongside any OCR-extracted text
- **May run in parallel with**: M2 (Document Intelligence) — if a clinician uploads both a recording and supporting PDFs simultaneously
- **Does not interact with**: M4, M5, M6, M7, M8, M9 directly

---

## Module 2: Document Intelligence

**Resume claim this maps to**: OCR extraction

---

### Purpose

Convert uploaded PDF medical documents into clean, machine-readable text. This is the primary document ingestion path. Multiple PDFs per claim are processed independently, then their outputs are merged before passing to M3.

---

### Input

```
claimId:      string
documents:    array of:
  filePath:       string
  fileName:       string
  fileSizeBytes:  number
  documentType:   enum — CLINICAL_NOTES | INSURANCE_CARD | COST_SHEET |
                         DIAGNOSIS_REPORT | PRESCRIPTION | OPERATION_NOTES |
                         ANAESTHESIA_REPORT | DISCHARGE_SUMMARY | FINAL_BILL |
                         LAB_REPORT | OTHER
```

**Precondition**: Claim exists in `DOCUMENTS_UPLOADED` state. All file paths are accessible.

---

### Output

Written per-document to `documents` table:

```
extractedText:      string    — full OCR output
pageCount:          number
extractedPages:     array of:
  pageNumber:         number
  pageText:           string
  confidence:         number  — per-page Tesseract confidence score
  isBlank:            boolean — blank pages are flagged
  containsHandwriting: boolean — heuristic detection
textQuality:        enum      — HIGH | MEDIUM | LOW | UNREADABLE
structuredFields:   object    — key-value pairs extracted using layout analysis
                               (e.g., policy number from insurance card)
```

Combined output written to claim record:

```
mergedDocumentText: string   — all page texts concatenated in document order
documentMap:        object   — { documentType: [extractedText] }
missingDocumentTypes: string[] — types required for this claim type but not uploaded
```

---

### Internal Workflow

```
1. For each uploaded document:
   a. Validate: is it a PDF? Is it under 20MB? Is it readable?
   b. Convert PDF pages to PNG images (300 DPI minimum for OCR accuracy)
   c. For each page image:
      - Detect if page is blank (pixel density threshold)
      - Detect if page contains handwriting (texture analysis heuristic)
      - Run Tesseract OCR with 'eng+tam' or detected language pack
      - Capture per-page confidence score
   d. Merge page texts with page-number markers
   e. Run layout-aware field extraction on known document types:
      - Insurance card: extract policy number, member ID, validity dates using regex + positional heuristics
      - Cost sheet: extract procedure code, amount fields
   f. Assign textQuality score based on average page confidence
   g. Write per-document result to database

2. After all documents processed:
   a. Merge all extracted texts into documentMap by type
   b. Check against required document checklist for claim type:
      - Pre-auth requires: CLINICAL_NOTES, INSURANCE_CARD, COST_SHEET, DIAGNOSIS_REPORT, PRESCRIPTION
      - Discharge requires: OPERATION_NOTES, ANAESTHESIA_REPORT, POST_OP_SUMMARY, FINAL_BILL_DRAFT
      - Final claim requires: DISCHARGE_SUMMARY, FINAL_BILL, LAB_REPORTS, PRESCRIPTIONS
   c. Record missingDocumentTypes
   d. Update claim state: DOCUMENTS_UPLOADED → OCR_COMPLETE
   e. Trigger M3 (Clinical Structuring)
```

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `PDF_CONVERSION_FAILED` | Corrupt or encrypted PDF | Terminal per document — notify user |
| `ALL_PAGES_BLANK` | Scanner produced empty output | Terminal — user must re-scan |
| `LOW_OVERALL_QUALITY` | Average confidence < 40% | Continue to M3 with warning flag; M3 may partially fail |
| `TESSERACT_CRASH` | OOM or process error | Retry up to 2 times; if fails, escalate |
| `MISSING_REQUIRED_DOCS` | Required types not uploaded | Not a failure — passes to M5 which detects and flags |

---

### Retry Behavior

- Per-document retries: 2 (exponential backoff)
- Page-level granularity: if one page fails, others still process
- Failed pages are recorded with `pageText = null` and `confidence = 0`
- Partial extractions are valid — M3 handles missing page content gracefully

---

### Validation

Before triggering M3:
- At least one document has `textQuality != UNREADABLE`
- `mergedDocumentText` length > 100 characters
- No duplicate documents (same SHA-256 hash uploaded twice for same claim)

---

### Future AI Opportunities

- Vision model extraction: replace Tesseract with a vision LLM (Gemini Vision, GPT-4V) that understands document layout, tables, and handwriting natively — no PDF-to-image conversion needed
- Document classification: automatically infer `documentType` from content rather than requiring the user to label it at upload
- Handwriting transcription: dedicated handwriting recognition model (Microsoft Azure Computer Vision, Google Vision) for handwritten doctor notes
- Cross-document entity linking: identify that "Rajesh Kumar" in the prescription and "R. Kumar" in the lab report are the same patient

---

### Human Approval Points

- **Low-quality document review**: If any document is `UNREADABLE`, a human is notified and can re-upload that specific document without restarting the claim
- **Missing documents**: If required documents are missing, M5 (Validation) surfaces this as a data entry request — not M2 directly

---

### Interaction with Downstream Modules

- **Output consumed by**: M3 (Clinical Structuring) — `documentMap` is the primary input
- **Output consumed by**: M5 (Claim Validation) — `missingDocumentTypes` contributes to the validation report
- **May receive input from**: M1 (Speech Intelligence) — transcript text is added to the document map as `TRANSCRIPT` type before M3 is called
- **Does not interact with**: M4, M6, M7, M8, M9 directly

---

## Module 3: Clinical Structuring

**Resume claim this maps to**: LLM-based clinical structuring

---

### Purpose

Transform unstructured medical text (OCR output + transcripts) into a validated, structured claim data object. This is where the AI does its core medical reasoning work. The output of this module is the structured claim that all downstream modules operate on.

---

### Input

```
claimId:       string
documentMap:   object   — { documentType: extractedText } from M2
transcript:    string   — optional, from M1
claimType:     enum     — PRE_AUTH | DISCHARGE | FINAL_CLAIM
insurerCode:   string   — target insurer identifier (may be unknown at this stage)
languageHint:  string   — for prompting the model appropriately
```

**Precondition**: Claim is in `OCR_COMPLETE` state. At least one document in `documentMap` has readable text.

---

### Output

Written to `claim_structured_data` table:

```
patientName:           string
patientDOB:            string      — ISO date or estimated
patientAge:            number
patientGender:         string
patientID:             string      — hospital patient ID if found
policyNumber:          string      — insurance policy number
policyHolderName:      string
insurerName:           string      — extracted from documents (may differ from configured insurer)
diagnosisFreeText:     string      — raw clinical diagnosis text
diagnosisCodes:        string[]    — suggested ICD-10 codes (passed to M4 for validation)
procedureFreeText:     string      — procedure description
procedureCodes:        string[]    — suggested procedure codes
treatmentStartDate:    string      — ISO date
treatmentEndDate:      string
admissionDate:         string
dischargeDateExpected: string      — for pre-auth
treatingPhysicianName: string
estimatedCost:         number      — in INR
actualCost:            number      — for final claims
medications:           array       — [{name, dosage, frequency}]
labFindings:           string      — summary of significant lab results
extractionConfidence:  number      — overall 0.0–1.0 confidence
fieldConfidences:      object      — per-field confidence scores
uncertainFields:       string[]    — fields where model was uncertain
missingFields:         string[]    — fields not found in documents
rawPromptResponse:     string      — stored for audit and debugging
```

---

### Internal Workflow

```
1. Compose extraction prompt:
   a. System prompt: role definition as clinical data extractor, JSON output mode
   b. Claim type context: specify which fields are required for PRE_AUTH vs DISCHARGE vs FINAL_CLAIM
   c. Document sections: each document type as a labeled section in the prompt
   d. Output schema: explicit JSON schema definition for reliable structured output

2. Call Gemini API (gemini-2.5-flash recommended for speed/cost balance):
   - Model: gemini-2.5-flash
   - ResponseMimeType: application/json
   - Temperature: 0.1 (low — structured extraction should be deterministic)
   - MaxOutputTokens: 2048

3. Parse JSON response:
   a. Validate response against expected schema
   b. If JSON is malformed: retry once with explicit correction instruction
   c. If JSON is valid but fields are missing: record as missingFields

4. Compute per-field confidence:
   a. Fields explicitly stated in documents: confidence 0.9–1.0
   b. Fields inferred from context: confidence 0.6–0.8
   c. Fields absent from documents: confidence 0.0, added to missingFields
   d. Overall confidence = weighted average of required field confidences

5. Validate key relationships:
   a. Patient age matches DOB if both present
   b. Treatment dates are logically ordered
   c. Estimated cost is a plausible number (> 0, < 10,000,000 INR)

6. Write structured data to database
7. Store raw Gemini response in audit table (always — for debugging)
8. Update claim state: OCR_COMPLETE → STRUCTURING_COMPLETE
9. Trigger M4 (Medical Coding)
```

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `GEMINI_API_TIMEOUT` | API took > 30s | Retry up to 3 times with backoff |
| `GEMINI_API_QUOTA_EXCEEDED` | Rate limit hit | Queue for retry in 60s |
| `JSON_PARSE_FAILED` | Model returned non-JSON | Retry once with stricter JSON instruction |
| `SCHEMA_VALIDATION_FAILED` | Response doesn't match schema | Log raw response, retry with corrected prompt |
| `ZERO_REQUIRED_FIELDS_EXTRACTED` | Documents too degraded for extraction | Escalate to human with LOW_QUALITY_DOCUMENTS reason |
| `CRITICAL_FIELD_MISSING` | Policy number or patient name completely absent | Trigger M7 (Human Review) for missing data |

---

### Retry Behavior

- API failures: 3 retries with 5s → 15s → 45s backoff
- Schema failures: 1 retry with enhanced schema enforcement prompt
- After all retries exhausted: state = `STRUCTURING_FAILED`, human notified
- Partial extractions are valid — a claim with 6/8 required fields is better than no extraction

---

### Validation

The confidence threshold system:
- `extractionConfidence >= 0.85`: Proceed to M4 automatically
- `0.65 <= extractionConfidence < 0.85`: Proceed to M4 but flag for human spot-check
- `extractionConfidence < 0.65`: Require human review of extracted fields before M4

A human reviewer sees the extracted fields alongside the original documents and can correct individual values.

---

### The Extraction Prompt (Structural Design)

The prompt must be version-controlled. Different claim types require different prompts. Changes to the prompt affect extraction quality across all future claims.

```
PromptRegistry:
  PRE_AUTH_EXTRACTION_V1
  PRE_AUTH_EXTRACTION_V2
  DISCHARGE_EXTRACTION_V1
  FINAL_CLAIM_EXTRACTION_V1

Each prompt version stored in: server/modules/clinical-structuring/prompts/
```

Storing which prompt version produced each extraction enables regression testing when prompts are updated.

---

### Future AI Opportunities

- **Few-shot examples**: Include 2–3 anonymized real examples in the prompt to dramatically improve extraction accuracy
- **Domain-fine-tuned model**: Fine-tune a smaller model on Indian medical documents specifically — reduces cost and latency
- **Multi-model consensus**: Run extraction on two models (Gemini + Claude/GPT-4o) and flag discrepancies for human review
- **Confidence calibration**: Build a calibration set of known-good extractions and tune the confidence thresholds empirically

---

### Human Approval Points

- **Low-confidence field correction**: Any field in `uncertainFields` is presented to the human with the source text highlighted, allowing correction
- **Missing critical fields**: Policy number or patient name missing triggers immediate human data entry request

---

### Interaction with Downstream Modules

- **Output consumed by**: M4 (Medical Coding) — `diagnosisFreeText`, `diagnosisCodes`, `procedureFreeText`, `procedureCodes`
- **Output consumed by**: M5 (Claim Validation) — full structured data for rule validation
- **Output consumed by**: M7 (Human Review) — displayed in the review UI for approval
- **Output consumed by**: M8 (Submission Automation) — used to populate insurer submission forms
- **Does not interact with**: M1, M2, M6, M9 directly

---

## Module 4: Medical Coding

**Resume claim this maps to**: ICD-10 / CPT coding

---

### Purpose

Assign validated ICD-10 diagnosis codes and procedure codes to the claim. Detect conflicts between codes. This module exists separately from M3 because coding is a distinct, rule-bound operation that benefits from deterministic validation — not just LLM suggestion.

---

### Input

```
claimId:             string
diagnosisFreeText:   string    — from M3 output
suggestedIcdCodes:   string[]  — M3's raw suggestions (not yet validated)
procedureFreeText:   string    — from M3 output
suggestedProcCodes:  string[]  — M3's raw suggestions
claimType:           enum
insurerCode:         string    — some insurers require specific coding systems
```

**Precondition**: Claim is in `STRUCTURING_COMPLETE` state. M3 has written structured data.

---

### Output

Written to `claim_codes` table:

```
icdCodes:           array of:
  code:               string    — e.g., "K35.80"
  description:        string    — "Acute appendicitis without abscess"
  source:             enum      — AI_SUGGESTED | HUMAN_ASSIGNED | SYSTEM_VALIDATED
  confidence:         number
  isConfirmed:        boolean   — true after human review

procedureCodes:     array of:
  code:               string
  description:        string
  source:             enum
  confidence:         number
  isConfirmed:        boolean

conflicts:          array of:
  type:               enum      — DIAGNOSIS_PROCEDURE_MISMATCH | DUPLICATE_CODE |
                                  EXCLUDED_COMBINATION | GENDER_AGE_INCONSISTENCY
  codes:              string[]  — the conflicting codes
  description:        string    — human-readable explanation
  severity:           enum      — BLOCKING | WARNING

codingConfidence:   number      — overall coding confidence 0.0–1.0
requiresHumanCoding: boolean
codingNotes:        string      — model's reasoning, stored for audit
```

---

### Internal Workflow

```
1. Validate M3's suggested codes against ICD-10 reference dataset:
   a. Does the code exist in the ICD-10 dataset?
   b. Is the code currently active (not deprecated)?
   c. Does the code's description match the diagnosis free text?
   d. If code does not exist: mark as INVALID, attempt to find nearest valid code

2. If M3 provided no codes or all are invalid:
   a. Run secondary LLM call specifically for coding:
      - Provide diagnosisFreeText as input
      - Request top 3 ICD-10 code candidates with confidence scores
      - Use low temperature (0.0) for maximum determinism

3. Apply conflict detection rules:
   a. Diagnosis-procedure mismatch: check known incompatible pairs
      (e.g., O80 Normal Delivery + C-section procedure code = conflict)
   b. Gender-age rules: e.g., maternity codes for male patients = conflict
   c. Mutually exclusive codes: certain ICD-10 codes cannot coexist
      (e.g., cannot have both "with complications" and "without complications")
   d. Duplicate codes: same code assigned twice

4. Score each conflict by severity:
   - BLOCKING: will cause insurer rejection; must be resolved before submission
   - WARNING: may cause rejection; human should review

5. Compute overall coding confidence based on:
   - Validity of suggested codes
   - Strength of text-to-code match
   - Presence of conflicts

6. Set requiresHumanCoding = true if:
   - Any BLOCKING conflict detected
   - codingConfidence < 0.70
   - Procedure is complex/high-cost (> ₹1,00,000) — high-value claims warrant review

7. Write results to database
8. Update claim state: STRUCTURING_COMPLETE → CODING_COMPLETE
9. Trigger M5 (Claim Validation)
```

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `ICD10_DATASET_UNAVAILABLE` | Reference dataset not loaded | Blocking — system cannot function; alert operator |
| `NO_VALID_CODES_FOUND` | LLM and rule-based both fail | Set `requiresHumanCoding = true`; proceed to M7 |
| `LLM_CODING_TIMEOUT` | Secondary coding call timed out | Retry 2 times; if fails, proceed with M3's raw suggestions flagged as unvalidated |

---

### Retry Behavior

- LLM coding call: 2 retries
- The ICD-10 dataset lookup is synchronous — no retry needed (it's a local lookup)
- If all retries fail: `requiresHumanCoding = true`, proceed with unvalidated codes

---

### Validation

The ICD-10 reference dataset:
- Source: WHO public data (downloadable, no license needed)
- Format: JSON file loaded at server startup into memory (small enough — ~200KB)
- Versioned: dataset version stored in config; changes trigger re-validation of recent claims

**Conflict rule set**:
- Stored as a JSON configuration file (not hardcoded)
- Can be updated without code changes
- Version-controlled alongside the codebase

---

### Future AI Opportunities

- **Trained coding classifier**: Build a supervised classifier trained on (diagnosis text → ICD-10 code) pairs using historical claims data. Eliminates LLM call for common diagnoses.
- **Insurer-specific coding patterns**: Learn which code variants each insurer accepts most often and prefer those
- **Automatic code optimization**: Suggest alternative valid codes that have historically higher approval rates with specific insurers

---

### Human Approval Points

- **Coding review screen**: When `requiresHumanCoding = true`, a human sees the suggested codes, the conflicts, and the source documents side-by-side. They can confirm, modify, or replace codes.
- **Approval is mandatory before submission**: No claim proceeds to M8 without confirmed codes (either AI-confirmed or human-confirmed)

---

### Interaction with Downstream Modules

- **Output consumed by**: M5 (Claim Validation) — confirmed codes are validated against insurer coverage rules
- **Output consumed by**: M7 (Human Review) — conflicts are displayed in the review UI
- **Output consumed by**: M8 (Submission Automation) — confirmed codes populate the submission form
- **Does not interact with**: M1, M2, M3, M6, M9 directly

---

## Module 5: Claim Validation

**Resume claim this maps to**: Claim Validation

---

### Purpose

Validate the fully structured, coded claim against a configurable ruleset. Detect all reasons the insurer is likely to reject it before it is submitted. This is the last automated quality gate before human review and submission.

---

### Input

```
claimId:              string
structuredData:       object    — from M3 (full extraction output)
confirmedCodes:       array     — from M4 (validated ICD-10 + procedure codes)
documentMap:          object    — from M2 (which document types were uploaded)
claimType:            enum
insurerCode:          string
claimAmount:          number
```

**Precondition**: Claim is in `CODING_COMPLETE` state. Codes are confirmed (or flagged for human but still present).

---

### Output

Written to `claim_validation_results` table:

```
validationStatus:     enum      — PASSED | FAILED_MISSING_DATA | FAILED_HARD_RULES
                                  PASSED_WITH_WARNINGS

hardFailures:         array of:
  ruleId:               string
  ruleName:             string
  description:          string
  failedValue:          string
  requiredValue:        string
  severity:             BLOCKING

missingFields:        array of:
  fieldName:            string
  fieldDescription:     string
  canProvideManually:   boolean  — can user type it, or must upload document?
  requiredDocumentType: string   — if canProvideManually = false

warnings:             array of:
  ruleId:               string
  description:          string
  severity:             WARNING

completenessScore:    number     — % of required fields present and valid
readinessScore:       number     — overall submission readiness 0.0–1.0
estimatedApprovalProbability: number  — see Future AI section
```

---

### Internal Workflow

```
1. Load insurer-specific ruleset for insurerCode + claimType combination
   Example: STAR_HEALTH.PRE_AUTH rules file

2. Execute hard validation rules (BLOCKING if failed):
   a. Required fields present:
      - Patient name, policy number, DOB, diagnosis, procedure, estimated cost
   b. Policy validity: treatment dates within policy coverage period (if dates known)
   c. Document completeness: all required document types for this claim type present
   d. Code coverage: all ICD-10 codes present in insurer's approved procedure list
   e. Cost within policy limit: estimated cost <= policy sum insured
   f. Pre-auth validity: for discharge/final claims, pre-auth reference number must be present
   g. Claim age: submission within insurer's deadline (typically 30 days from discharge)

3. Execute soft validation rules (WARNING if failed):
   a. Duplicate claim detection: similar patient + procedure + date combination in DB
   b. Cost anomaly: estimated cost >> historical average for this procedure
   c. Missing secondary documents: not required but improve approval probability
   d. Physician registration number present (some insurers require it)

4. Compute completenessScore: (present required fields / total required fields)

5. Compute readinessScore: weighted combination of:
   - No hard failures: 60% weight
   - Code conflicts resolved: 20% weight
   - completenessScore: 20% weight

6. Determine next action:
   - validationStatus = PASSED: advance to AWAITING_HUMAN_APPROVAL (M7)
   - validationStatus = FAILED_MISSING_DATA: advance to AWAITING_HUMAN_DATA_ENTRY (M7)
   - validationStatus = FAILED_HARD_RULES: notify human of blocking issues (M7)

7. Write validation results
8. Update claim state: CODING_COMPLETE → VALIDATION_PASSED | VALIDATION_FAILED_MISSING_DATA
9. Trigger M7 (Human Review) or await human data entry
```

---

### The Ruleset System

Rules are stored as JSON configuration, not hardcoded:

```
server/
└── modules/
    └── claim-validation/
        └── rulesets/
            ├── STAR_HEALTH.PRE_AUTH.json
            ├── STAR_HEALTH.DISCHARGE.json
            ├── HDFC_ERGO.PRE_AUTH.json
            ├── CMCHIS.PRE_AUTH.json
            └── DEFAULT.PRE_AUTH.json    — fallback for unknown insurers
```

Each ruleset file contains:
- Required fields list
- Required document types
- Field format validations (regex patterns)
- Cost limits
- Coverage exclusion list (procedures not covered)
- Deadline rules

This design allows adding a new insurer without changing code — only add a new ruleset file.

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `RULESET_NOT_FOUND` | No ruleset for insurerCode | Fall back to DEFAULT ruleset with warning |
| `RULESET_SCHEMA_INVALID` | JSON configuration is malformed | Alert developer; use last valid ruleset |
| `DATABASE_READ_FAILED` | Cannot access structured data | Retry 2 times; escalate if fails |

---

### Retry Behavior

Validation is a pure computation over data already in the database — no external API calls. Failures are almost always database access issues. 2 retries, then escalate.

---

### Validation (Meta-Validation)

The ruleset files themselves are validated at server startup:
- Schema check against known rule format
- Required rule IDs are present
- No duplicate rule IDs

---

### Future AI Opportunities

- **Approval probability estimation**: Train a model on historical (claim features → approved/rejected) outcomes to predict the probability a specific claim will be approved. Surface this as `estimatedApprovalProbability`.
- **Rule learning**: Analyze rejected claims to automatically detect implicit insurer rules not in the official documentation
- **Document quality scoring**: Predict whether a specific document will cause rejection based on its content, not just its presence

---

### Human Approval Points

- **Missing data entry**: When `validationStatus = FAILED_MISSING_DATA`, the human sees exactly which fields are missing, with clear instructions for each (type manually vs. upload document). This corresponds directly to Screen12 in the wireframe.
- **Hard rule failure review**: When a hard rule fails (not missing data, but actual policy violation), a human must explicitly acknowledge and either resolve or accept the risk before proceeding.

---

### Interaction with Downstream Modules

- **Validation results consumed by**: M7 (Human Review) — displays issues to the reviewer
- **Validation results consumed by**: M6 (Orchestration) — determines next state
- **Missing field list consumed by**: M7 — populates the missing data entry screen (Screen12)
- **Does not interact with**: M1, M2, M3, M4, M8, M9 directly

---

## Module 6: Workflow Orchestration

**Resume claim this maps to**: n8n orchestration / workflow coordination

---

### Purpose

Coordinate the execution of all other modules. Decide what happens next after each module completes. Handle the transitions between automated processing and human review. This module is the only one that knows the complete pipeline sequence.

---

### Design Note

For the MVP, this module is implemented as an **in-process job queue** within Express — not a separate n8n instance. The queue is a simple in-memory array (or `better-queue` npm package) that processes one job at a time per claim. This can be migrated to n8n, BullMQ, or a dedicated queue service later without changing the module contracts.

---

### Input

```
event:    ClaimStateChangeEvent
  claimId:     string
  fromState:   ClaimState
  toState:     ClaimState
  moduleId:    string    — which module triggered this transition
  timestamp:   string
  metadata:    object    — module-specific output summary
```

---

### Output

```
nextAction:   object
  type:         enum   — TRIGGER_MODULE | AWAIT_HUMAN | SCHEDULE_RETRY | TERMINAL_SUCCESS | TERMINAL_FAILURE
  moduleId:     string   — if type = TRIGGER_MODULE
  delay:        number   — seconds, if type = SCHEDULE_RETRY
  humanReason:  string   — if type = AWAIT_HUMAN
  priority:     enum   — URGENT | NORMAL | LOW
```

---

### Internal Workflow (State Transition Map)

```
CREATED                     → trigger M2 (or M1 if audio attached)
DOCUMENTS_UPLOADED          → trigger M2
OCR_COMPLETE                → trigger M3
STRUCTURING_COMPLETE        → trigger M4
CODING_COMPLETE             → trigger M5
VALIDATION_PASSED           → trigger M7 (human approval)
VALIDATION_FAILED_MISSING_DATA → trigger M7 (data entry)
AWAITING_HUMAN_DATA_ENTRY   → AWAIT_HUMAN
DATA_ENTRY_COMPLETE         → trigger M5 (re-validate)
AWAITING_HUMAN_APPROVAL     → AWAIT_HUMAN
HUMAN_APPROVED              → trigger M8
HUMAN_REJECTED              → TERMINAL_FAILURE (document reason)
SUBMISSION_QUEUED           → trigger M8
SUBMITTED                   → AWAIT_HUMAN (polling for insurer response)
INSURER_APPROVED            → trigger M9 (update analytics) → TERMINAL_SUCCESS
INSURER_REJECTED            → trigger denial analysis (M3 + M4 re-run) → M7
DENIAL_RESUBMIT_QUEUED      → trigger M8
DENIAL_ESCALATED            → AWAIT_HUMAN (manual handling)

OCR_FAILED                  → AWAIT_HUMAN (re-upload request)
STRUCTURING_FAILED          → AWAIT_HUMAN (document quality issue)
CODING_FAILED               → AWAIT_HUMAN (human coding required)
SUBMISSION_FAILED (attempt 3) → AWAIT_HUMAN (manual submission)
```

---

### Failure Modes

The orchestrator itself has very limited failure modes because it does not perform computation:

| Failure | Cause | Response |
|---------|-------|----------|
| `UNKNOWN_STATE_TRANSITION` | Module produced unexpected state | Log error, alert developer, claim remains in current state |
| `MODULE_TRIGGER_FAILED` | Could not enqueue next job | Retry 3 times; if fails, log and alert |
| `CIRCULAR_TRANSITION_DETECTED` | Same state reached 3 times | Escalate to human; block further automation |

---

### Retry Behavior

The orchestrator does not retry modules directly — it records the failure and triggers the appropriate human notification or retry schedule. Retry logic is defined per-module and the orchestrator simply respects it.

---

### Priority System

Urgent claims (patients waiting for discharge authorization) are tagged with `priority: URGENT` in the queue. The in-process queue processes URGENT jobs before NORMAL jobs.

Priority is determined by:
- Claim type = DISCHARGE and patient has not been discharged: URGENT
- Claim has been waiting > 24 hours without progression: URGENT (escalation)
- All other claims: NORMAL

---

### Future AI Opportunities

- **Predictive routing**: Based on document quality scores and claim complexity, predict which claims will need human intervention and proactively notify staff before the system reaches that state
- **SLA monitoring**: Track time-in-state for each claim and automatically escalate claims approaching insurer deadlines

---

### Human Approval Points

The orchestrator is the module that decides when to pause and wait for humans. Every `AWAIT_HUMAN` transition generates a notification (written to the `notifications` table) that the frontend displays.

---

### Interaction with Downstream Modules

The orchestrator is the only module that interacts with all other modules. All other modules communicate only with the database — the orchestrator handles all cross-module coordination.

---

## Module 7: Human Review

**Resume claim this maps to**: Human-in-the-loop workflow

---

### Purpose

Provide structured, context-rich interfaces for every human checkpoint in the pipeline. This module does not process claims automatically — it organizes information for humans and captures their decisions.

---

### Human Review Types

There are four distinct human review states, each with a different UI and decision structure:

#### HR-1: Transcript Review (from M1)
- Shown when: audio transcription confidence < 0.75
- Human sees: transcript text alongside original audio player
- Human can: approve transcript as-is, correct specific segments, reject and re-record
- Decision captures: approved transcript text, correction notes

#### HR-2: Missing Data Entry (from M5)
- Shown when: required fields missing from documents
- Human sees: list of missing fields with source document context, inline input or re-upload
- Human can: type value manually, upload additional document, mark field as unavailable
- This corresponds directly to Screen12 in the wireframe
- Decision captures: field name, provided value, source (manual vs document), timestamp

#### HR-3: Clinical Data Review (from M3/M4)
- Shown when: extraction confidence < threshold, or coding conflicts detected
- Human sees: extracted field values with source text highlighted, ICD-10 code suggestions with descriptions, conflict explanations
- Human can: confirm each field, correct values, approve or change codes, resolve conflicts
- This corresponds to Screen14/15 in the wireframe
- Decision captures: field-by-field confirmation, corrected values, code selections

#### HR-4: Final Approval (from M6 after M5 PASSED)
- Shown when: all automated steps complete, claim ready for submission
- Human sees: complete structured claim summary, all documents accessible, validation report, amount breakdown
- Human can: approve for submission, reject with reason, send back for correction
- This is the primary "Human Approval" checkpoint
- Decision captures: approval/rejection, reviewer ID, timestamp, rejection reason if rejected

---

### Input

```
claimId:        string
reviewType:     enum     — TRANSCRIPT | MISSING_DATA | CLINICAL_DATA | FINAL_APPROVAL
reviewData:     object   — type-specific content for display
priority:       enum
assignedTo:     string   — user ID (or null for any available reviewer)
```

---

### Output

Written to `human_review_decisions` table:

```
reviewId:         string
claimId:          string
reviewType:       enum
reviewerId:       string
decision:         enum     — APPROVED | REJECTED | DATA_PROVIDED | CORRECTED
corrections:      object   — field → corrected value
rejectionReason:  string
decidedAt:        string   — ISO timestamp
timeToDecision:   number   — seconds from review creation to decision
```

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `REVIEW_TIMEOUT` | No human action within 48 hours | Escalate to admin, send reminder notification |
| `REVIEWER_NOT_FOUND` | assignedTo user doesn't exist | Assign to any admin |

---

### Retry Behavior

No retries — this module waits for human input. The 48-hour timeout is the only time-based action.

---

### Validation

- Decisions must include a reviewer ID (no anonymous approvals)
- Approval cannot come from the same user who uploaded the documents (four-eyes principle — future enhancement)
- All corrections are logged with before/after values

---

### Future AI Opportunities

- **Pre-populated correction suggestions**: When a human is reviewing an extracted field, show the most likely correction based on similar past corrections
- **Review time prediction**: Estimate how long this review type typically takes and schedule reviewer time accordingly
- **Automated spot-check selection**: Instead of reviewing every low-confidence claim, use statistical sampling to review a representative subset

---

### Human Approval Points

This entire module IS the human approval point. All four review types require explicit human action.

---

### Interaction with Downstream Modules

- **Decisions trigger**: M6 (Orchestration) — every human decision is an event that M6 processes to determine next state
- **Receives context from**: M1, M2, M3, M4, M5 — their outputs are displayed in the review UI
- **Decisions consumed by**: M3/M4 if corrections are made (re-run structuring/coding with corrections)
- **Final approval consumed by**: M8 (Submission Automation)

---

## Module 8: Submission Automation

**Resume claim this maps to**: Playwright automation / REST APIs

---

### Purpose

Submit the approved, validated, human-reviewed claim to the insurer's system. Handle the two submission methods: REST API (for insurers with APIs) and browser automation (for insurer web portals). Capture the submission reference and insurer response.

---

### Input

```
claimId:            string
approvedClaim:      object    — full structured claim from M3 (human-corrected)
confirmedCodes:     array     — from M4 (human-confirmed)
documents:          array     — file paths for all uploaded documents
submissionMethod:   enum      — REST_API | PORTAL_AUTOMATION | MANUAL
insurerCode:        string
insurerConfig:      object    — API keys or portal URL/credentials
claimType:          enum
attempt:            number    — 1 for first submission, 2+ for denial resubmission
```

**Precondition**: Claim is in `HUMAN_APPROVED` or `DENIAL_RESUBMIT_QUEUED` state. Human review decision has `decision = APPROVED`.

---

### Output

Written to `claim_submissions` table:

```
submissionId:         string
claimId:              string
attempt:              number
method:               enum
submittedAt:          string
insurerReferenceNumber: string    — the ID the insurer assigned
submissionPayload:    object      — what we sent (stored for audit)
insurerResponse:      object      — raw response (stored for audit)
insurerStatus:        enum        — ACCEPTED | REJECTED | PENDING | ERROR
rejectionReason:      string      — if REJECTED
rejectionCode:        string      — insurer's rejection code
expectedResponseDate: string      — when we expect a decision
```

---

### Internal Workflow (REST API Path)

```
1. Load insurer's API configuration (endpoint, auth type, field mapping)
2. Transform ClaimPilot's internal claim format to insurer's required format
   (each insurer has a different field naming convention)
3. Attach documents as base64 or multipart
4. POST to insurer's pre-auth API endpoint
5. Parse response:
   a. 200/201 → extract reference number, set state to SUBMITTED
   b. 4xx → parse rejection reason, set state to INSURER_REJECTED
   c. 5xx → retry (not our error)
   d. Timeout → retry
6. Store submission record
7. Update claim state → SUBMITTED or INSURER_REJECTED
```

---

### Internal Workflow (Portal Automation Path)

```
1. Launch Playwright browser (headless)
2. Navigate to insurer portal URL
3. Check if session is valid (look for logout button or session indicator)
   a. If session expired: re-login with stored credentials
4. Navigate to claim submission form
5. Fill form fields from approvedClaim (using field mapping config)
6. Upload documents to portal's upload fields
7. Review form before submission (screenshot captured for audit)
8. Click submit
9. Wait for confirmation page
10. Extract reference number from confirmation page
11. Screenshot confirmation page (stored as proof)
12. Close browser
13. Update claim state
```

**Portal automation is fragile by design.** Insurer portals change without notice. The architecture acknowledges this:
- Each portal has its own Playwright script file (`server/modules/submission/portals/HDFC_ERGO.ts`)
- Screenshot evidence is captured at each step
- Any uncaught selector error immediately falls through to `SUBMISSION_FAILED` and alerts a human

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `INSURER_API_TIMEOUT` | API no response | Retry 3 times with backoff |
| `INSURER_API_5XX` | Insurer server error | Retry 3 times |
| `INSURER_API_4XX` | Our submission was rejected | Record rejection, trigger denial flow |
| `PORTAL_LOGIN_FAILED` | Credentials expired or portal blocked | Alert human immediately; no retry |
| `PORTAL_SELECTOR_NOT_FOUND` | Portal UI changed | Alert human + developer; no retry |
| `PORTAL_CAPTCHA_DETECTED` | Portal added CAPTCHA | Alert human; switch to MANUAL path |
| `SUBMISSION_FAILED_ATTEMPT_3` | All 3 attempts failed | Set claim to MANUAL, notify human |

---

### Retry Behavior

- REST API failures: 3 retries, 30s → 90s → 270s backoff
- Portal automation failures: 2 retries (different from API — portal failures are often transient)
- After all retries: `submissionMethod = MANUAL` — human handles submission directly

---

### Validation

Before attempting submission:
- Human approval decision present with `decision = APPROVED` and `reviewerId` not null
- All required documents attached and accessible on disk
- Insurer configuration is present and has been tested recently (last test < 24 hours ago)
- No duplicate submission: check if a submission for this claim + attempt already exists

---

### Future AI Opportunities

- **Dynamic portal navigation**: Instead of hardcoded Playwright selectors, use a vision model to identify form fields visually — significantly reduces portal maintenance burden
- **Response parsing**: Train a classifier on insurer rejection messages to automatically categorize rejection reasons without manual rule maintenance

---

### Human Approval Points

- **MANUAL fallback**: When all automated submission attempts fail, the human receives the complete claim package (PDF export) and instructions for manual portal submission
- **Denial receipt**: When `insurerStatus = REJECTED`, a human reviews the rejection reason before the denial recovery flow begins

---

### Interaction with Downstream Modules

- **Triggers**: M9 (Analytics) on INSURER_APPROVED — update success metrics
- **Triggers**: denial re-flow (M3 → M4 re-run) on INSURER_REJECTED
- **Receives from**: M7 (Human Review) — final approval decision
- **Receives from**: M3, M4 — structured data and codes for submission payload

---

## Module 9: Analytics

**Resume claim this maps to**: Dashboard / reporting

---

### Purpose

Compute and serve all statistical aggregations that power the dashboard, pipeline view, denial analytics, and reports. This module reads only — it never modifies claim state.

---

### Input

All inputs are SQL queries against the claims database. No module output consumed directly — analytics reads from the canonical database tables.

---

### Output

Served via API endpoints consumed by the React frontend:

```
GET /api/dashboard/kpis
  claimsThisMonth:      number
  approvalRate:         number    — 0.0 to 1.0
  revenueRecovered:     number    — INR
  avgProcessingMinutes: number
  pendingHumanReview:   number
  trend:                object    — comparison to previous month

GET /api/dashboard/activity
  events:               array of:
    timestamp:            string
    eventType:            string
    claimId:              string
    description:          string

GET /api/dashboard/attention
  claims:               array    — claims in AWAITING_HUMAN_* states

GET /api/pipeline/claims
  claims:               array    — paginated, filterable claim list

GET /api/denial/stats
  totalDenials:         number
  recoveredCount:       number
  recoveryRate:         number
  revenueAtRisk:        number
  reasonBreakdown:      array    — [{reason, count, percentage}]

GET /api/reports/monthly
  ...aggregated monthly statistics

GET /api/audit/log
  events:               array    — paginated audit trail
```

---

### Internal Workflow

```
1. Receive API request with optional filters (date range, insurer, claim type)
2. Execute parameterized SQL query against SQLite
3. Transform raw rows into API response shape
4. Return JSON response

No async processing. No external calls. No state changes.
```

---

### Caching Strategy (MVP)

For the MVP, no caching is needed — SQLite queries over a single hospital's data (~10,000 rows max) return in < 50ms. When the dataset grows or multi-hospital support is added, add a simple 60-second in-memory cache layer.

---

### Failure Modes

| Failure | Cause | Response |
|---------|-------|----------|
| `DATABASE_QUERY_TIMEOUT` | Query too complex for dataset size | Return partial data with warning |
| `DATABASE_LOCKED` | Write operation in progress | Retry after 100ms (SQLite behavior) |

---

### Future AI Opportunities

- **Predictive analytics**: Forecast claim volumes and approval rates for the next month
- **Anomaly detection**: Flag unusual patterns (sudden spike in rejections from one insurer, unusual cost distributions)
- **Natural language querying**: Allow "Show me all rejected cardiac claims from HDFC Ergo in October" as a text query

---

### Human Approval Points

None — analytics is read-only.

---

### Interaction with Downstream Modules

None — analytics reads from the database only. No module depends on M9's output.

---

## The Database Schema

All modules share a single SQLite database. This is the complete schema that supports all 9 modules.

```sql
-- Core entities
claims (
  id, hospital_id, patient_name, patient_dob, patient_age,
  insurer_code, claim_type, stage, status,
  created_at, updated_at, completed_at
)

documents (
  id, claim_id, file_path, file_name, file_size_bytes,
  document_type, ocr_text, ocr_quality, page_count,
  extraction_confidence, processing_status,
  created_at
)

-- Module 3 output
claim_structured_data (
  id, claim_id, policy_number, insurer_name,
  diagnosis_free_text, procedure_free_text,
  treatment_start_date, treatment_end_date,
  estimated_cost, actual_cost, physician_name,
  extraction_confidence, uncertain_fields, missing_fields,
  prompt_version, raw_llm_response,
  created_at
)

-- Module 4 output
claim_codes (
  id, claim_id, code_type (ICD10|PROCEDURE),
  code, description, source, confidence,
  is_confirmed, confirmed_by, confirmed_at
)

claim_code_conflicts (
  id, claim_id, conflict_type, codes, description, severity,
  resolved_by, resolved_at, resolution_notes
)

-- Module 5 output
claim_validation_results (
  id, claim_id, ruleset_version, validation_status,
  completeness_score, readiness_score,
  hard_failures (JSON), warnings (JSON), missing_fields (JSON),
  created_at
)

-- Module 7 output
human_review_decisions (
  id, claim_id, review_type, reviewer_id,
  decision, corrections (JSON), rejection_reason,
  created_at, time_to_decision_seconds
)

-- Module 8 output
claim_submissions (
  id, claim_id, attempt, method,
  submitted_at, insurer_reference_number,
  submission_payload (JSON), insurer_response (JSON),
  insurer_status, rejection_reason, rejection_code,
  expected_response_date
)

-- Cross-cutting
audit_log (
  id, claim_id, user_id, module_id,
  action, from_state, to_state,
  details (JSON), timestamp
)

notifications (
  id, claim_id, user_id, notification_type,
  message, priority, is_read, created_at
)

-- Configuration
hospitals (id, name, registration_number, address, empanelment_ids)
users (id, hospital_id, email, password_hash, role, created_at)
insurer_configs (
  id, insurer_code, insurer_name, connection_type (API|RPA|MANUAL),
  api_key, api_endpoint, portal_url, hospital_id_at_insurer,
  last_tested_at, is_active
)
```

---

## Directory Structure (Target)

The following structure implements this architecture while preserving the existing React frontend:

```
Claim_bot_2-main/
├── src/                          # React frontend (unchanged)
│   ├── App.tsx
│   ├── components/
│   └── screens/
│
├── server/                       # Express backend (new)
│   ├── index.ts                  # Express app entry + middleware
│   ├── router.ts                 # Route registration
│   │
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── requestLogger.ts      # Structured request logging
│   │
│   ├── routes/
│   │   ├── auth.ts               # POST /api/auth/login|logout
│   │   ├── claims.ts             # CRUD + state queries
│   │   ├── documents.ts          # POST /api/documents/upload
│   │   ├── dashboard.ts          # GET /api/dashboard/*
│   │   ├── humanReview.ts        # GET/POST /api/review/*
│   │   └── insurers.ts           # GET/POST /api/insurers/*
│   │
│   ├── modules/                  # One directory per pipeline module
│   │   ├── speech-intelligence/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   └── whisper.ts        # Whisper API wrapper
│   │   │
│   │   ├── document-intelligence/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   ├── pdfConverter.ts   # PDF → images
│   │   │   └── ocrRunner.ts      # Tesseract wrapper
│   │   │
│   │   ├── clinical-structuring/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   ├── geminiClient.ts   # Gemini API wrapper
│   │   │   └── prompts/          # Versioned extraction prompts
│   │   │       ├── PRE_AUTH_V1.txt
│   │   │       └── DISCHARGE_V1.txt
│   │   │
│   │   ├── medical-coding/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   ├── icd10Lookup.ts    # Local ICD-10 dataset query
│   │   │   ├── conflictDetector.ts
│   │   │   └── data/
│   │   │       ├── icd10.json    # ICD-10 reference (WHO public data)
│   │   │       └── conflictRules.json
│   │   │
│   │   ├── claim-validation/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   ├── ruleEngine.ts     # Executes rules against claim data
│   │   │   └── rulesets/         # Per-insurer rule config files
│   │   │       ├── STAR_HEALTH.PRE_AUTH.json
│   │   │       ├── HDFC_ERGO.PRE_AUTH.json
│   │   │       └── DEFAULT.PRE_AUTH.json
│   │   │
│   │   ├── workflow-orchestration/
│   │   │   ├── index.ts          # Event listener + dispatcher
│   │   │   ├── stateMachine.ts   # State transition rules
│   │   │   └── jobQueue.ts       # In-process async job queue
│   │   │
│   │   ├── human-review/
│   │   │   ├── index.ts          # Creates review records, sends notifications
│   │   │   └── notificationService.ts
│   │   │
│   │   ├── submission-automation/
│   │   │   ├── index.ts          # Module entry: process(claimId)
│   │   │   ├── apiSubmitter.ts   # REST API path
│   │   │   ├── portalSubmitter.ts # Playwright path
│   │   │   └── portals/          # Per-insurer Playwright scripts
│   │   │       └── HDFC_ERGO.ts
│   │   │
│   │   └── analytics/
│   │       ├── index.ts          # Query functions
│   │       └── queries.ts        # Named SQL queries
│   │
│   └── db/
│       ├── connection.ts         # better-sqlite3 singleton
│       ├── schema.sql            # Full schema definition
│       └── migrate.ts            # Runs schema on startup
│
├── uploads/                      # Uploaded PDF files (gitignored)
├── docs/                         # Documentation
└── package.json
```

---

## Resume Claim to Module Mapping

Every technology mentioned as a resume capability maps to exactly one module:

| Resume Claim | Module | Honest Status |
|---|---|---|
| Whisper-based transcription | M1: Speech Intelligence | Designed; not implemented |
| OCR extraction | M2: Document Intelligence | Designed; not implemented |
| LLM clinical structuring | M3: Clinical Structuring | Designed; `@google/genai` installed |
| ICD-10 / CPT coding | M4: Medical Coding | Designed; not implemented |
| REST APIs | All modules via Express routes | Designed; not implemented |
| Human-in-the-loop workflow | M7: Human Review | UI wireframes complete; backend not built |
| Playwright automation | M8: Submission Automation (portal path) | Designed; not implemented |
| n8n orchestration | M6: Workflow Orchestration (in-process MVP) | Designed; n8n is future migration target |
| Docker deployment | Cross-cutting infrastructure | Not designed yet |

---

## Testing Strategy Per Module

Each module's testability is the direct result of this architecture:

```
Unit test per module:
  1. Create test database with claim in correct pre-state
  2. Call module.process(claimId)
  3. Assert:
     a. Claim state advanced to expected next state
     b. Output written correctly to database
     c. Audit log entry created
     d. Next module triggered (or human notification sent)

Integration test:
  1. Create claim in CREATED state
  2. Upload a test PDF document
  3. Let M6 drive the pipeline automatically
  4. Assert claim reaches AWAITING_HUMAN_APPROVAL
  5. Simulate human approval
  6. Assert claim reaches SUBMITTED (with mock submission)
```

No module needs any other module to be running to be tested. Each test only needs: a database, the module under test, and a claim in the right pre-state.
