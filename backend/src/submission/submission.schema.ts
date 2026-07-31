import { z } from 'zod';

export const PortalSubmissionResultSchema = z.object({
  portal_reference: z.string(),
  submission_status: z.enum(['SUBMITTED', 'FAILED']),
  submitted_at: z.string(),
  submission_logs: z.array(z.string()),
  portal_name: z.string(),
});

export type PortalSubmissionResult = z.infer<typeof PortalSubmissionResultSchema>;

export const ProcessSubmissionSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
});

export type ProcessSubmissionRequest = z.infer<typeof ProcessSubmissionSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
