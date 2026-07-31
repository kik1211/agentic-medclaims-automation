import { z } from 'zod';

export const DecisionEnum = z.enum(['APPROVED', 'REJECTED', 'INFO_REQUESTED']);
export type ReviewDecisionType = z.infer<typeof DecisionEnum>;

export const DecisionRequestSchema = z.object({
  comments: z.string().optional(),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;

export const ClaimIdParamSchema = z.object({
  claimId: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
