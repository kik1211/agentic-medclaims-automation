/**
 * Canonical Domain Model — Workflow & State Machine
 * Ref: docs/STATE_MACHINE.md & docs/CANONICAL_DATA_MODEL.md Object 1, 11
 */

import { ClaimStatus } from './claim';

export enum PipelineStage {
  UPLOAD = 'UPLOAD',
  SPEECH_TRANSCRIPTION = 'SPEECH_TRANSCRIPTION',
  DOCUMENT_OCR = 'DOCUMENT_OCR',
  CLINICAL_STRUCTURING = 'CLINICAL_STRUCTURING',
  MEDICAL_CODING = 'MEDICAL_CODING',
  CLAIM_VALIDATION = 'CLAIM_VALIDATION',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  SUBMISSION_AUTOMATION = 'SUBMISSION_AUTOMATION',
  INSURER_PROCESSING = 'INSURER_PROCESSING',
  DENIAL_RECOVERY = 'DENIAL_RECOVERY',
  TERMINAL = 'TERMINAL',
}

export interface WorkflowState {
  current_status: ClaimStatus;
  stage: PipelineStage;
  allowed_transitions: ClaimStatus[];
  is_terminal: boolean;
  requires_human_review: boolean;
}

export interface WorkflowTransition {
  claim_id: string;
  from_status: ClaimStatus;
  to_status: ClaimStatus;
  triggered_by_module: string;
  triggered_by_user_id?: string | null;
  reason?: string;
  timestamp: string;
}

export interface StageStep {
  step_number: number;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  duration_ms?: number;
  error_message?: string;
}

export interface PipelineProgress {
  claim_id: string;
  current_stage: PipelineStage;
  steps: StageStep[];
  overall_progress_pct: number;
}
