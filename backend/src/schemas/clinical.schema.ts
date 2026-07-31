import { z } from 'zod';

export const ProcessClinicalSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
});

export type ProcessClinicalRequest = z.infer<typeof ProcessClinicalSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
