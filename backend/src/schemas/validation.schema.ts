import { z } from 'zod';

export const ValidationRuleResultSchema = z.object({
  rule_id: z.string(),
  rule_name: z.string(),
  passed: z.boolean(),
  severity: z.enum(['ERROR', 'WARNING', 'INFO']),
  message: z.string(),
});

export type ValidationRuleResult = z.infer<typeof ValidationRuleResultSchema>;

export const ClaimValidationDataSchema = z.object({
  validation_status: z.enum(['PASSED', 'WARNINGS', 'FAILED', 'PENDING']),
  validation_score: z.number().min(0).max(100),
  validation_errors: z.array(z.string()).default([]),
  validation_warnings: z.array(z.string()).default([]),
  approval_required: z.boolean().default(false),
  rules_evaluated: z.array(ValidationRuleResultSchema).default([]),
  evaluated_at: z.string(),
});

export type ClaimValidationData = z.infer<typeof ClaimValidationDataSchema>;

export const ProcessValidationSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
});

export type ProcessValidationRequest = z.infer<typeof ProcessValidationSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
