# Claim State Machine
# ClaimPilot India — Complete Claim Lifecycle Definition

**Version**: 1.0  
**Authority**: This document is the single source of truth for claim state transitions.  
**Cross-reference**: [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md) defines the modules that execute each transition.

---

## State Inventory

The system defines **30 distinct states** across 5 categories:

| Category | States |
|---|---|
| Ingestion | CREATED, DOCUMENTS_UPLOADED |
| Automated Processing | OCR_IN_PROGRESS, OCR_COMPLETE, OCR_FAILED, STRUCTURING_IN_PROGRESS, STRUCTURING_COMPLETE, STRUCTURING_FAILED, CODING_IN_PROGRESS, CODING_COMPLETE, CODING_FAILED, VALIDATION_IN_PROGRESS |
| Human Intervention | VALIDATION_FAILED_MISSING_DATA, AWAITING_HUMAN_DATA_ENTRY, DATA_ENTRY_COMPLETE, AWAITING_HUMAN_APPROVAL, HUMAN_APPROVED, HUMAN_REJECTED |
| Submission | SUBMISSION_QUEUED, SUBMISSION_IN_PROGRESS, SUBMISSION_FAILED, SUBMITTED, AWAITING_INSURER_RESPONSE |
| Resolution | INSURER_APPROVED, INSURER_REJECTED, DENIAL_ANALYSIS_IN_PROGRESS, DENIAL_RESUBMIT_QUEUED, DENIAL_ESCALATED, COMPLETE, ABANDONED, ARCHIVED |

---

## State Diagrams

### Success Path (Happy Path)

```
CREATED
  │
  │ [documents uploaded via API]
  ▼
DOCUMENTS_UPLOADED
  │
  │ [M6 triggers M2]
  ▼
OCR_IN_PROGRESS
  │
  │ [Tesseract completes successfully]
  ▼
OCR_COMPLETE
  │
  │ [M6 triggers M3]
  ▼
STRUCTURING_IN_PROGRESS
  │
  │ [Gemini returns valid structured data, confidence ≥ 0.65]
  ▼
STRUCTURING_COMPLETE
  │
  │ [M6 triggers M4]
  ▼
CODING_IN_PROGRESS
  │
  │ [codes validated, no BLOCKING conflicts]
  ▼
CODING_COMPLETE
  │
  │ [M6 triggers M5]
  ▼
VALIDATION_IN_PROGRESS
  │
  │ [all required fields present, all rules pass]
  ▼
VALIDATION_PASSED
  │
  │ [M6 triggers M7 for final approval]
  ▼
AWAITING_HUMAN_APPROVAL
  │
  │ [reviewer clicks Approve]
  ▼
HUMAN_APPROVED
  │
  │ [M6 enqueues submission]
  ▼
SUBMISSION_QUEUED
  │
  │ [M8 begins submission]
  ▼
SUBMISSION_IN_PROGRESS
  │
  │ [insurer API or portal accepts]
  ▼
SUBMITTED
  │
  │ [insurer returns approval decision]
  ▼
INSURER_APPROVED
  │
  │ [M9 records completion]
  ▼
COMPLETE ◄─── TERMINAL STATE (SUCCESS)
```

---

### Failure Path (Hard Failures)

```
[any processing state]
  │
  │ [module fails after all retries exhausted]
  ▼
[state]_FAILED
  │
  │ [M6 sends human notification]
  ▼
AWAITING_HUMAN_DATA_ENTRY ─── (if recoverable: user re-uploads document)
  │                                          │
  │ [not recoverable]                        │ [document re-uploaded]
  ▼                                          ▼
ABANDONED ◄─── TERMINAL STATE            OCR_IN_PROGRESS (restart)
  (FAILURE)
```

---

### Retry Path (Transient Failures)

```
OCR_IN_PROGRESS
  │
  │ [Tesseract times out — attempt 1]
  ▼
[retry after 5s]
  │
  │ [Tesseract times out — attempt 2]
  ▼
[retry after 15s]
  │
  │ [Tesseract times out — attempt 3]
  ▼
OCR_FAILED
  │
  │ [M6: human notified to re-upload]
  ▼
AWAITING_HUMAN_DATA_ENTRY
```

Same pattern applies to: STRUCTURING, CODING, SUBMISSION.

---

### Human Review Path (Missing Data)

```
VALIDATION_IN_PROGRESS
  │
  │ [M5: required fields missing]
  ▼
VALIDATION_FAILED_MISSING_DATA
  │
  │ [M7 creates review record]
  ▼
AWAITING_HUMAN_DATA_ENTRY ◄──── human sees Screen12
  │
  │ [human submits missing fields]
  ▼
DATA_ENTRY_COMPLETE
  │
  │ [M6 re-triggers M5]
  ▼
VALIDATION_IN_PROGRESS (second pass)
  │
  │ [all fields now present]
  ▼
VALIDATION_PASSED
  │
  │ [continues to AWAITING_HUMAN_APPROVAL]
  ▼
  ...
```

---

### Denial Recovery Path

```
SUBMITTED
  │
  │ [insurer returns rejection]
  ▼
INSURER_REJECTED
  │
  │ [M6 triggers denial analysis]
  ▼
DENIAL_ANALYSIS_IN_PROGRESS
  │
  ├─ [AI can auto-correct] ──► DENIAL_RESUBMIT_QUEUED
  │                                    │
  │                                    │ [human approves resubmission]
  │                                    ▼
  │                              SUBMISSION_QUEUED (attempt 2)
  │
  └─ [AI cannot resolve] ──► DENIAL_ESCALATED
                                      │
                                      │ [human handles manually]
                                      ▼
                               ABANDONED or COMPLETE
```

---

## Per-State Specifications

---

### CREATED

**Purpose**: A claim record has been created in the database. No documents have been received yet.

**Entry Conditions**:
- POST /api/claims received with valid claim type and patient information
- JWT authentication verified
- Hospital ID present

**Exit Conditions**:
- At least one document file accepted and written to disk
- Document record created in database

**Allowed Transitions**:
- CREATED → DOCUMENTS_UPLOADED (documents received)
- CREATED → ABANDONED (claim cancelled before upload)

**Invalid Transitions**:
- CREATED → any processing state (must have documents first)

**Terminal**: No

**Retry Behaviour**: None applicable — no processing occurs in this state

**Human Intervention Points**: None

**Audit Events**:
- `CLAIM_CREATED` — who created it, claim type, insurer, timestamp

**Timeout Behaviour**: If no documents uploaded within 24 hours → M7 sends reminder notification. If no documents within 72 hours → auto-ABANDONED.

**Failure Behaviour**: None

---

### DOCUMENTS_UPLOADED

**Purpose**: Documents have been received and persisted. OCR processing has not begun.

**Entry Conditions**: Files written to disk. Document records created in DB. File hash computed and stored.

**Exit Conditions**: M6 reads this state and enqueues M2.

**Allowed Transitions**:
- DOCUMENTS_UPLOADED → OCR_IN_PROGRESS (M6 triggers M2)
- DOCUMENTS_UPLOADED → ABANDONED (user cancels)

**Invalid Transitions**: None (M6 handles all transitions out of this state within seconds)

**Terminal**: No

**Retry Behaviour**: If M6 fails to enqueue M2, retries 3 times at 10s intervals. Alerts developer if all fail.

**Human Intervention Points**: None under normal conditions

**Audit Events**:
- `DOCUMENTS_UPLOADED` — file names, file sizes, document types, uploader ID

**Timeout Behaviour**: M6 should trigger M2 within 5 seconds. If claim stays here > 60 seconds, M6 trigger is assumed dead — alert developer.

**Failure Behaviour**: If document write to disk fails → `DOCUMENTS_UPLOAD_FAILED` (not a claim state; returns HTTP 500 to client).

---

### OCR_IN_PROGRESS

**Purpose**: Document text extraction is running. Tesseract is processing one or more PDF files.

**Entry Conditions**: M6 has triggered M2. Processing job is active.

**Exit Conditions**: All documents processed (successfully or with per-page failures). M2 writes aggregate result to DB.

**Allowed Transitions**:
- OCR_IN_PROGRESS → OCR_COMPLETE (M2 finishes with usable text)
- OCR_IN_PROGRESS → OCR_FAILED (all retries exhausted)

**Invalid Transitions**:
- OCR_IN_PROGRESS → STRUCTURING_IN_PROGRESS (must go through OCR_COMPLETE first)

**Terminal**: No

**Retry Behaviour**: On Tesseract crash or timeout: retry entire document (not individual pages). Max 3 attempts. Backoff: 5s, 15s, 45s.

**Human Intervention Points**: None during processing. Human notified only if terminal failure.

**Audit Events**:
- `OCR_STARTED` — document IDs, page count
- `OCR_PAGE_FAILED` — page number, error reason (non-terminal; processing continues)
- `OCR_COMPLETED` — per-document quality scores, total word count

**Timeout Behaviour**: Expected duration: < 60s per 5-page document. Hard timeout: 300s. If exceeded → treated as failure, retry triggered.

**Failure Behaviour**: After 3 retries → OCR_FAILED. Human notified. Option to re-upload document.

---

### OCR_COMPLETE

**Purpose**: All documents have been processed. Extracted text is stored in DB and ready for clinical structuring.

**Entry Conditions**:
- M2 has completed successfully
- `mergedDocumentText` written to DB
- At least one document has `textQuality != UNREADABLE`

**Exit Conditions**: M6 enqueues M3.

**Allowed Transitions**:
- OCR_COMPLETE → STRUCTURING_IN_PROGRESS

**Invalid Transitions**: Cannot return to any OCR state

**Terminal**: No

**Audit Events**:
- `OCR_COMPLETE` — overall quality score, missing document types

---

### OCR_FAILED

**Purpose**: OCR could not produce usable text after all retries. Human action required.

**Entry Conditions**: All retry attempts for M2 exhausted.

**Exit Conditions**:
- Human re-uploads better-quality document → DOCUMENTS_UPLOADED
- Human abandons claim → ABANDONED

**Allowed Transitions**:
- OCR_FAILED → DOCUMENTS_UPLOADED (re-upload)
- OCR_FAILED → ABANDONED

**Terminal**: No (recoverable via re-upload)

**Retry Behaviour**: No automated retry from this state. Human must take action.

**Human Intervention Points**: REQUIRED — human must re-upload or abandon

**Audit Events**:
- `OCR_FAILED` — all error messages from 3 attempts, document IDs, timestamp

**Timeout Behaviour**: If no human action within 48 hours → reminder notification. If 96 hours → auto-ABANDONED.

---

### STRUCTURING_IN_PROGRESS

**Purpose**: Gemini is extracting structured clinical data from the OCR output.

**Entry Conditions**: OCR_COMPLETE. Merged document text available. Gemini API key present.

**Exit Conditions**: M3 writes structured data to DB.

**Allowed Transitions**:
- STRUCTURING_IN_PROGRESS → STRUCTURING_COMPLETE
- STRUCTURING_IN_PROGRESS → STRUCTURING_FAILED

**Terminal**: No

**Retry Behaviour**: API timeout/5xx: max 3 retries, 5s/15s/45s backoff. JSON parse failure: 1 retry with corrected prompt. Quota exceeded: retry after 60s (single retry).

**Human Intervention Points**: None during processing

**Audit Events**:
- `STRUCTURING_STARTED` — prompt version, document count
- `STRUCTURING_COMPLETED` — confidence score, field count, uncertain fields
- `STRUCTURING_RETRY` — attempt number, failure reason

**Timeout Behaviour**: Hard timeout per Gemini call: 30s. If all retries time out → STRUCTURING_FAILED.

**Failure Behaviour**: After exhaustion → STRUCTURING_FAILED. Human sees document quality issue notification.

---

### STRUCTURING_COMPLETE

**Purpose**: Structured clinical data extracted. ICD-10 code suggestions available from M3.

**Entry Conditions**: M3 has written `claim_structured_data` record. `extractionConfidence` computed.

**Exit Conditions**: Depends on confidence:
- Confidence ≥ 0.85: M6 immediately triggers M4
- Confidence 0.65–0.85: M6 triggers M4 but flags for human spot-check
- Confidence < 0.65: M7 creates clinical data review before M4

**Allowed Transitions**:
- STRUCTURING_COMPLETE → CODING_IN_PROGRESS (auto, high confidence)
- STRUCTURING_COMPLETE → AWAITING_HUMAN_DATA_ENTRY (low confidence, human corrects fields first)

**Audit Events**:
- `STRUCTURING_COMPLETE` — confidence, fields extracted, missing fields

---

### STRUCTURING_FAILED

**Purpose**: LLM structuring could not produce usable output after all retries.

**Entry Conditions**: All M3 retries exhausted. Zero usable fields extracted.

**Exit Conditions**: Human reviews document quality. Options: re-upload better documents, or manually enter structured data.

**Allowed Transitions**:
- STRUCTURING_FAILED → DOCUMENTS_UPLOADED (re-upload)
- STRUCTURING_FAILED → AWAITING_HUMAN_DATA_ENTRY (manual data entry path)
- STRUCTURING_FAILED → ABANDONED

**Human Intervention Points**: REQUIRED

**Audit Events**:
- `STRUCTURING_FAILED` — all error messages, raw LLM responses

**Timeout Behaviour**: 48h without human action → reminder. 96h → ABANDONED.

---

### CODING_IN_PROGRESS

**Purpose**: ICD-10 codes are being validated and conflicts detected.

**Entry Conditions**: STRUCTURING_COMPLETE (or DATA_ENTRY_COMPLETE if human corrected data). `diagnosisFreeText` and `suggestedIcdCodes` present.

**Exit Conditions**: M4 writes `claim_codes` and `claim_code_conflicts` records.

**Allowed Transitions**:
- CODING_IN_PROGRESS → CODING_COMPLETE (codes validated, conflicts assessed)
- CODING_IN_PROGRESS → CODING_FAILED (all retries exhausted)

**Retry Behaviour**: LLM coding call: 2 retries. ICD-10 lookup failures: 2 retries (local, should be near-instant).

**Audit Events**:
- `CODING_STARTED`
- `CODING_CONFLICT_DETECTED` — conflict type, codes involved, severity
- `CODING_COMPLETED` — confirmed codes, conflict count

---

### CODING_COMPLETE

**Purpose**: Codes assessed. May have conflicts that need resolution, or may be clean.

**Entry Conditions**: M4 has written all records. `requiresHumanCoding` flag set.

**Exit Conditions**:
- `requiresHumanCoding = false`: M6 triggers M5 immediately
- `requiresHumanCoding = true`: M7 creates coding review

**Allowed Transitions**:
- CODING_COMPLETE → VALIDATION_IN_PROGRESS (clean codes)
- CODING_COMPLETE → AWAITING_HUMAN_DATA_ENTRY (human must resolve conflicts)

---

### CODING_FAILED

**Purpose**: Coding module could not produce valid codes after retries.

**Entry Conditions**: All M4 retries exhausted. No valid ICD-10 codes confirmed.

**Allowed Transitions**:
- CODING_FAILED → AWAITING_HUMAN_DATA_ENTRY (human assigns codes manually)
- CODING_FAILED → ABANDONED

---

### VALIDATION_IN_PROGRESS

**Purpose**: Structured, coded claim being validated against insurer-specific rules.

**Entry Conditions**: CODING_COMPLETE (or DATA_ENTRY_COMPLETE on second pass). Insurer ruleset loaded.

**Exit Conditions**: M5 writes validation results.

**Allowed Transitions**:
- VALIDATION_IN_PROGRESS → VALIDATION_PASSED (all required fields present, hard rules pass)
- VALIDATION_IN_PROGRESS → VALIDATION_FAILED_MISSING_DATA (required fields absent)

**Retry Behaviour**: Validation is a local computation. Database read failures: 2 retries. No API retries needed.

**Audit Events**:
- `VALIDATION_STARTED` — ruleset version, claim type
- `VALIDATION_COMPLETED` — status, hard failure count, missing field count, readiness score

---

### VALIDATION_FAILED_MISSING_DATA

**Purpose**: Validation identified specific required fields that are absent. Human must provide them.

**Entry Conditions**: M5 has set `validationStatus = FAILED_MISSING_DATA`. `missingFields` list written.

**Exit Conditions**: Human provides all missing fields via Screen12 UI.

**Allowed Transitions**:
- VALIDATION_FAILED_MISSING_DATA → AWAITING_HUMAN_DATA_ENTRY (M7 creates review)

**Terminal**: No

**Human Intervention Points**: REQUIRED — user sees Screen12 (Missing Data screen)

**Audit Events**:
- `MISSING_DATA_DETECTED` — field names, field descriptions

---

### AWAITING_HUMAN_DATA_ENTRY

**Purpose**: Claim is paused. System is waiting for a human to provide missing data or correct extracted fields.

**Entry Conditions**: M7 has created a human review record of type MISSING_DATA or CLINICAL_DATA.

**Exit Conditions**: Human submits data via the review UI.

**Allowed Transitions**:
- AWAITING_HUMAN_DATA_ENTRY → DATA_ENTRY_COMPLETE (human submits)
- AWAITING_HUMAN_DATA_ENTRY → ABANDONED (human cancels)

**Terminal**: No

**Retry Behaviour**: No automated retry. System waits indefinitely with timeout.

**Human Intervention Points**: REQUIRED — this state exists only because human action is needed

**Audit Events**:
- `HUMAN_DATA_ENTRY_REQUESTED` — review type, reviewer assigned, fields requested
- `HUMAN_DATA_ENTRY_COMPLETED` — reviewer ID, fields provided, timestamp

**Timeout Behaviour**: 48h without action → escalation notification to admin. 96h → secondary notification. No auto-abandonment without admin decision.

**Failure Behaviour**: If human provides data that still fails validation → VALIDATION_IN_PROGRESS again (not a failure state; just a loop).

---

### DATA_ENTRY_COMPLETE

**Purpose**: Human has provided the requested data. System resumes automated processing.

**Entry Conditions**: Human review decision written with `decision = DATA_PROVIDED` or `decision = CORRECTED`.

**Exit Conditions**: M6 determines where to resume:
- If data was for missing fields → VALIDATION_IN_PROGRESS (re-validate)
- If data was for clinical corrections → CODING_IN_PROGRESS (re-code with corrections)

**Allowed Transitions**:
- DATA_ENTRY_COMPLETE → VALIDATION_IN_PROGRESS
- DATA_ENTRY_COMPLETE → CODING_IN_PROGRESS

**Audit Events**:
- `PROCESSING_RESUMED` — from state, to state, reviewer ID

---

### VALIDATION_PASSED

**Purpose**: Claim has passed all automated validation checks. Ready for human approval.

**Entry Conditions**: M5 `validationStatus = PASSED`. All required fields present. No blocking rule failures. Code conflicts either absent or resolved.

**Exit Conditions**: M7 creates final approval review.

**Allowed Transitions**:
- VALIDATION_PASSED → AWAITING_HUMAN_APPROVAL

**Audit Events**:
- `VALIDATION_PASSED` — readiness score, completion score

---

### AWAITING_HUMAN_APPROVAL

**Purpose**: Claim is complete and validated. A designated reviewer must authorize submission.

**Entry Conditions**: VALIDATION_PASSED. M7 has created HR-4 (Final Approval) review record.

**Exit Conditions**: Reviewer makes decision.

**Allowed Transitions**:
- AWAITING_HUMAN_APPROVAL → HUMAN_APPROVED
- AWAITING_HUMAN_APPROVAL → HUMAN_REJECTED

**Terminal**: No

**Retry Behaviour**: None

**Human Intervention Points**: REQUIRED — gate before submission (corresponds to Screen14)

**Audit Events**:
- `APPROVAL_REQUESTED` — reviewer assigned, claim summary
- `CLAIM_APPROVED` — reviewer ID, timestamp
- `CLAIM_REJECTED` — reviewer ID, rejection reason, timestamp

**Timeout Behaviour**: 24h without action → urgent notification. 48h → escalate to admin.

**Failure Behaviour**: Timeout does not auto-approve. Admin must explicitly act.

---

### HUMAN_APPROVED

**Purpose**: A human has authorized submission. Claim is queued for delivery to insurer.

**Entry Conditions**: Human review decision `decision = APPROVED`. Reviewer ID not null.

**Exit Conditions**: M6 enqueues submission job.

**Allowed Transitions**:
- HUMAN_APPROVED → SUBMISSION_QUEUED

**Audit Events**:
- `SUBMISSION_QUEUED` — approved by, queued at, priority level

---

### HUMAN_REJECTED

**Purpose**: A human reviewer explicitly rejected the claim. No submission will occur.

**Entry Conditions**: Human review decision `decision = REJECTED`. Rejection reason provided.

**Exit Conditions**: Claim is terminal.

**Allowed Transitions**:
- HUMAN_REJECTED → ABANDONED (admin confirms)

**Terminal**: TERMINAL (FAILURE path)

**Audit Events**:
- `CLAIM_REJECTED_BY_HUMAN` — reviewer ID, reason, timestamp

---

### SUBMISSION_QUEUED

**Purpose**: Claim is awaiting its turn in the submission job queue.

**Entry Conditions**: HUMAN_APPROVED. Submission job created in queue.

**Exit Conditions**: M8 dequeues and begins submission.

**Allowed Transitions**:
- SUBMISSION_QUEUED → SUBMISSION_IN_PROGRESS

---

### SUBMISSION_IN_PROGRESS

**Purpose**: M8 is actively submitting to the insurer via API or portal automation.

**Entry Conditions**: M8 dequeued submission job. Insurer configuration loaded and valid.

**Exit Conditions**: Insurer responds (or submission attempt fails).

**Allowed Transitions**:
- SUBMISSION_IN_PROGRESS → SUBMITTED (insurer accepted)
- SUBMISSION_IN_PROGRESS → SUBMISSION_FAILED (attempt failed, retrying)
- SUBMISSION_IN_PROGRESS → INSURER_REJECTED (insurer returned rejection immediately)

**Retry Behaviour**: Per-attempt timeout 60s. Max 3 attempts total. Backoff: 30s, 90s, 270s between attempts.

**Audit Events**:
- `SUBMISSION_ATTEMPT` — attempt number, method (API/RPA), timestamp
- `SUBMISSION_ATTEMPT_FAILED` — reason, will_retry
- `SUBMISSION_SUCCESS` — insurer reference number, method

---

### SUBMISSION_FAILED

**Purpose**: All submission attempts have been exhausted. Manual intervention required.

**Entry Conditions**: 3 submission attempts failed. No insurer reference number received.

**Allowed Transitions**:
- SUBMISSION_FAILED → SUBMISSION_QUEUED (manual retry after human fixes issue)
- SUBMISSION_FAILED → ABANDONED

**Terminal**: No (recoverable)

**Human Intervention Points**: REQUIRED — human must resolve submission issue (credential expiry, portal change)

**Audit Events**:
- `SUBMISSION_ALL_ATTEMPTS_FAILED` — all 3 failure reasons

---

### SUBMITTED

**Purpose**: Insurer has accepted the claim for processing. Awaiting insurer decision.

**Entry Conditions**: M8 received acknowledgment from insurer. Reference number stored.

**Exit Conditions**: Insurer returns decision (by webhook, polling, or portal check).

**Allowed Transitions**:
- SUBMITTED → INSURER_APPROVED
- SUBMITTED → INSURER_REJECTED

**Terminal**: No

**Audit Events**:
- `CLAIM_SUBMITTED` — insurer reference number, method, timestamp

**Timeout Behaviour**: If no insurer response within 10 business days → alert for manual follow-up.

---

### INSURER_APPROVED

**Purpose**: Insurer has approved the claim. Payment expected.

**Entry Conditions**: Insurer decision received via API webhook or portal polling.

**Exit Conditions**: M9 records analytics. Claim archived.

**Allowed Transitions**:
- INSURER_APPROVED → COMPLETE

**Audit Events**:
- `INSURER_APPROVED` — approved amount, expected payment date, reference number

---

### INSURER_REJECTED

**Purpose**: Insurer has rejected the claim after submission. Denial recovery begins.

**Entry Conditions**: Insurer returned rejection response. Rejection reason captured.

**Exit Conditions**: M6 triggers denial analysis.

**Allowed Transitions**:
- INSURER_REJECTED → DENIAL_ANALYSIS_IN_PROGRESS

**Audit Events**:
- `INSURER_REJECTED` — rejection code, rejection reason text, attempt number

---

### DENIAL_ANALYSIS_IN_PROGRESS

**Purpose**: System (M3 + M4 re-run) analyzes the rejection and determines if auto-correction is possible.

**Exit Conditions**: Analysis complete. Decision: auto-correct or escalate.

**Allowed Transitions**:
- DENIAL_ANALYSIS_IN_PROGRESS → DENIAL_RESUBMIT_QUEUED (auto-correction possible)
- DENIAL_ANALYSIS_IN_PROGRESS → DENIAL_ESCALATED (AI cannot resolve)

**Audit Events**:
- `DENIAL_ANALYSIS_COMPLETE` — recommended action, confidence, reason

---

### DENIAL_RESUBMIT_QUEUED

**Purpose**: AI has determined corrections. Human must approve before resubmission.

**Exit Conditions**: Human approves resubmission.

**Allowed Transitions**:
- DENIAL_RESUBMIT_QUEUED → AWAITING_HUMAN_APPROVAL (for resubmission review)

---

### DENIAL_ESCALATED

**Purpose**: AI cannot resolve the denial. Human must handle manually.

**Exit Conditions**: Human action — resolves or abandons.

**Allowed Transitions**:
- DENIAL_ESCALATED → ABANDONED (human gives up)
- DENIAL_ESCALATED → COMPLETE (human submits manually and marks resolved)

**Terminal**: Effectively terminal unless human intervenes

**Human Intervention Points**: REQUIRED — corresponds to Screen14 in wireframe

---

### COMPLETE

**Purpose**: Claim lifecycle is finished. Either insurer-approved or manually resolved.

**Entry Conditions**: INSURER_APPROVED transition, or admin marks DENIAL_ESCALATED as manually resolved.

**Allowed Transitions**:
- COMPLETE → ARCHIVED (after 90 days, administrative archival)

**Terminal**: Yes (SUCCESS)

**Audit Events**:
- `CLAIM_COMPLETE` — final amount, resolution method, total processing time

---

### ABANDONED

**Purpose**: Claim was terminated before completion. Not a processing failure — a deliberate end.

**Entry Conditions**: Human chose to abandon, or timeout auto-abandoned.

**Allowed Transitions**: None

**Terminal**: Yes (FAILURE/CANCELLED)

**Audit Events**:
- `CLAIM_ABANDONED` — reason, abandoned by, timestamp

---

### ARCHIVED

**Purpose**: Completed claim moved to cold storage after retention period.

**Entry Conditions**: COMPLETE or ABANDONED + 90 days elapsed.

**Allowed Transitions**: None

**Terminal**: Yes (FINAL)

---

## State Transition Rules (Enforcement)

The state machine enforces these invariants in the `claims` table update logic:

1. **No backward transitions** without an explicit `override_reason` field and admin authorization
2. **Only one active processing job per claim** — a claim in `OCR_IN_PROGRESS` cannot simultaneously enter `STRUCTURING_IN_PROGRESS`
3. **Every state change writes to `audit_log`** — there is no state change without an audit record
4. **Human states require human identity** — transitions out of `AWAITING_*` states require a `reviewer_id` that is a valid user ID

---

## Claim Age Limits

| Scenario | Limit | Action |
|---|---|---|
| No documents after CREATED | 72 hours | Auto-ABANDONED |
| AWAITING_HUMAN_DATA_ENTRY | 96 hours (with 48h reminder) | Admin notification |
| AWAITING_HUMAN_APPROVAL | 48 hours (with 24h reminder) | Admin notification |
| SUBMITTED with no insurer response | 10 business days | Manual follow-up notification |

---

## State Count Summary

| Terminal States | Count |
|---|---|
| Success terminal | COMPLETE, ARCHIVED |
| Failure terminal | ABANDONED |
| Total states | 30 |
| Human-required states | 6 (AWAITING_HUMAN_DATA_ENTRY, AWAITING_HUMAN_APPROVAL, OCR_FAILED, STRUCTURING_FAILED, SUBMISSION_FAILED, DENIAL_ESCALATED) |
