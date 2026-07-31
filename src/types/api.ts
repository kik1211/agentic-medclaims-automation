/**
 * Canonical Domain Model — API Request & Response Contracts
 * Ref: MODULE_INTERFACE_SPEC.md & CANONICAL_DATA_MODEL.md
 */

import { ClaimType, ClaimPriority } from './claim';
import { DocumentType } from './document';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  request_id?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateClaimRequest {
  hospital_id: string;
  claim_type: ClaimType;
  insurer_code?: string;
  priority?: ClaimPriority;
  pre_auth_reference?: string;
  notes?: string;
}

export interface UpdateClaimRequest {
  insurer_code?: string;
  priority?: ClaimPriority;
  assigned_reviewer_id?: string;
  notes?: string;
}

export interface UploadDocumentResponse {
  document_id: string;
  claim_id: string;
  file_name: string;
  file_size_bytes: number;
  document_type: DocumentType;
  uploaded_at: string;
}

export interface ProcessClaimRequest {
  claim_id: string;
  force_reprocess?: boolean;
}

export interface SubmitClaimRequest {
  claim_id: string;
  reviewer_id: string;
  submission_notes?: string;
}

export interface ReviewDecisionRequest {
  claim_id: string;
  review_type: string;
  decision: 'APPROVED' | 'REJECTED' | 'DATA_PROVIDED' | 'CORRECTED';
  rejection_reason?: string;
  corrections?: Record<string, unknown>;
}

export interface MissingDataSubmissionRequest {
  claim_id: string;
  provided_fields: Record<string, unknown>;
}

export interface AnalyticsSummaryResponse {
  period: string;
  claims_created: number;
  claims_complete: number;
  claims_abandoned: number;
  claims_in_progress: number;
  approval_rate: number;
  revenue_claimed_inr: number;
  revenue_recovered_inr: number;
  avg_processing_minutes: number;
  denial_count: number;
  denial_recovery_count: number;
  denial_recovery_rate: number;
  pending_human_review: number;
}

export interface InsurerAnalyticsResponse {
  insurer_code: string;
  insurer_name: string;
  total_claims: number;
  approval_rate: number;
  avg_response_days: number;
  avg_processing_minutes: number;
}
