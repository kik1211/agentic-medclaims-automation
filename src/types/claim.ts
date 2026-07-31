/**
 * Canonical Domain Model — Claim & Sub-Objects
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 1, 8, 9, 10, 11, 12
 */

export enum ClaimType {
  PRE_AUTH = 'PRE_AUTH',
  DISCHARGE = 'DISCHARGE',
  FINAL_CLAIM = 'FINAL_CLAIM',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  DOCUMENTS_UPLOADED = 'DOCUMENTS_UPLOADED',
  OCR_IN_PROGRESS = 'OCR_IN_PROGRESS',
  OCR_COMPLETE = 'OCR_COMPLETE',
  STRUCTURING_IN_PROGRESS = 'STRUCTURING_IN_PROGRESS',
  STRUCTURING_COMPLETE = 'STRUCTURING_COMPLETE',
  CODING_IN_PROGRESS = 'CODING_IN_PROGRESS',
  CODING_COMPLETE = 'CODING_COMPLETE',
  VALIDATING_IN_PROGRESS = 'VALIDATING_IN_PROGRESS',
  AWAITING_HUMAN_APPROVAL = 'AWAITING_HUMAN_APPROVAL',
  MISSING_DATA = 'MISSING_DATA',
  HUMAN_REVIEW_IN_PROGRESS = 'HUMAN_REVIEW_IN_PROGRESS',
  SUBMITTING_TO_INSURER = 'SUBMITTING_TO_INSURER',
  SUBMITTED_TO_INSURER = 'SUBMITTED_TO_INSURER',
  INSURER_PROCESSING = 'INSURER_PROCESSING',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  DENIAL_ANALYSIS_IN_PROGRESS = 'DENIAL_ANALYSIS_IN_PROGRESS',
  RESUBMISSION_PREPARED = 'RESUBMISSION_PREPARED',
  ESCALATED_MANUAL = 'ESCALATED_MANUAL',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum ClaimPriority {
  URGENT = 'URGENT',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export interface Claim {
  id: string;
  hospital_id: string;
  claim_type: ClaimType;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
  insurer_code?: string;
  priority?: ClaimPriority;
  completed_at?: string | null;
  current_attempt?: number;
  assigned_reviewer_id?: string | null;
  pre_auth_reference?: string | null;
  notes?: string | null;
}

export interface ClinicalSummary {
  id: string;
  claim_id: string;
  patient_name: string;
  policy_number: string;
  diagnosis_free_text: string;
  procedure_free_text: string;
  treating_physician_name: string;
  estimated_cost_inr: number;
  extraction_confidence: number;
  prompt_version: string;
  created_at: string;
  insurer_name?: string;
  patient_dob?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_id?: string;
  admission_date?: string;
  discharge_date_expected?: string;
  actual_cost_inr?: number;
  medications?: Array<{ name: string; dosage: string; frequency: string }>;
  lab_findings_summary?: string;
  field_confidences?: Record<string, number>;
  uncertain_fields?: string[];
  missing_fields?: string[];
  raw_llm_response?: string;
}

export enum CodeType {
  ICD10_DIAGNOSIS = 'ICD10_DIAGNOSIS',
  ICD10_PROCEDURE = 'ICD10_PROCEDURE',
  CPT = 'CPT',
}

export enum CodeSource {
  AI_SUGGESTED = 'AI_SUGGESTED',
  HUMAN_ASSIGNED = 'HUMAN_ASSIGNED',
  VALIDATED = 'VALIDATED',
}

export interface MedicalCode {
  id: string;
  claim_id: string;
  code_type: CodeType;
  code: string;
  description: string;
  source: CodeSource;
  confidence: number;
  is_confirmed: boolean;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
}

export enum ConflictType {
  DIAGNOSIS_PROCEDURE_MISMATCH = 'DIAGNOSIS_PROCEDURE_MISMATCH',
  GENDER_AGE_INCONSISTENCY = 'GENDER_AGE_INCONSISTENCY',
  EXCLUDED_COMBINATION = 'EXCLUDED_COMBINATION',
  DUPLICATE_CODE = 'DUPLICATE_CODE',
}

export enum ConflictSeverity {
  BLOCKING = 'BLOCKING',
  WARNING = 'WARNING',
}

export interface MedicalConflict {
  id: string;
  claim_id: string;
  conflict_type: ConflictType;
  conflicting_codes: string[];
  description: string;
  severity: ConflictSeverity;
  is_resolved: boolean;
  resolved_by?: string | null;
  resolution_notes?: string | null;
}

export enum ValidationStatus {
  PASSED = 'PASSED',
  FAILED_MISSING_DATA = 'FAILED_MISSING_DATA',
  FAILED_HARD_RULES = 'FAILED_HARD_RULES',
  PASSED_WITH_WARNINGS = 'PASSED_WITH_WARNINGS',
}

export interface HardFailure {
  ruleId: string;
  ruleName: string;
  description: string;
  failedValue?: unknown;
}

export interface MissingField {
  fieldName: string;
  description: string;
  canProvideManually: boolean;
  requiredDocumentType?: string;
}

export interface ValidationWarning {
  ruleId: string;
  description: string;
}

export interface ValidationReport {
  id: string;
  claim_id: string;
  ruleset_id: string;
  validation_status: ValidationStatus;
  completeness_score: number;
  readiness_score: number;
  hard_failures: HardFailure[];
  missing_fields: MissingField[];
  warnings: ValidationWarning[];
  validated_at: string;
  pass_number: number;
}

export enum ReviewType {
  TRANSCRIPT = 'TRANSCRIPT',
  MISSING_DATA = 'MISSING_DATA',
  CLINICAL_DATA = 'CLINICAL_DATA',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
}

export enum ReviewDecisionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DATA_PROVIDED = 'DATA_PROVIDED',
  CORRECTED = 'CORRECTED',
}

export interface ReviewDecision {
  id: string;
  claim_id: string;
  review_type: ReviewType;
  reviewer_id: string;
  decision: ReviewDecisionType;
  created_at: string;
  decided_at?: string | null;
  corrections?: Record<string, unknown> | null;
  rejection_reason?: string | null;
  time_to_decision_seconds?: number | null;
}

export enum SubmissionMethod {
  REST_API = 'REST_API',
  RPA_PORTAL = 'RPA_PORTAL',
  MANUAL = 'MANUAL',
}

export enum InsurerStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
}

export interface SubmissionResult {
  id: string;
  claim_id: string;
  attempt: number;
  method: SubmissionMethod;
  submitted_at: string;
  insurer_status: InsurerStatus;
  insurer_reference_number?: string | null;
  submission_payload?: Record<string, unknown> | null;
  insurer_response?: Record<string, unknown> | null;
  rejection_reason?: string | null;
  rejection_code?: string | null;
  expected_response_date?: string | null;
  screenshot_paths?: string[] | null;
}
