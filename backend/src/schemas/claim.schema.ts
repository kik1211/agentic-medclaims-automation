import { z } from 'zod';

export const ClaimTypeEnum = z.enum(['PRE_AUTH', 'DISCHARGE', 'FINAL_CLAIM']);

export const CreateClaimSchema = z.object({
  hospital_id: z.string().min(1, 'Hospital ID is required'),
  claim_type: ClaimTypeEnum,
  insurer_code: z.string().optional(),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).optional(),
  pre_auth_reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateClaimRequest = z.infer<typeof CreateClaimSchema>;

export const UpdateClaimSchema = z.object({
  status: z
    .enum([
      'DRAFT',
      'DOCUMENTS_UPLOADED',
      'OCR_IN_PROGRESS',
      'OCR_COMPLETE',
      'STRUCTURING_IN_PROGRESS',
      'STRUCTURING_COMPLETE',
      'CODING_IN_PROGRESS',
      'CODING_COMPLETE',
      'VALIDATING_IN_PROGRESS',
      'AWAITING_HUMAN_APPROVAL',
      'MISSING_DATA',
      'HUMAN_REVIEW_IN_PROGRESS',
      'SUBMITTING_TO_INSURER',
      'SUBMITTED_TO_INSURER',
      'INSURER_PROCESSING',
      'APPROVED',
      'PARTIALLY_APPROVED',
      'REJECTED',
      'DENIAL_ANALYSIS_IN_PROGRESS',
      'RESUBMISSION_PREPARED',
      'ESCALATED_MANUAL',
      'COMPLETED',
      'ABANDONED',
    ])
    .optional(),
  insurer_code: z.string().optional(),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).optional(),
  assigned_reviewer_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateClaimRequest = z.infer<typeof UpdateClaimSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
