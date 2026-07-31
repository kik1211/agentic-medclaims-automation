# Failure Recovery
# ClaimPilot India — Per-Module Failure Handling Reference

**Version**: 1.0  
**Authority**: Defines the exact response to every failure scenario in the system.  
**Cross-reference**: [MODULE_INTERFACE_SPEC.md](./MODULE_INTERFACE_SPEC.md) defines error codes. [STATE_MACHINE.md](./STATE_MACHINE.md) defines failure states.

---

## Failure Classification

All failures fall into one of four categories:

| Class | Definition | Response |
|---|---|---|
| **Transient** | Temporary condition (network timeout, rate limit) | Retry with backoff |
| **Recoverable** | Permanent issue the user can fix (bad document, missing data) | Human action + retry |
| **Configuration** | System misconfiguration (missing API key, wrong credentials) | Developer action required |
| **Terminal** | Unrecoverable failure (corrupt file, insurer permanently rejected) | Human decision: resubmit or abandon |

---

## Module 1: Speech Intelligence — Failure Recovery

### F1-01: Audio File Not Found
- **Detection**: `fs.existsSync(audioFilePath)` returns false
- **Class**: Recoverable
- **Retry Policy**: None — the file is not going to appear by itself
- **Max Retries**: 0
- **Fallback**: Notify user to re-upload the audio file
- **Human Escalation**: Immediate — notification generated
- **Logging**: `ERROR: AUDIO_FILE_NOT_FOUND`, filePath, claimId, requestId
- **Alert**: None (user-facing issue, not system error)
- **Recovery Procedure**: User re-uploads audio; orchestrator re-triggers M1
- **User Experience**: "The audio file could not be found. Please re-upload the consultation recording."

### F1-02: Audio Format Unsupported
- **Detection**: MIME type check fails; accepted types: audio/mpeg, audio/wav, audio/mp4, audio/ogg
- **Class**: Recoverable (user error)
- **Retry Policy**: None
- **Fallback**: User uploads correct format
- **Logging**: `ERROR: AUDIO_FORMAT_UNSUPPORTED`, detected MIME type
- **User Experience**: "Only MP3, WAV, and M4A audio files are accepted. The uploaded file appears to be [detected type]."

### F1-03: Whisper API Timeout
- **Detection**: API call exceeds 60-second timeout
- **Class**: Transient
- **Retry Policy**: 3 attempts, exponential backoff: 5s → 15s → 45s
- **Max Retries**: 3
- **Fallback**: After 3 failures → human notified; claim stays in `AWAITING_HUMAN_DATA_ENTRY`; user can re-upload or skip audio entirely
- **Human Escalation**: After attempt 3
- **Logging**: `WARN: WHISPER_API_TIMEOUT`, attempt number, duration, requestId
- **Alert**: After attempt 3 → Slack/email alert to developer (Whisper may be having outage)
- **User Experience**: Processing indicator shown. If all retries fail: "The audio transcription service is experiencing delays. You can skip the audio step and upload documents directly."

### F1-04: Whisper API Quota Exceeded
- **Detection**: HTTP 429 response
- **Class**: Transient
- **Retry Policy**: 1 retry after 60 seconds
- **Logging**: `WARN: WHISPER_QUOTA_EXCEEDED`, remaining quota headers if provided
- **Alert**: Log cumulative quota events; alert if > 10 quota events per hour (cost runaway risk)
- **User Experience**: "Processing will resume shortly. Please wait."

### F1-05: Low Confidence Transcript
- **Detection**: `transcriptConfidence < 0.75`
- **Class**: Not a failure — a quality warning
- **Retry Policy**: None (Whisper has already done its best)
- **Fallback**: Human reviews transcript for corrections before M3 is triggered
- **Logging**: `WARN: LOW_CONFIDENCE_TRANSCRIPT`, confidence score, claim ID
- **User Experience**: "The transcription quality is lower than expected (confidence: X%). Please review the transcript before continuing."

---

## Module 2: Document Intelligence — Failure Recovery

### F2-01: PDF Conversion Failed
- **Detection**: pdf2pic throws exception or returns empty image array
- **Class**: Recoverable
- **Retry Policy**: 2 attempts per document
- **Max Retries**: 2
- **Fallback**: Document marked as `processing_status = FAILED`; other documents continue processing; if ALL documents fail → claim → `OCR_FAILED`
- **Human Escalation**: If all documents fail
- **Logging**: `ERROR: PDF_CONVERSION_FAILED`, fileName, errorMessage
- **Recovery Procedure**: User re-uploads a non-corrupted, non-encrypted PDF
- **User Experience**: "One of your documents could not be read. Please re-upload [filename] as a non-password-protected PDF."

### F2-02: All Pages Blank
- **Detection**: All pages have pixel density below blank-detection threshold
- **Class**: Recoverable
- **Retry Policy**: None (re-scanning the document cannot be automated)
- **Fallback**: Document flagged; user notified to re-scan at higher DPI
- **Logging**: `WARN: ALL_PAGES_BLANK`, fileName, pageCount
- **User Experience**: "Document [filename] appears to be blank (possibly a scanning error). Please re-scan at 300 DPI minimum."

### F2-03: Low OCR Quality (All Documents)
- **Detection**: `overallTextQuality = UNREADABLE` (average confidence < 20%)
- **Class**: Recoverable
- **Retry Policy**: None (re-running Tesseract on the same images won't improve quality)
- **Fallback**: Human enters data manually, OR user uploads better scans
- **Logging**: `ERROR: ALL_DOCUMENTS_UNREADABLE`, average confidence
- **User Experience**: "The document quality is too low for automatic processing. Please upload higher-quality scans, or contact your billing officer to enter the data manually."

### F2-04: Tesseract Process Crash
- **Detection**: Child process exits with non-zero code, or OOM kill
- **Class**: Transient
- **Retry Policy**: 2 retries (full document), no backoff (crash is usually OOM which clears quickly)
- **Fallback**: After 2 retries → document marked as failed; others continue
- **Logging**: `ERROR: TESSERACT_CRASH`, exitCode, documentId, memoryUsageAtTime
- **Alert**: If 3+ crashes within 1 hour → developer alert (memory leak or large file issue)
- **Recovery Procedure**: Restart server process if memory leak confirmed

### F2-05: Disk Full During Image Conversion
- **Detection**: ENOSPC error on image write
- **Class**: Configuration / Infrastructure
- **Retry Policy**: None
- **Fallback**: None automated — system is broken until disk space freed
- **Human Escalation**: Immediate developer alert
- **Logging**: `CRITICAL: DISK_FULL`, availableSpace, requiredSpace
- **Alert**: PagerDuty/email immediate — this affects all processing
- **User Experience**: "The system is temporarily unavailable. Please try again in a few minutes." (generic — do not expose disk details)

---

## Module 3: Clinical Structuring — Failure Recovery

### F3-01: Gemini API Key Missing
- **Detection**: Environment variable `GEMINI_API_KEY` is undefined or empty at module load time
- **Class**: Configuration
- **Retry Policy**: None — this is a deployment error
- **Fallback**: None — M3 cannot function without an API key
- **Human Escalation**: Immediate developer alert at server startup
- **Logging**: `CRITICAL: GEMINI_API_KEY_MISSING` — logged at startup, blocks M3 from accepting jobs
- **Alert**: Server health check endpoint returns `{ "m3": "degraded", "reason": "API key not configured" }`
- **User Experience**: "AI processing is currently unavailable. Claims can be entered manually."

### F3-02: Gemini API Timeout
- **Detection**: API call exceeds 30-second timeout
- **Class**: Transient
- **Retry Policy**: 3 retries, 5s → 15s → 45s backoff
- **Max Retries**: 3
- **Fallback**: After all retries → `STRUCTURING_FAILED`, human notified
- **Logging**: `WARN: GEMINI_API_TIMEOUT`, attempt, requestId, tokensEstimated
- **Alert**: After attempt 3 → log cumulative timeout count per hour; alert at > 5/hour

### F3-03: Gemini Returns Non-JSON
- **Detection**: `JSON.parse(response.text)` throws
- **Class**: Transient (model behavior can vary)
- **Retry Policy**: 1 retry with corrected prompt that includes explicit JSON schema instruction
- **Max Retries**: 1
- **Fallback**: After retry fails → `STRUCTURING_FAILED`
- **Logging**: `WARN: JSON_PARSE_FAILED`, rawResponse (first 500 chars), claimId
- **Recovery Procedure**: Store failing prompt + response for prompt engineering review

### F3-04: Structuring Produces Zero Fields
- **Detection**: All required fields in response are null or empty strings
- **Class**: Recoverable (documents are too poor quality for LLM extraction)
- **Retry Policy**: None (retrying same documents won't help)
- **Fallback**: Human manually enters structured data via data entry screen
- **Logging**: `ERROR: ZERO_FIELDS_EXTRACTED`, documentQuality, promptVersion
- **User Experience**: "The AI could not read enough information from your documents. A billing officer will enter the data manually."

### F3-05: Extraction Confidence Below Threshold
- **Detection**: `extractionConfidence < 0.65` after successful extraction
- **Class**: Not a failure — quality gate
- **Action**: Human reviews extracted fields before M4 proceeds
- **Logging**: `WARN: LOW_EXTRACTION_CONFIDENCE`, confidence, uncertainFields

---

## Module 4: Medical Coding — Failure Recovery

### F4-01: ICD-10 Dataset Not Loaded
- **Detection**: `icd10Dataset.isLoaded()` returns false at module initialization
- **Class**: Configuration
- **Retry Policy**: None — this is a deployment setup error
- **Fallback**: None — coding cannot proceed without reference data
- **Logging**: `CRITICAL: ICD10_DATASET_NOT_LOADED`
- **Alert**: Server health check returns M4 as degraded
- **Recovery Procedure**: Verify `server/modules/medical-coding/data/icd10.json` exists and is valid

### F4-02: No Valid Codes Produceable
- **Detection**: M3 suggestions are all invalid AND LLM fallback also fails to produce valid codes
- **Class**: Recoverable
- **Retry Policy**: None (problem is data quality, not transient)
- **Fallback**: `requiresHumanCoding = true` — human assigns codes manually
- **Logging**: `WARN: NO_CODES_PRODUCEABLE`, diagnosisFreeText (first 200 chars)
- **User Experience**: "The system could not automatically assign medical codes. A billing officer will assign them manually."

### F4-03: Blocking Conflict Detected
- **Detection**: `conflicts[]` contains at least one entry with `severity = BLOCKING`
- **Class**: Not a failure — a coding quality issue
- **Action**: `requiresHumanCoding = true`, human resolves conflicts in coding review screen
- **Logging**: `WARN: BLOCKING_CONFLICT_DETECTED`, conflictType, codesInvolved

---

## Module 5: Claim Validation — Failure Recovery

### F5-01: Ruleset Not Found
- **Detection**: No JSON file exists for `{insurerCode}.{claimType}` in rulesets directory
- **Class**: Configuration (missing ruleset for new insurer)
- **Retry Policy**: None
- **Fallback**: Fall back to `DEFAULT.{claimType}` ruleset; add warning to validation result
- **Logging**: `WARN: RULESET_NOT_FOUND`, insurerCode, claimType, fallbackUsed
- **Alert**: Log missing ruleset; developer adds ruleset file; no claim impact if DEFAULT suffices

### F5-02: Ruleset Schema Invalid
- **Detection**: JSON schema validation of ruleset file fails at server startup
- **Class**: Configuration (developer error)
- **Retry Policy**: None — this is a code/config error
- **Fallback**: Use last known-good ruleset version (versioned files: `STAR_HEALTH.PRE_AUTH.v1.json`)
- **Logging**: `CRITICAL: RULESET_SCHEMA_INVALID`, fileName, validationErrors
- **Alert**: Immediate developer alert

### F5-03: Hard Rule Failure (Not Missing Data)
- **Detection**: `hardFailures[]` contains rule violations that are not missing fields
- **Class**: Not a failure — a claim quality issue
- **Action**: Human reviewer notified; can override (with documented reason) or reject
- **Logging**: `WARN: HARD_RULE_FAILURE`, ruleId, description, failedValue

---

## Module 6: Workflow Orchestration — Failure Recovery

### F6-01: Unknown State Transition
- **Detection**: `fromState → toState` combination not in routing table
- **Class**: Configuration / Developer error
- **Retry Policy**: None
- **Fallback**: Log the unexpected transition; claim remains in its current state; no automated action
- **Logging**: `ERROR: UNKNOWN_TRANSITION`, fromState, toState, moduleId
- **Alert**: Developer alert — this indicates a module produced an unexpected state

### F6-02: Circular State Transition
- **Detection**: Same state is entered 3+ times for the same claim without human action in between
- **Class**: System error
- **Fallback**: Claim is forcibly set to `DENIAL_ESCALATED` or `ABANDONED` (admin decides); all automation halted for this claim
- **Logging**: `CRITICAL: CIRCULAR_TRANSITION_DETECTED`, claimId, state, count
- **Alert**: Immediate developer + admin alert

### F6-03: Job Queue Full
- **Detection**: In-process queue length exceeds configured maximum (default: 100 jobs)
- **Class**: Transient (high load)
- **Fallback**: New jobs rejected with backpressure signal; upstream waits 5 seconds and retries
- **Logging**: `WARN: JOB_QUEUE_FULL`, queueLength, maxLength
- **Alert**: If sustained > 5 minutes → developer alert (need to scale or investigate slow jobs)

---

## Module 7: Human Review — Failure Recovery

### F7-01: Reviewer Not Found
- **Detection**: `assignedTo` user ID does not exist in `users` table
- **Class**: Data integrity error
- **Retry Policy**: None
- **Fallback**: Assign review to any admin user
- **Logging**: `WARN: REVIEWER_NOT_FOUND`, invalidUserId, fallbackUserId
- **User Experience**: No impact — review appears in admin's queue

### F7-02: Review Timeout
- **Detection**: Cron job checks `human_review_decisions` where `decided_at IS NULL AND created_at < now() - 48 hours`
- **Class**: Operational
- **Retry Policy**: Not applicable — waiting for human
- **Fallback**: Send escalation notification to admin; claim flagged as `OVERDUE`
- **Logging**: `WARN: REVIEW_TIMEOUT`, claimId, reviewType, hoursElapsed
- **Alert**: Admin receives high-priority notification

### F7-03: Double Approval Attempt
- **Detection**: Review record already has `decided_at` set (idempotency check)
- **Class**: Not a failure — likely a duplicate request
- **Response**: Return existing decision without error
- **Logging**: `INFO: REVIEW_ALREADY_DECIDED`, reviewId, originalDecision, requestId

---

## Module 8: Submission Automation — Failure Recovery

### F8-01: Insurer Configuration Not Found
- **Detection**: No record in `insurer_configs` for the claim's `insurer_code`
- **Class**: Configuration
- **Retry Policy**: None
- **Fallback**: Route to `MANUAL` method; human submits via portal manually
- **Logging**: `ERROR: INSURER_CONFIG_NOT_FOUND`, insurerCode
- **Alert**: Admin notified — insurer not configured

### F8-02: Portal Login Failed
- **Detection**: Playwright cannot find expected post-login element within 15 seconds
- **Class**: Recoverable (credentials expired) or Configuration (wrong credentials)
- **Retry Policy**: None — incorrect credentials will continue to fail
- **Fallback**: Switch to `MANUAL` method; alert admin to update credentials in Settings
- **Logging**: `ERROR: PORTAL_LOGIN_FAILED`, insurerCode, portalUrl
- **Alert**: Admin immediate alert — all claims for this insurer will be blocked until fixed
- **Recovery Procedure**: Admin updates credentials in Settings screen; re-tests connection; resumes affected claims

### F8-03: Portal Selector Not Found
- **Detection**: Playwright `waitForSelector` throws or times out
- **Class**: Configuration / External change
- **Retry Policy**: 1 retry (in case of timing issue)
- **Fallback**: `method = MANUAL`; screenshot of failure state saved as evidence
- **Logging**: `ERROR: PORTAL_SELECTOR_NOT_FOUND`, selector, insurerCode, screenshotPath
- **Alert**: Developer alert — Playwright script needs updating for this insurer

### F8-04: Insurer API 5xx Error
- **Detection**: HTTP 500, 502, 503, 504 from insurer API
- **Class**: Transient
- **Retry Policy**: 3 retries, 30s → 90s → 270s backoff
- **Fallback**: After 3 failures → `SUBMISSION_FAILED`, human notified
- **Logging**: `WARN: INSURER_API_5XX`, statusCode, attempt, insurerCode

### F8-05: Insurer API 4xx Rejection
- **Detection**: HTTP 400, 422 response with rejection details
- **Class**: Terminal for this attempt (claim data problem)
- **Retry Policy**: None for the same attempt; denial analysis determines if resubmission is possible
- **Fallback**: Capture rejection code and reason → trigger denial analysis via M6
- **Logging**: `ERROR: INSURER_API_REJECTED`, statusCode, rejectionCode, rejectionReason

### F8-06: Maximum Submission Attempts Reached
- **Detection**: `attempt >= 3` and submission still failing
- **Class**: Terminal (automated)
- **Fallback**: Claim escalated to admin with full submission history; `method = MANUAL`
- **Logging**: `ERROR: MAX_SUBMISSION_ATTEMPTS_REACHED`, claimId, attempts, lastFailureReason
- **Alert**: Claims officer notified for manual handling

---

## Module 9: Analytics — Failure Recovery

### F9-01: Database Query Timeout
- **Detection**: SQLite query exceeds 5 seconds
- **Class**: Transient (usually high load or unoptimized query)
- **Retry Policy**: 1 retry after 500ms
- **Fallback**: Return partial data with `{ "warning": "data may be incomplete" }` field
- **Logging**: `WARN: ANALYTICS_QUERY_TIMEOUT`, queryType, durationMs

### F9-02: Database Locked
- **Detection**: SQLite `SQLITE_BUSY` error (write operation blocking read)
- **Class**: Transient (inherent SQLite behavior)
- **Retry Policy**: Up to 5 retries at 100ms intervals
- **Fallback**: After 5 retries → return error response; dashboard shows stale data warning
- **Logging**: `WARN: DATABASE_LOCKED`, retryCount

---

## System-Wide Failure Recovery Patterns

### Graceful Degradation
When AI services are unavailable:
- M1 (Whisper) down → skip audio; require document upload only
- M3 (Gemini) down → route all claims to manual data entry
- M4 (LLM fallback) down → require human coding for all claims
- M8 (insurer API) down → route to RPA or manual for affected insurer

None of these degradations stop the system entirely. Claims can always be processed (more slowly) with human involvement.

### Database Connection Recovery
SQLite is file-based. Connection failures indicate disk or process issues:
- On `SQLITE_CANTOPEN`: alert developer immediately; all modules degraded
- On `SQLITE_CORRUPT`: immediate escalation; database must be restored from backup

### Health Check Endpoint
`GET /health` returns the status of all modules:
```json
{
  "status": "degraded",
  "modules": {
    "M1_SPEECH": "ok",
    "M2_DOCUMENT": "ok",
    "M3_CLINICAL": "degraded: API key missing",
    "M4_CODING": "ok",
    "M5_VALIDATION": "ok",
    "M6_ORCHESTRATION": "ok",
    "M7_REVIEW": "ok",
    "M8_SUBMISSION": "degraded: STAR_HEALTH portal login failed",
    "M9_ANALYTICS": "ok"
  }
}
```

Any module in `degraded` state generates a developer notification.
