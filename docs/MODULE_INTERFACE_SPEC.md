# Module Interface Specification
# ClaimPilot India — Formal Module Contracts

**Version**: 1.0  
**Authority**: This document defines the contractual interface for every processing module. All implementation must conform to these signatures.  
**Cross-reference**: [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md) describes the module internals. This document defines the external-facing interface only.

---

## Interface Conventions

All modules follow these conventions:

1. **Single entry operation per module** — meaningful names, not generic `process()`
2. **Claim-scoped** — all operations take `claimId` as first argument
3. **Returns `ModuleResult`** — a consistent envelope across all modules
4. **Writes before returning** — output is persisted to DB before the result is returned
5. **Idempotent when safe** — re-running a module on a claim that already completed should detect and skip gracefully (not crash)

### Common Types

```
ModuleResult {
  success:             boolean
  claimId:             string
  moduleId:            string         // e.g., "M2_DOCUMENT_INTELLIGENCE"
  nextState:           ClaimState     // new state written to claims table
  processingMs:        number         // wall-clock time in milliseconds
  output:              object         // module-specific (see each interface)
  errors:              ModuleError[]
  warnings:            ModuleWarning[]
  requiresHumanReview: boolean
  humanReviewType:     HumanReviewType | null
  humanReviewReason:   string | null
}

ModuleError {
  code:    string    // e.g., "TESSERACT_TIMEOUT"
  message: string
  field:   string | null   // which field failed, if applicable
  fatal:   boolean         // if true, module cannot continue
}

ModuleWarning {
  code:    string
  message: string
}

HumanReviewType = "TRANSCRIPT" | "MISSING_DATA" | "CLINICAL_DATA" | "FINAL_APPROVAL"
```

---

## Module 1: SpeechModule

### `transcribe(claimId, audioFilePath, options)`

**Purpose**: Convert uploaded audio to a structured medical transcript. Optional entry path into the pipeline; claims can also enter via M2 directly.

**Method Signature**:
```
transcribe(
  claimId:     string,
  audioFilePath: string,
  options: {
    languageHint:  string,    // 'en-IN' | 'ta-IN' | 'te-IN' | 'hi-IN'
    speakerCount:  1 | 2,    // 1=dictation, 2=consultation
    requestId:     string    // correlation ID
  }
) → Promise<TranscribeResult>
```

**Inputs**:
- `claimId`: valid UUID, claim must be in `CREATED` state
- `audioFilePath`: absolute path to audio file, accessible on disk
- `languageHint`: ISO language code; defaults to `en-IN` if not provided
- `speakerCount`: used for diarization; 1 if dictation, 2 if full consultation recording

**Outputs** (`TranscribeResult` extends `ModuleResult`):
```
output: {
  documentId:           string     // ID of the TRANSCRIPT document record created
  transcriptWordCount:  number
  detectedLanguage:     string
  transcriptConfidence: number     // 0.0–1.0
  clinicalKeywords:     string[]
  requiresHumanReview:  boolean    // true if confidence < 0.75
}
```

**Consumes**:
- Audio file from disk
- Whisper API (OpenAI external call)

**Produces**:
- One `Document` record (`document_type = TRANSCRIPT`)
- One `Audit Event` (`TRANSCRIPTION_STARTED`, `TRANSCRIPTION_COMPLETED` or `TRANSCRIPTION_FAILED`)

**Database Tables Used**:
- `documents` (INSERT transcript record)
- `claims` (UPDATE status to `DOCUMENTS_UPLOADED`)
- `audit_log` (INSERT events)

**Dependencies**:
- External: OpenAI Whisper API (network required)
- Internal: none

**Side Effects**:
- Audio file is retained on disk (not deleted after transcription)
- If `transcriptConfidence < 0.75`: creates notification for human review

**Audit Events**:
- `TRANSCRIPTION_STARTED` — audio duration, language hint
- `TRANSCRIPTION_COMPLETED` — confidence, word count, speaker count
- `TRANSCRIPTION_FAILED` — error code, attempt number

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `AUDIO_FILE_NOT_FOUND` | File path invalid | Yes |
| `AUDIO_FORMAT_UNSUPPORTED` | Non-audio file | Yes |
| `WHISPER_API_TIMEOUT` | No response within 60s | No (retry) |
| `WHISPER_API_QUOTA` | Rate limit hit | No (retry after 60s) |
| `TRANSCRIPT_EMPTY` | Zero text returned | Yes |

**Retry Policy**:
- API timeout: max 3 attempts, exponential backoff (5s, 15s, 45s)
- Quota exceeded: 1 retry after 60s
- After all retries fail: `requiresHumanReview = true`, human must re-upload or re-record

**Example Request**:
```json
{
  "claimId": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "audioFilePath": "/uploads/clm_01j3k8/consultation_audio.mp3",
  "options": {
    "languageHint": "en-IN",
    "speakerCount": 2,
    "requestId": "req_7f3a91b2"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "claimId": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "moduleId": "M1_SPEECH_INTELLIGENCE",
  "nextState": "DOCUMENTS_UPLOADED",
  "processingMs": 18400,
  "requiresHumanReview": false,
  "humanReviewType": null,
  "output": {
    "documentId": "doc_transcript_rajesh",
    "transcriptWordCount": 743,
    "detectedLanguage": "en-IN",
    "transcriptConfidence": 0.87,
    "clinicalKeywords": ["lower right abdomen", "fever", "nausea"]
  },
  "errors": [],
  "warnings": []
}
```

**Future Extension Points**:
- `streamTranscribe()` — real-time transcription during live consultation
- `translateTranscript()` — translate regional language transcripts to English before M3

---

## Module 2: DocumentModule

### `extract(claimId, documentIds)`

**Purpose**: Run OCR on uploaded PDF documents and produce machine-readable text for clinical processing.

**Method Signature**:
```
extract(
  claimId:     string,
  documentIds: string[],   // which documents to process (all in claim by default)
  options: {
    language:    string,   // 'eng+tam' or other Tesseract language pack
    requestId:   string
  }
) → Promise<ExtractResult>
```

**Inputs**:
- `claimId`: claim must be in `DOCUMENTS_UPLOADED` state
- `documentIds`: specific documents to process; if empty, processes all documents for the claim
- `language`: Tesseract language pack; defaults based on `hospital.state`

**Outputs** (`ExtractResult` extends `ModuleResult`):
```
output: {
  documentsProcessed:    number
  documentsFailed:       number
  overallTextQuality:    "HIGH" | "MEDIUM" | "LOW" | "UNREADABLE"
  totalWordCount:        number
  mergedDocumentTextId:  string    // reference to the merged text blob
  missingDocumentTypes:  string[]  // types required but not uploaded
  blankPageCount:        number
}
```

**Consumes**:
- PDF files from disk
- Tesseract.js (local, no network required)
- pdf2pic (PDF-to-image conversion)

**Produces**:
- OCR result fields added to each `Document` record
- `merged_document_text` written to `claims` table
- Audit events

**Database Tables Used**:
- `documents` (UPDATE with OCR results)
- `claims` (UPDATE status to `OCR_COMPLETE`, write merged text)
- `audit_log` (INSERT events)

**Dependencies**:
- External: none (Tesseract runs locally)
- Internal: Document records must exist for the claim

**Side Effects**:
- Temporary PNG image files created during PDF conversion; deleted after OCR completes
- If `overallTextQuality = UNREADABLE`: generates `ACTION_REQUIRED` notification

**Audit Events**:
- `OCR_STARTED` — document count, page count
- `OCR_PAGE_FAILED` — page number, error (non-terminal)
- `OCR_COMPLETED` — per-document quality scores, merged word count
- `OCR_FAILED` — all error messages (terminal)

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `PDF_CONVERSION_FAILED` | Corrupt or encrypted PDF | Per-document (others continue) |
| `ALL_PAGES_BLANK` | Scanner produced empty output | Per-document |
| `ALL_DOCUMENTS_UNREADABLE` | No document produced readable text | Yes |
| `TESSERACT_CRASH` | OOM or process error | No (retry) |
| `TEMP_FILE_WRITE_FAILED` | Disk full | Yes |

**Retry Policy**:
- Per-document retry: 2 attempts
- After all retries: document marked `processing_status = FAILED`, processing continues with remaining documents
- If ALL documents fail: `ModuleResult.success = false`, claim → `OCR_FAILED`

**Example Response**:
```json
{
  "success": true,
  "moduleId": "M2_DOCUMENT_INTELLIGENCE",
  "nextState": "OCR_COMPLETE",
  "processingMs": 24300,
  "requiresHumanReview": false,
  "output": {
    "documentsProcessed": 3,
    "documentsFailed": 0,
    "overallTextQuality": "HIGH",
    "totalWordCount": 1847,
    "missingDocumentTypes": [],
    "blankPageCount": 0
  }
}
```

**Future Extension Points**:
- `extractWithVision(claimId, documentIds)` — uses Gemini Vision or GPT-4V instead of Tesseract
- `classifyDocuments(claimId)` — auto-detect document type from content, not user label

---

## Module 3: ClinicalModule

### `structure(claimId)`

**Purpose**: Use Gemini to extract structured clinical data from OCR text and transcripts. Produces the canonical Clinical Summary object consumed by all downstream modules.

**Method Signature**:
```
structure(
  claimId: string,
  options: {
    forceReprompt:  boolean,   // true = ignore existing result, re-run extraction
    requestId:      string
  }
) → Promise<StructureResult>
```

**Inputs**:
- `claimId`: claim must be in `OCR_COMPLETE` state
- `forceReprompt`: default false; set to true when human corrections require re-extraction

**Outputs** (`StructureResult` extends `ModuleResult`):
```
output: {
  clinicalSummaryId:    string
  extractionConfidence: number    // 0.0–1.0
  fieldsExtracted:      number
  missingFields:        string[]
  uncertainFields:      string[]
  promptVersion:        string
  requiresHumanReview:  boolean   // true if confidence < 0.65
}
```

**Consumes**:
- Merged document text from `claims` table
- Transcript text from `documents` table (if present)
- Gemini API (external network call)
- Prompt template from `server/modules/clinical-structuring/prompts/`

**Produces**:
- One `ClincialSummary` record in `claim_structured_data`
- Raw LLM response stored in audit table
- State transition to `STRUCTURING_COMPLETE`

**Database Tables Used**:
- `claims` (READ merged text, UPDATE status)
- `documents` (READ transcript if present)
- `claim_structured_data` (INSERT structured data)
- `audit_log` (INSERT events)

**Dependencies**:
- External: Gemini API (requires `GEMINI_API_KEY` in server environment)
- Internal: `extract()` must have completed (OCR text must be present)

**Side Effects**:
- Raw LLM response stored in `claim_structured_data.raw_llm_response` — never exposed via API
- If `confidence < 0.65`: creates `CLINICAL_DATA` review in M7

**Audit Events**:
- `STRUCTURING_STARTED` — prompt version, document count, input token estimate
- `STRUCTURING_COMPLETED` — confidence, field count, missing fields, prompt version
- `STRUCTURING_RETRY` — attempt number, failure code
- `STRUCTURING_FAILED` — all error codes

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `GEMINI_API_KEY_MISSING` | Key not in environment | Yes (config error) |
| `GEMINI_API_TIMEOUT` | No response within 30s | No (retry) |
| `GEMINI_QUOTA_EXCEEDED` | Rate limit hit | No (retry after 60s) |
| `JSON_PARSE_FAILED` | Response is not valid JSON | No (1 corrective retry) |
| `SCHEMA_VALIDATION_FAILED` | Response doesn't match schema | No (1 corrective retry) |
| `ZERO_FIELDS_EXTRACTED` | All fields are null/empty | Yes |

**Retry Policy**:
- API timeouts/5xx: 3 retries, 5s/15s/45s backoff
- JSON parse failure: 1 retry with stricter JSON enforcement instruction
- Quota exceeded: 1 retry after 60s
- After all retries: `success = false`, claim → `STRUCTURING_FAILED`

**Example Response**:
```json
{
  "success": true,
  "moduleId": "M3_CLINICAL_STRUCTURING",
  "nextState": "STRUCTURING_COMPLETE",
  "processingMs": 8200,
  "requiresHumanReview": false,
  "output": {
    "clinicalSummaryId": "cs_01j3k9m2p5q7r9s1t3",
    "extractionConfidence": 0.91,
    "fieldsExtracted": 11,
    "missingFields": [],
    "uncertainFields": [],
    "promptVersion": "PRE_AUTH_V1"
  }
}
```

**Future Extension Points**:
- `structureWithExamples(claimId, fewShotExamples)` — few-shot prompting for improved accuracy
- `compareExtractions(claimId, modelA, modelB)` — dual-model comparison for high-value claims

---

## Module 4: CodingModule

### `assignCodes(claimId)`

**Purpose**: Validate ICD-10 code suggestions from M3, detect conflicts, and determine if human coding review is required.

**Method Signature**:
```
assignCodes(
  claimId: string,
  options: {
    requestId: string
  }
) → Promise<CodingResult>
```

**Inputs**:
- `claimId`: claim must be in `STRUCTURING_COMPLETE` state
- Reads `claim_structured_data` for `diagnosisFreeText`, `suggestedIcdCodes`, `procedureFreeText`

**Outputs** (`CodingResult` extends `ModuleResult`):
```
output: {
  codesAssigned:        number
  conflictsDetected:    number
  blockingConflicts:    number
  codingConfidence:     number    // 0.0–1.0
  requiresHumanCoding:  boolean
  codeIds:              string[]  // IDs of created code records
  conflictIds:          string[]  // IDs of created conflict records
}
```

**Consumes**:
- Clinical Summary from `claim_structured_data`
- ICD-10 reference dataset (local JSON file, loaded at startup)
- Conflict rules (local JSON file, loaded at startup)
- Gemini API (only if M3's codes are invalid or absent — secondary fallback call)

**Produces**:
- Multiple `MedicalCode` records in `claim_codes`
- Zero or more `CodeConflict` records in `claim_code_conflicts`
- State transition to `CODING_COMPLETE`

**Database Tables Used**:
- `claim_structured_data` (READ)
- `claim_codes` (INSERT)
- `claim_code_conflicts` (INSERT)
- `claims` (UPDATE status)
- `audit_log` (INSERT)

**Dependencies**:
- Internal: `structure()` must have completed
- External: Gemini API (only as fallback, not primary)
- Data: ICD-10 dataset file must be loaded

**Side Effects**:
- If `requiresHumanCoding = true`: creates `CLINICAL_DATA` review in M7 (coding review subtype)

**Audit Events**:
- `CODING_STARTED`
- `CODE_VALIDATED` — code, description (one per valid code)
- `CODE_INVALID` — code, reason (one per rejected code)
- `CONFLICT_DETECTED` — conflict type, codes, severity
- `CODING_COMPLETED` — total codes, conflicts, confidence
- `CODING_REQUIRES_HUMAN` — reason

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `ICD10_DATASET_NOT_LOADED` | Reference dataset unavailable | Yes (system config error) |
| `CLINICAL_SUMMARY_NOT_FOUND` | M3 output missing | Yes |
| `NO_CODES_PRODUCEABLE` | M3 suggestions invalid + LLM fallback fails | No (→ human coding) |
| `LLM_FALLBACK_FAILED` | Gemini coding call failed | No (→ human coding) |

**Retry Policy**:
- LLM fallback call: 2 retries
- ICD-10 dataset lookup: synchronous, no retry needed
- After LLM retry failure: `requiresHumanCoding = true`, proceed to M5 with unvalidated codes flagged

**Example Response**:
```json
{
  "success": true,
  "moduleId": "M4_MEDICAL_CODING",
  "nextState": "CODING_COMPLETE",
  "processingMs": 1200,
  "requiresHumanReview": false,
  "output": {
    "codesAssigned": 2,
    "conflictsDetected": 0,
    "blockingConflicts": 0,
    "codingConfidence": 0.94,
    "requiresHumanCoding": false,
    "codeIds": ["code_k3580", "code_0dtj4zz"],
    "conflictIds": []
  }
}
```

**Future Extension Points**:
- `suggestOptimalCodes(claimId, insurerCode)` — suggest code variants that this specific insurer accepts most often
- `trainedCodeClassify(diagnosisText)` — call a fine-tuned classifier instead of LLM fallback

---

## Module 5: ValidationModule

### `validate(claimId)`

**Purpose**: Apply the insurer-specific ruleset to the claim. Detect missing fields, policy violations, and estimate submission readiness.

**Method Signature**:
```
validate(
  claimId:    string,
  options: {
    passNumber: number,    // 1 for first validation, 2+ for re-validation after data entry
    requestId:  string
  }
) → Promise<ValidationResult>
```

**Inputs**:
- `claimId`: claim must be in `CODING_COMPLETE` or `DATA_ENTRY_COMPLETE` state
- `passNumber`: tracks how many times this claim has been validated (for analytics)

**Outputs** (`ValidationResult` extends `ModuleResult`):
```
output: {
  validationReportId:    string
  validationStatus:      "PASSED" | "FAILED_MISSING_DATA" | "FAILED_HARD_RULES" | "PASSED_WITH_WARNINGS"
  completenessScore:     number    // 0.0–1.0
  readinessScore:        number    // 0.0–1.0
  hardFailureCount:      number
  missingFieldCount:     number
  warningCount:          number
  rulesetUsed:           string    // e.g., "STAR_HEALTH.PRE_AUTH.v1"
}
```

**Consumes**:
- Clinical Summary from `claim_structured_data`
- Medical Codes from `claim_codes`
- Document types from `documents`
- Insurer ruleset from local JSON file

**Produces**:
- One `ValidationReport` record in `claim_validation_results`
- State transition to `VALIDATION_PASSED` or `VALIDATION_FAILED_MISSING_DATA`
- If `FAILED_MISSING_DATA`: triggers M7 to create missing data review

**Database Tables Used**:
- `claim_structured_data` (READ)
- `claim_codes` (READ)
- `documents` (READ — document types)
- `claim_validation_results` (INSERT)
- `claims` (UPDATE status)
- `audit_log` (INSERT)

**Dependencies**:
- Internal: `assignCodes()` must have completed
- Data: Insurer ruleset file must be loaded

**Side Effects**:
- If `FAILED_MISSING_DATA`: calls `requestReview()` on M7

**Audit Events**:
- `VALIDATION_STARTED` — ruleset version, pass number
- `RULE_PASSED` — rule ID (one per passing rule)
- `RULE_FAILED` — rule ID, failure reason (one per failing rule)
- `VALIDATION_COMPLETED` — status, scores

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `RULESET_NOT_FOUND` | No ruleset for insurer+claim type | No (falls back to DEFAULT ruleset) |
| `RULESET_INVALID` | JSON schema error in ruleset file | Yes (developer error) |
| `CLINICAL_SUMMARY_NOT_FOUND` | M3 output missing | Yes |

**Retry Policy**:
- Validation is pure local computation — no external calls
- Database read failures: 2 retries at 100ms intervals
- No other retry scenarios

**Example Response**:
```json
{
  "success": true,
  "moduleId": "M5_CLAIM_VALIDATION",
  "nextState": "VALIDATION_PASSED",
  "processingMs": 45,
  "requiresHumanReview": false,
  "output": {
    "validationReportId": "vr_01j3l0m3q8r0s2t4",
    "validationStatus": "PASSED",
    "completenessScore": 1.0,
    "readinessScore": 0.95,
    "hardFailureCount": 0,
    "missingFieldCount": 0,
    "warningCount": 1,
    "rulesetUsed": "STAR_HEALTH.PRE_AUTH.v1"
  }
}
```

**Future Extension Points**:
- `estimateApprovalProbability(claimId)` — ML-based approval chance prediction
- `compareRulesets(claimId, rulesetA, rulesetB)` — evaluate same claim against two rulesets

---

## Module 6: WorkflowModule

### `orchestrate(event)`

**Purpose**: Receive state change events from all modules and determine the next action. The sole coordinator of module execution sequence.

**Method Signature**:
```
orchestrate(
  event: {
    claimId:   string,
    fromState: ClaimState,
    toState:   ClaimState,
    moduleId:  string,
    metadata:  object,
    requestId: string
  }
) → Promise<OrchestrateResult>
```

**Inputs**:
- `event`: emitted by any module when it transitions a claim's state
- `fromState` / `toState`: determines which action to take next

**Outputs** (`OrchestrateResult` extends `ModuleResult`):
```
output: {
  actionTaken:    "TRIGGER_MODULE" | "AWAIT_HUMAN" | "SCHEDULE_RETRY" | "TERMINAL"
  nextModuleId:   string | null
  scheduledAt:    ISO DateTime | null
  priority:       "URGENT" | "NORMAL" | "LOW"
}
```

**Consumes**: State change events (in-process event emission)

**Produces**: Job queue entries, human review requests (via M7), notifications

**Database Tables Used**:
- `claims` (READ current state for validation)
- `audit_log` (INSERT orchestration decisions)
- `notifications` (INSERT via M7)

**Dependencies**:
- All other modules (calls their operations based on state transitions)

**Side Effects**:
- Enqueues jobs in the in-process job queue
- May trigger M7.requestReview() for human intervention states

**Audit Events**:
- `ORCHESTRATION_DECISION` — event received, action taken, next module

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `UNKNOWN_TRANSITION` | fromState→toState not in routing table | No (logs error, claim stays) |
| `CIRCULAR_TRANSITION` | Same state reached 3+ times | Yes (claim escalated) |
| `MODULE_ENQUEUE_FAILED` | Cannot add job to queue | No (3 retries) |

**Retry Policy**:
- Job enqueue failure: 3 retries at 1s intervals
- After all retries: alert developer, claim flagged for manual investigation

**Future Extension Points**:
- `migrateToN8n()` — replace in-process queue with n8n webhook triggers when scale requires
- `predictIntervention(claimId)` — predict before processing starts if human will be needed

---

## Module 7: ReviewModule

### `requestReview(claimId, reviewType, reviewData)`

**Purpose**: Create a structured human review record and send notification. Pauses automated processing and waits.

**Method Signature**:
```
requestReview(
  claimId:    string,
  reviewType: "TRANSCRIPT" | "MISSING_DATA" | "CLINICAL_DATA" | "FINAL_APPROVAL",
  reviewData: {
    missingFields:       object[],   // for MISSING_DATA type
    clinicalSummaryId:   string,     // for CLINICAL_DATA type
    validationReportId:  string,     // for FINAL_APPROVAL type
    assignedTo:          string | null,  // user ID; null = any available reviewer
    priority:            "URGENT" | "NORMAL"
  },
  options: {
    requestId: string
  }
) → Promise<ReviewRequestResult>
```

**Inputs**:
- `claimId`: any claim state that triggers human review
- `reviewType`: determines which review UI screen is shown
- `reviewData`: context to display to the human reviewer

**Outputs** (`ReviewRequestResult` extends `ModuleResult`):
```
output: {
  reviewId:       string    // ID of created review record
  notificationId: string    // ID of notification sent
  assignedTo:     string | null
}
```

**Consumes**: Output from M3, M4, M5 (for context to display to reviewer)

**Produces**:
- One record in `human_review_decisions` (initially with no decision)
- One `Notification` in `notifications` table

**Database Tables Used**:
- `human_review_decisions` (INSERT pending review)
- `notifications` (INSERT notification)
- `claims` (UPDATE to appropriate AWAITING state)
- `audit_log` (INSERT)

**Dependencies**: None external. Reads context from other module outputs already in DB.

**Side Effects**:
- Automated pipeline pauses until `recordDecision()` is called

---

### `recordDecision(reviewId, decision)`

**Purpose**: Accept and persist a human reviewer's decision. Resumes pipeline via M6.

**Method Signature**:
```
recordDecision(
  reviewId:   string,
  decision: {
    reviewerId:       string,
    decision:         "APPROVED" | "REJECTED" | "DATA_PROVIDED" | "CORRECTED",
    corrections:      object | null,
    rejectionReason:  string | null
  },
  options: {
    requestId: string
  }
) → Promise<DecisionResult>
```

**Inputs**:
- `reviewId`: must reference an existing, undecided review record
- `reviewerId`: must be a valid user with appropriate role

**Outputs** (`DecisionResult` extends `ModuleResult`):
```
output: {
  reviewDecisionId:  string
  timeToDecisionSec: number
  nextState:         ClaimState   // state transitioned to after decision
}
```

**Produces**:
- Updates `human_review_decisions` with decision and timestamp
- Triggers M6 state event
- Sends completion notification if appropriate

**Audit Events**:
- `HUMAN_REVIEW_DECIDED` — reviewer ID, decision, time to decide

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `REVIEW_NOT_FOUND` | reviewId doesn't exist | Yes |
| `REVIEW_ALREADY_DECIDED` | Review has been decided (idempotency) | No (return existing result) |
| `REVIEWER_NOT_AUTHORIZED` | User role insufficient | Yes |
| `REJECTION_REASON_MISSING` | decision=REJECTED but no reason | Yes (validation) |

---

## Module 8: SubmissionModule

### `submit(claimId, attempt)`

**Purpose**: Deliver the approved claim to the insurer via REST API, portal automation, or manual fallback. Captures insurer response.

**Method Signature**:
```
submit(
  claimId:  string,
  attempt:  number,    // 1 for first submission, 2+ for denial resubmission
  options: {
    requestId: string
  }
) → Promise<SubmitResult>
```

**Inputs**:
- `claimId`: claim must be in `HUMAN_APPROVED` or `DENIAL_RESUBMIT_QUEUED` state
- `attempt`: tracked for denial analysis; max 3 before escalation

**Outputs** (`SubmitResult` extends `ModuleResult`):
```
output: {
  submissionId:             string
  method:                   "REST_API" | "RPA_PORTAL" | "MANUAL"
  insurerReferenceNumber:   string | null
  insurerStatus:            "ACCEPTED" | "REJECTED" | "PENDING" | "ERROR"
  rejectionCode:            string | null
  rejectionReason:          string | null
  expectedResponseDate:     string | null
}
```

**Consumes**:
- Clinical Summary, Medical Codes, Validation Report, Human Approval from DB
- Insurer configuration from `insurer_configs`
- Insurer-specific field mapping from `server/modules/submission-automation/mappings/`

**Produces**:
- One `SubmissionResult` record in `claim_submissions`
- State transition: `SUBMITTED` (on acceptance) or `INSURER_REJECTED` (on rejection)

**Database Tables Used**:
- All claim data tables (READ for payload construction)
- `insurer_configs` (READ for connection details)
- `claim_submissions` (INSERT)
- `claims` (UPDATE status)
- `audit_log` (INSERT)

**Dependencies**:
- External (API path): insurer REST API
- External (RPA path): Playwright (browser automation)
- Internal: Human approval must be present

**Side Effects**:
- RPA path: screenshots saved to disk as audit evidence
- On `INSURER_REJECTED`: triggers denial analysis via M6

**Audit Events**:
- `SUBMISSION_ATTEMPT` — attempt number, method, insurer
- `SUBMISSION_ACCEPTED` — insurer reference number, expected response date
- `SUBMISSION_REJECTED` — rejection code, reason
- `SUBMISSION_FAILED` — error code, will retry

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `INSURER_CONFIG_NOT_FOUND` | No configuration for insurer | Yes |
| `APPROVAL_NOT_FOUND` | No human approval on record | Yes |
| `PORTAL_LOGIN_FAILED` | Portal credentials invalid | Yes (human must fix) |
| `PORTAL_UI_CHANGED` | Playwright selector not found | Yes (developer must fix) |
| `API_REJECTED` | Insurer returned 4xx rejection | Yes (→ denial flow) |
| `API_SERVER_ERROR` | Insurer returned 5xx | No (retry) |

**Retry Policy**:
- API server errors: 3 retries, 30s/90s/270s backoff
- Portal errors: 2 retries (portal failures often transient)
- After all retries: `method = MANUAL`, human notified

**Future Extension Points**:
- `submitViaVisionPortal(claimId)` — vision model identifies form fields instead of hardcoded selectors
- `trackInsurerResponse(claimId)` — proactive polling for async insurer decisions

---

## Module 9: AnalyticsModule

### `aggregate(query)`

**Purpose**: Compute statistical summaries from the claims database for the dashboard, pipeline view, and reports. Read-only operation.

**Method Signature**:
```
aggregate(
  query: {
    queryType:   "KPI" | "PIPELINE" | "DENIAL_STATS" | "INSURER_PERFORMANCE" | "AUDIT_LOG" | "ACTIVITY_FEED",
    filters: {
      hospitalId:   string,
      dateFrom:     string | null,
      dateTo:       string | null,
      insurerCode:  string | null,
      claimType:    string | null,
      status:       string | null
    },
    pagination: {
      page:    number,
      limit:   number    // max 100
    },
    requestId: string
  }
) → Promise<AggregateResult>
```

**Inputs**: Query parameters — no claim state requirements (always readable)

**Outputs** (`AggregateResult` extends `ModuleResult`):
```
output: {
  queryType:     string
  data:          object    // shape varies by queryType (see CANONICAL_DATA_MODEL.md)
  totalCount:    number    // for paginated results
  computedAt:    string    // ISO DateTime
  cacheHit:      boolean   // true if result came from memory cache
}
```

**Consumes**: All claim tables via read-only SQL queries

**Produces**: No database writes. No state changes.

**Database Tables Used** (READ ONLY):
- `claims`, `documents`, `claim_structured_data`, `claim_codes`
- `claim_validation_results`, `claim_submissions`, `human_review_decisions`
- `audit_log`

**Dependencies**: None external

**Side Effects**: None (read-only)

**Caching**:
- Simple in-memory cache, 60-second TTL for KPI queries
- Pipeline/audit queries: no cache (always fresh)
- Cache invalidated on any claim state change

**Audit Events**: None (read-only operations are not audited)

**Error Conditions**:

| Code | Condition | Fatal |
|---|---|---|
| `DATABASE_QUERY_TIMEOUT` | Query exceeds 5s | No (returns partial) |
| `DATABASE_LOCKED` | Write in progress | No (retry after 100ms) |
| `INVALID_QUERY_TYPE` | Unknown queryType | Yes (validation) |
| `PAGINATION_LIMIT_EXCEEDED` | limit > 100 | Yes (validation) |

**Future Extension Points**:
- `naturalLanguageQuery(question)` — "Show me cardiac rejections from HDFC Ergo in Q3" as free text
- `forecast(metric, periods)` — predict future claim volumes or approval rates
