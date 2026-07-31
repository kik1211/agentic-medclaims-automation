# Canonical Data Model
# ClaimPilot India — Shared Object Definitions

**Version**: 1.0  
**Authority**: All modules must use these object definitions. No module invents its own schema for these objects.  
**Cross-reference**: [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md) defines which module owns each object.

---

## Object Inventory

| Object | Owner Module | Table |
|---|---|---|
| Claim | M6 (Orchestration) | `claims` |
| Patient | M3 (Clinical Structuring) | `claim_structured_data` |
| Hospital | Infrastructure | `hospitals` |
| Insurance Scheme | M8 (Submission) | `insurer_configs` |
| Document | M2 (Document Intelligence) | `documents` |
| OCR Result | M2 (Document Intelligence) | `documents` (extended) |
| Speech Transcript | M1 (Speech Intelligence) | `documents` (type=TRANSCRIPT) |
| Clinical Summary | M3 (Clinical Structuring) | `claim_structured_data` |
| Medical Codes | M4 (Medical Coding) | `claim_codes`, `claim_code_conflicts` |
| Validation Report | M5 (Claim Validation) | `claim_validation_results` |
| Review Decision | M7 (Human Review) | `human_review_decisions` |
| Submission Result | M8 (Submission Automation) | `claim_submissions` |
| Audit Event | Cross-cutting | `audit_log` |
| Notification | M7 (Human Review) | `notifications` |
| Analytics Record | M9 (Analytics) | Computed from all tables |

---

## Object 1: Claim

**Purpose**: The central record that represents a single insurance claim from creation to resolution. All other objects exist in relation to a Claim.

**Owner Module**: M6 (Workflow Orchestration) — only M6 may write the `status` and `stage` fields

**Lifecycle**: Created on document upload → updated by each module → terminal state reached

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `hospital_id` | UUID | Owning hospital |
| `claim_type` | ENUM | `PRE_AUTH`, `DISCHARGE`, `FINAL_CLAIM` |
| `status` | ENUM | Current state (see STATE_MACHINE.md) |
| `created_at` | ISO DateTime | Record creation time |
| `updated_at` | ISO DateTime | Last modification time |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `insurer_code` | String | May be unknown until M3 extracts it |
| `priority` | ENUM | `URGENT`, `NORMAL`, `LOW` — default `NORMAL` |
| `completed_at` | ISO DateTime | When claim reached terminal state |
| `current_attempt` | Integer | Submission attempt count (starts at 1) |
| `assigned_reviewer_id` | UUID | Human reviewer currently responsible |
| `pre_auth_reference` | String | Reference from pre-auth (used in discharge/final claims) |
| `notes` | String | Free-text notes added by staff |

**Relationships**:
- One Claim → Many Documents
- One Claim → One Clinical Summary (after M3)
- One Claim → Many Medical Codes (after M4)
- One Claim → One Validation Report (after M5, updated on re-validation)
- One Claim → Many Review Decisions (one per human review point)
- One Claim → Many Submission Results (one per attempt)
- One Claim → Many Audit Events

**Validation Rules**:
- `id` must be a valid UUID v4
- `claim_type` must be one of the three enum values
- `status` must be a valid state from the state machine
- `updated_at` must always be >= `created_at`
- A claim in a terminal state cannot have `status` updated

### Example JSON

```json
{
  "id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "hospital_id": "hosp_sri_ramakrishna",
  "claim_type": "PRE_AUTH",
  "status": "AWAITING_HUMAN_APPROVAL",
  "insurer_code": "STAR_HEALTH",
  "priority": "NORMAL",
  "current_attempt": 1,
  "assigned_reviewer_id": "usr_dr_sharma",
  "created_at": "2024-10-15T09:30:00.000Z",
  "updated_at": "2024-10-15T09:45:00.000Z",
  "completed_at": null,
  "notes": null
}
```

---

## Object 2: Patient

**Purpose**: Demographic and identity information for the patient associated with the claim. Extracted by M3 from documents; may be corrected by human review.

**Owner Module**: M3 (Clinical Structuring) — extracted from documents, not entered by users

**Note**: Patient is not a standalone table. It is the patient-related subset of `claim_structured_data`. In a future multi-claim system, patients would be normalized into their own table. For MVP, patient data is per-claim.

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `patient_name` | String | Full name as found in documents |
| `policy_number` | String | Insurance policy number |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `patient_dob` | ISO Date | Date of birth (YYYY-MM-DD) |
| `patient_age` | Integer | Age in years (if DOB unavailable) |
| `patient_gender` | ENUM | `MALE`, `FEMALE`, `OTHER` |
| `patient_id` | String | Hospital patient ID |
| `policy_holder_name` | String | May differ from patient (family policy) |
| `contact_number` | String | Patient phone (if present in documents) |

**Validation Rules**:
- `patient_name` must not be empty after trim
- `patient_dob` if present must be a valid date in the past
- `patient_age` if present must be between 0 and 120
- If both `patient_dob` and `patient_age` are present, they must be approximately consistent (within 1 year)

### Example JSON

```json
{
  "patient_name": "Rajesh Kumar",
  "patient_dob": "1979-03-15",
  "patient_age": 45,
  "patient_gender": "MALE",
  "patient_id": "HOSP-12345",
  "policy_number": "SH-99887766",
  "policy_holder_name": "Rajesh Kumar"
}
```

---

## Object 3: Hospital

**Purpose**: The medical facility using ClaimPilot. Configuration anchor for all claims.

**Owner Module**: Infrastructure (system configuration)

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Official hospital name |
| `registration_number` | String | Government registration ID |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `address` | String | Full postal address |
| `empanelment_ids` | JSON Object | `{ "STAR_HEALTH": "EMP-123", "CMCHIS": "EMP-456" }` |
| `nabh_accredited` | Boolean | NABH accreditation status |
| `contact_email` | String | Admin contact |
| `contact_phone` | String | Admin contact |
| `created_at` | ISO DateTime | |

**Relationships**:
- One Hospital → Many Users
- One Hospital → Many Claims
- One Hospital → Many Insurer Configurations

**Validation Rules**:
- `name` must not be empty
- `registration_number` must be unique across hospitals
- `empanelment_ids` keys must match valid `insurer_code` values

### Example JSON

```json
{
  "id": "hosp_sri_ramakrishna",
  "name": "Sri Ramakrishna Hospital",
  "registration_number": "REG-TN-123456",
  "address": "395, Sarojini Naidu Road, Sidhapudur, Coimbatore, Tamil Nadu 641044",
  "empanelment_ids": {
    "STAR_HEALTH": "EMP-998877",
    "CMCHIS": "CMCHIS-2024-0456"
  },
  "nabh_accredited": true,
  "contact_email": "claims@srhcbe.in",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

## Object 4: Insurance Scheme

**Purpose**: Configuration for a specific insurer or government scheme, including how to connect to it (API, RPA, or manual).

**Owner Module**: M8 (Submission Automation) reads this; admin creates/updates via Settings screen

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `hospital_id` | UUID | Which hospital this config belongs to |
| `insurer_code` | String | Internal code, e.g. `STAR_HEALTH`, `CMCHIS` |
| `insurer_name` | String | Display name |
| `connection_type` | ENUM | `API`, `RPA`, `MANUAL` |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `api_key` | String | Encrypted at rest |
| `api_endpoint` | String | Base URL for insurer API |
| `portal_url` | String | URL for portal automation |
| `portal_username` | String | Encrypted at rest |
| `portal_password` | String | Encrypted at rest |
| `hospital_id_at_insurer` | String | Hospital's ID in insurer's system |
| `tpa_name` | String | Third-party administrator name if applicable |
| `state_scheme` | String | For government schemes (e.g., CMCHIS) |
| `last_tested_at` | ISO DateTime | Last successful connection test |
| `is_active` | Boolean | Whether this insurer is currently enabled |

**Validation Rules**:
- If `connection_type = API`: `api_key` and `api_endpoint` are required
- If `connection_type = RPA`: `portal_url`, `portal_username`, `portal_password` are required
- `insurer_code` must be unique per hospital
- Credentials must be encrypted before storage (never stored in plaintext)

### Example JSON

```json
{
  "id": "cfg_star_health_srh",
  "hospital_id": "hosp_sri_ramakrishna",
  "insurer_code": "STAR_HEALTH",
  "insurer_name": "Star Health and Allied Insurance",
  "connection_type": "API",
  "api_key": "[ENCRYPTED]",
  "api_endpoint": "https://api.starhealth.in/v2/claims",
  "hospital_id_at_insurer": "SH-HOSP-9988",
  "last_tested_at": "2024-10-15T09:00:00.000Z",
  "is_active": true
}
```

---

## Object 5: Document

**Purpose**: A single uploaded file (PDF) associated with a claim. Persists regardless of processing outcome.

**Owner Module**: M2 (Document Intelligence) — processes and enriches

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `claim_id` | UUID | Owning claim |
| `file_name` | String | Original filename |
| `file_path` | String | Server-side absolute path |
| `file_size_bytes` | Integer | |
| `file_hash_sha256` | String | For deduplication |
| `uploaded_at` | ISO DateTime | |
| `uploaded_by` | UUID | User ID |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `document_type` | ENUM | Classification (see below) |
| `processing_status` | ENUM | `PENDING`, `IN_PROGRESS`, `COMPLETE`, `FAILED` |

**Document Type Enum**:
`CLINICAL_NOTES`, `INSURANCE_CARD`, `COST_SHEET`, `DIAGNOSIS_REPORT`, `PRESCRIPTION`, `OPERATION_NOTES`, `ANAESTHESIA_REPORT`, `POST_OP_SUMMARY`, `DISCHARGE_SUMMARY`, `FINAL_BILL`, `LAB_REPORT`, `IMPLANT_INVOICE`, `TRANSCRIPT`, `OTHER`

**Relationships**:
- Many Documents → One Claim
- One Document → One OCR Result

**Validation Rules**:
- `file_size_bytes` must be between 1 and 20,971,520 (20MB)
- `file_hash_sha256` must be unique per claim (no duplicate uploads)
- `file_path` must point to an accessible file at time of processing

### Example JSON

```json
{
  "id": "doc_clinical_notes_rajesh",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "file_name": "Clinical_Notes_Rajesh.pdf",
  "file_path": "/uploads/clm_01j3k8/Clinical_Notes_Rajesh.pdf",
  "file_size_bytes": 2516582,
  "file_hash_sha256": "e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855",
  "document_type": "CLINICAL_NOTES",
  "processing_status": "COMPLETE",
  "uploaded_at": "2024-10-15T09:32:00.000Z",
  "uploaded_by": "usr_dr_sharma"
}
```

---

## Object 6: OCR Result

**Purpose**: The text extraction output for a single document. Produced by M2.

**Owner Module**: M2 (Document Intelligence)

**Storage**: Fields are added to the `documents` table (same row as Document object)

### Fields

**Required Fields** (populated after processing):

| Field | Type | Description |
|---|---|---|
| `extracted_text` | Text | Full concatenated OCR output |
| `page_count` | Integer | Total pages in PDF |
| `text_quality` | ENUM | `HIGH`, `MEDIUM`, `LOW`, `UNREADABLE` |
| `ocr_completed_at` | ISO DateTime | |

**Optional Fields**:

| Field | Type | Description |
|---|---|---|
| `page_results` | JSON Array | Per-page `{ pageNumber, text, confidence, isBlank, hasHandwriting }` |
| `structured_fields` | JSON Object | Key-value pairs from layout analysis (e.g., policy number) |
| `average_confidence` | Float | 0.0–1.0, average Tesseract confidence across pages |
| `blank_page_count` | Integer | |
| `language_detected` | String | ISO language code |

**Validation Rules**:
- `text_quality` of `UNREADABLE` means `extracted_text` may be empty or meaningless
- `average_confidence` must be between 0.0 and 1.0
- `page_count` must be >= 1

### Example JSON

```json
{
  "extracted_text": "PATIENT NAME: Rajesh Kumar\nDATE: 15/10/2024\nDIAGNOSIS: Acute Appendicitis...",
  "page_count": 3,
  "text_quality": "HIGH",
  "average_confidence": 0.91,
  "blank_page_count": 0,
  "language_detected": "en",
  "structured_fields": {
    "patient_name": "Rajesh Kumar",
    "date": "15/10/2024"
  },
  "page_results": [
    { "pageNumber": 1, "confidence": 0.93, "isBlank": false, "hasHandwriting": false },
    { "pageNumber": 2, "confidence": 0.89, "isBlank": false, "hasHandwriting": true },
    { "pageNumber": 3, "confidence": 0.91, "isBlank": false, "hasHandwriting": false }
  ],
  "ocr_completed_at": "2024-10-15T09:38:00.000Z"
}
```

---

## Object 7: Speech Transcript

**Purpose**: The output of Whisper transcription of a doctor-patient audio recording. Stored as a special Document with `document_type = TRANSCRIPT`.

**Owner Module**: M1 (Speech Intelligence)

**Storage**: `documents` table (with transcript-specific fields stored in `structured_fields` JSON column)

### Fields

| Field | Type | Description |
|---|---|---|
| `raw_transcript` | Text | Full Whisper output |
| `detected_language` | String | ISO language code |
| `transcript_confidence` | Float | 0.0–1.0 overall confidence |
| `duration_seconds` | Integer | Audio duration processed |
| `word_count` | Integer | |
| `speaker_segments` | JSON Array | `[{ speaker, startTime, endTime, text }]` |
| `clinical_keywords` | JSON Array | Pre-structuring keyword candidates |
| `whisper_model` | String | Model version used (e.g., `whisper-1`) |

**Validation Rules**:
- `transcript_confidence < 0.60`: flagged for human review before proceeding
- `word_count < 50`: flagged as possibly too short
- `raw_transcript` must not be empty

### Example JSON

```json
{
  "raw_transcript": "Doctor: Good morning. What brings you in today? Patient: I've been having severe pain in my lower right abdomen for the past two days...",
  "detected_language": "en-IN",
  "transcript_confidence": 0.87,
  "duration_seconds": 312,
  "word_count": 743,
  "clinical_keywords": ["lower right abdomen", "pain", "fever", "nausea"],
  "whisper_model": "whisper-1",
  "speaker_segments": [
    { "speaker": "DOCTOR", "startTime": 0.0, "endTime": 4.2, "text": "Good morning. What brings you in today?" },
    { "speaker": "PATIENT", "startTime": 4.8, "endTime": 18.3, "text": "I've been having severe pain in my lower right abdomen for the past two days." }
  ]
}
```

---

## Object 8: Clinical Summary

**Purpose**: The structured extraction of all clinically relevant data from documents and transcripts. The primary output of M3.

**Owner Module**: M3 (Clinical Structuring)

**Storage**: `claim_structured_data` table

### Fields

**Required Fields**:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `extraction_confidence` | Float | 0.0–1.0 |
| `created_at` | ISO DateTime | |
| `prompt_version` | String | Which prompt produced this (e.g., `PRE_AUTH_V1`) |

**Patient Identity Fields** (required for submission):

| Field | Type | Description |
|---|---|---|
| `patient_name` | String | |
| `policy_number` | String | |

**Clinical Fields** (required for submission):

| Field | Type | Description |
|---|---|---|
| `diagnosis_free_text` | String | Verbatim diagnosis from documents |
| `procedure_free_text` | String | Procedure description |
| `treating_physician_name` | String | |
| `estimated_cost_inr` | Integer | In paise? No — in whole rupees |

**Clinical Fields** (optional):

| Field | Type | Description |
|---|---|---|
| `insurer_name` | String | Extracted from documents (may differ from configured) |
| `patient_dob` | ISO Date | |
| `patient_age` | Integer | |
| `patient_gender` | ENUM | |
| `patient_id` | String | Hospital patient ID |
| `admission_date` | ISO Date | |
| `discharge_date_expected` | ISO Date | For pre-auth |
| `actual_cost_inr` | Integer | For final claims |
| `medications` | JSON Array | `[{ name, dosage, frequency }]` |
| `lab_findings_summary` | String | Summary of significant lab results |

**Quality Fields**:

| Field | Type | Description |
|---|---|---|
| `field_confidences` | JSON Object | Per-field confidence scores |
| `uncertain_fields` | JSON Array | Field names where model was uncertain |
| `missing_fields` | JSON Array | Fields absent from all documents |
| `raw_llm_response` | Text | Stored for audit (never exposed via API) |

**Validation Rules**:
- `extraction_confidence` must be 0.0–1.0
- `estimated_cost_inr` must be > 0 if present
- `prompt_version` must reference an existing prompt file
- `raw_llm_response` is write-once; never updated after creation

### Example JSON

```json
{
  "id": "cs_01j3k9m2p5q7r9s1t3",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "patient_name": "Rajesh Kumar",
  "patient_dob": "1979-03-15",
  "patient_age": 45,
  "patient_gender": "MALE",
  "patient_id": "HOSP-12345",
  "policy_number": "SH-99887766",
  "insurer_name": "Star Health",
  "diagnosis_free_text": "Acute appendicitis with localized peritonitis",
  "procedure_free_text": "Laparoscopic appendectomy under general anaesthesia",
  "admission_date": "2024-10-15",
  "treating_physician_name": "Dr. Murugan S.",
  "estimated_cost_inr": 45000,
  "extraction_confidence": 0.91,
  "uncertain_fields": [],
  "missing_fields": [],
  "prompt_version": "PRE_AUTH_V1",
  "created_at": "2024-10-15T09:45:00.000Z"
}
```

---

## Object 9: Medical Codes

**Purpose**: ICD-10 diagnosis codes and procedure codes assigned to the claim, with conflict analysis. The output of M4.

**Owner Module**: M4 (Medical Coding)

**Storage**: `claim_codes` table (one row per code) + `claim_code_conflicts` table

### Code Object

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `code_type` | ENUM | `ICD10_DIAGNOSIS`, `ICD10_PROCEDURE`, `CPT` |
| `code` | String | e.g., `K35.80` |
| `description` | String | e.g., "Acute appendicitis without abscess" |
| `source` | ENUM | `AI_SUGGESTED`, `HUMAN_ASSIGNED`, `VALIDATED` |
| `confidence` | Float | 0.0–1.0 |
| `is_confirmed` | Boolean | True after human review |
| `confirmed_by` | UUID | Reviewer user ID |
| `confirmed_at` | ISO DateTime | |

### Conflict Object

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `conflict_type` | ENUM | `DIAGNOSIS_PROCEDURE_MISMATCH`, `GENDER_AGE_INCONSISTENCY`, `EXCLUDED_COMBINATION`, `DUPLICATE_CODE` |
| `conflicting_codes` | JSON Array | The codes involved |
| `description` | String | Human-readable explanation |
| `severity` | ENUM | `BLOCKING`, `WARNING` |
| `is_resolved` | Boolean | |
| `resolved_by` | UUID | |
| `resolution_notes` | String | How it was resolved |

**Validation Rules**:
- Every code must exist in the ICD-10 reference dataset before being marked `VALIDATED`
- A claim with any unresolved `BLOCKING` conflict cannot advance past `AWAITING_HUMAN_APPROVAL`
- `confirmed_by` must be a valid user ID; cannot be the same user who uploaded documents (future: four-eyes principle)

### Example JSON

```json
{
  "codes": [
    {
      "id": "code_k3580",
      "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
      "code_type": "ICD10_DIAGNOSIS",
      "code": "K35.80",
      "description": "Acute appendicitis without abscess",
      "source": "VALIDATED",
      "confidence": 0.94,
      "is_confirmed": true,
      "confirmed_by": "usr_dr_sharma",
      "confirmed_at": "2024-10-15T10:02:00.000Z"
    }
  ],
  "conflicts": []
}
```

---

## Object 10: Validation Report

**Purpose**: The complete output of M5's rule-engine validation. Documents every check performed and its result.

**Owner Module**: M5 (Claim Validation)

**Storage**: `claim_validation_results` table

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `ruleset_id` | String | Which ruleset was applied (e.g., `STAR_HEALTH.PRE_AUTH.v1`) |
| `validation_status` | ENUM | `PASSED`, `FAILED_MISSING_DATA`, `FAILED_HARD_RULES`, `PASSED_WITH_WARNINGS` |
| `completeness_score` | Float | % required fields present (0.0–1.0) |
| `readiness_score` | Float | Overall submission readiness (0.0–1.0) |
| `hard_failures` | JSON Array | `[{ ruleId, ruleName, description, failedValue }]` |
| `missing_fields` | JSON Array | `[{ fieldName, description, canProvideManually, requiredDocumentType }]` |
| `warnings` | JSON Array | `[{ ruleId, description }]` |
| `validated_at` | ISO DateTime | |
| `pass_number` | Integer | 1 for first validation, 2+ for re-validations after data entry |

**Validation Rules**:
- `readiness_score` of 1.0 requires: `validation_status = PASSED`, no conflicts, all required fields present
- `completeness_score` is computed as: (required fields present) / (total required fields)
- The most recent validation report supersedes all previous ones for the same claim

### Example JSON

```json
{
  "id": "vr_01j3l0m3q8r0s2t4",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "ruleset_id": "STAR_HEALTH.PRE_AUTH.v1",
  "validation_status": "PASSED",
  "completeness_score": 1.0,
  "readiness_score": 0.95,
  "hard_failures": [],
  "missing_fields": [],
  "warnings": [
    {
      "ruleId": "W-007",
      "description": "Physician registration number not present. Recommended for Star Health pre-auth claims."
    }
  ],
  "pass_number": 1,
  "validated_at": "2024-10-15T10:05:00.000Z"
}
```

---

## Object 11: Review Decision

**Purpose**: A human reviewer's explicit decision at any human-in-the-loop checkpoint.

**Owner Module**: M7 (Human Review) — creates the record; reviewer writes the decision

**Storage**: `human_review_decisions` table

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `review_type` | ENUM | `TRANSCRIPT`, `MISSING_DATA`, `CLINICAL_DATA`, `FINAL_APPROVAL` |
| `reviewer_id` | UUID | Must be a valid user with Claims Officer or Admin role |
| `decision` | ENUM | `APPROVED`, `REJECTED`, `DATA_PROVIDED`, `CORRECTED` |
| `corrections` | JSON Object | `{ fieldName: correctedValue }` — populated for `CORRECTED` decisions |
| `rejection_reason` | String | Required when `decision = REJECTED` |
| `created_at` | ISO DateTime | When review was requested |
| `decided_at` | ISO DateTime | When human made decision |
| `time_to_decision_seconds` | Integer | Computed on decision write |

**Validation Rules**:
- `reviewer_id` must not be null at time of decision
- `rejection_reason` must be non-empty when `decision = REJECTED`
- `decided_at` must be >= `created_at`
- Only one active (undecided) review per claim per review_type at any time

### Example JSON

```json
{
  "id": "rd_01j3l1n4r9s3t5u7",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "review_type": "FINAL_APPROVAL",
  "reviewer_id": "usr_dr_sharma",
  "decision": "APPROVED",
  "corrections": null,
  "rejection_reason": null,
  "created_at": "2024-10-15T10:06:00.000Z",
  "decided_at": "2024-10-15T10:08:30.000Z",
  "time_to_decision_seconds": 150
}
```

---

## Object 12: Submission Result

**Purpose**: Records every attempt to submit a claim to an insurer. Persists even on failure for audit purposes.

**Owner Module**: M8 (Submission Automation)

**Storage**: `claim_submissions` table

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `attempt` | Integer | 1 for first try, 2+ for denial resubmissions |
| `method` | ENUM | `REST_API`, `RPA_PORTAL`, `MANUAL` |
| `submitted_at` | ISO DateTime | When submission was initiated |
| `insurer_reference_number` | String | Assigned by insurer on acceptance |
| `submission_payload` | JSON Object | What was sent (anonymized PII stored for audit) |
| `insurer_response` | JSON Object | Raw response |
| `insurer_status` | ENUM | `ACCEPTED`, `REJECTED`, `PENDING`, `ERROR` |
| `rejection_reason` | String | Insurer's rejection text |
| `rejection_code` | String | Insurer's rejection code |
| `expected_response_date` | ISO Date | |
| `screenshot_paths` | JSON Array | For RPA_PORTAL: paths to evidence screenshots |

**Validation Rules**:
- `submission_payload` must be stored even for failed submissions (audit requirement)
- `insurer_reference_number` required when `insurer_status = ACCEPTED`
- `rejection_reason` required when `insurer_status = REJECTED`
- Credential fields must never appear in `submission_payload` or `insurer_response` storage

### Example JSON

```json
{
  "id": "sub_01j3l2o5s0t6u8v0",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "attempt": 1,
  "method": "REST_API",
  "submitted_at": "2024-10-15T10:15:00.000Z",
  "insurer_reference_number": "AUTH-99887766",
  "insurer_status": "ACCEPTED",
  "expected_response_date": "2024-10-22",
  "submission_payload": { "claimType": "PRE_AUTH", "patientId": "HOSP-12345" },
  "insurer_response": { "status": "ACCEPTED", "referenceId": "AUTH-99887766" }
}
```

---

## Object 13: Audit Event

**Purpose**: An immutable record of every significant event in the system. Written by every module. Never deleted.

**Owner Module**: Cross-cutting (every module writes audit events)

**Storage**: `audit_log` table

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | Nullable for system-level events |
| `user_id` | UUID | Nullable for automated module events |
| `module_id` | String | e.g., `M2_DOCUMENT_INTELLIGENCE` |
| `event_type` | String | e.g., `OCR_COMPLETED`, `CLAIM_APPROVED` |
| `from_state` | String | Previous claim state (if state transition) |
| `to_state` | String | New claim state (if state transition) |
| `details` | JSON Object | Event-specific context |
| `timestamp` | ISO DateTime | Exact time of event |
| `request_id` | String | Correlation ID for the API request that triggered this |

**Validation Rules**:
- `audit_log` is append-only — no UPDATE or DELETE operations
- `timestamp` is server-generated, not client-provided
- `event_type` must be drawn from the registered event type list (see AUDIT_AND_OBSERVABILITY.md)

### Example JSON

```json
{
  "id": "evt_01j3l3p6t1u9v1w3",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "user_id": null,
  "module_id": "M3_CLINICAL_STRUCTURING",
  "event_type": "STRUCTURING_COMPLETED",
  "from_state": "STRUCTURING_IN_PROGRESS",
  "to_state": "STRUCTURING_COMPLETE",
  "details": {
    "extraction_confidence": 0.91,
    "fields_extracted": 11,
    "missing_fields": [],
    "prompt_version": "PRE_AUTH_V1"
  },
  "timestamp": "2024-10-15T09:45:00.000Z",
  "request_id": "req_7f3a91b2c4d6e8f0"
}
```

---

## Object 14: Notification

**Purpose**: An alert generated by the system to inform a human reviewer or admin that their attention is needed.

**Owner Module**: M7 (Human Review) generates; frontend reads

**Storage**: `notifications` table

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `claim_id` | UUID | |
| `user_id` | UUID | Target recipient (or null for broadcast to all admins) |
| `notification_type` | ENUM | `ACTION_REQUIRED`, `CLAIM_APPROVED`, `CLAIM_REJECTED`, `SYSTEM_ALERT`, `REMINDER` |
| `message` | String | Human-readable notification text |
| `priority` | ENUM | `URGENT`, `NORMAL`, `LOW` |
| `is_read` | Boolean | |
| `read_at` | ISO DateTime | Nullable |
| `created_at` | ISO DateTime | |
| `action_url` | String | Deep link to the relevant screen |

**Validation Rules**:
- `message` must not be empty
- `notification_type = ACTION_REQUIRED` implies `user_id` is set (someone specific must act)

### Example JSON

```json
{
  "id": "ntf_01j3l4q7u2v0w2x4",
  "claim_id": "clm_01j3k8n2p4q6r8s0t2u4v6w8",
  "user_id": "usr_dr_sharma",
  "notification_type": "ACTION_REQUIRED",
  "message": "Claim for Rajesh Kumar (Star Health) requires your approval before submission.",
  "priority": "NORMAL",
  "is_read": false,
  "read_at": null,
  "created_at": "2024-10-15T10:06:00.000Z",
  "action_url": "/claims/clm_01j3k8n2p4q6r8s0t2u4v6w8/review"
}
```

---

## Object 15: Analytics Record

**Purpose**: Computed statistical summaries used by the dashboard and reports. These are not stored persistently — they are computed on demand from the base tables.

**Owner Module**: M9 (Analytics)

**Storage**: Computed, not stored. Results are served from API and optionally cached in memory for 60 seconds.

### KPI Shape

```json
{
  "period": "2024-10",
  "claims_created": 1284,
  "claims_complete": 1208,
  "claims_abandoned": 24,
  "claims_in_progress": 52,
  "approval_rate": 0.942,
  "revenue_claimed_inr": 42000000,
  "revenue_recovered_inr": 39564000,
  "avg_processing_minutes": 14,
  "denial_count": 142,
  "denial_recovery_count": 89,
  "denial_recovery_rate": 0.627,
  "pending_human_review": 7
}
```

### Insurer Breakdown Shape

```json
{
  "insurer_code": "STAR_HEALTH",
  "insurer_name": "Star Health",
  "total_claims": 487,
  "approval_rate": 0.961,
  "avg_response_days": 3.2,
  "avg_processing_minutes": 11
}
```
