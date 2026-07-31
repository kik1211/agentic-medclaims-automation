import { z } from 'zod';

export const IcdCodeItemSchema = z.object({
  code: z.string().min(1, 'ICD-10 code is required'),
  description: z.string(),
  confidence: z.number().min(0).max(100),
});

export type IcdCodeItem = z.infer<typeof IcdCodeItemSchema>;

export const CptCodeItemSchema = z.object({
  code: z.string().min(1, 'CPT code is required'),
  description: z.string(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(100),
});

export type CptCodeItem = z.infer<typeof CptCodeItemSchema>;

export const MedicalCodingDataSchema = z.object({
  primary_icd10: IcdCodeItemSchema.nullable().default(null),
  secondary_icd10: z.array(IcdCodeItemSchema).default([]),
  cpt_codes: z.array(CptCodeItemSchema).default([]),
  confidence_scores: z.record(z.string(), z.number()).default({}),
  coding_notes: z.string().default('Auto-coded based on clinical documentation.'),
  coding_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).default('COMPLETED'),
});

export type MedicalCodingData = z.infer<typeof MedicalCodingDataSchema>;

export const ProcessCodingSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
});

export type ProcessCodingRequest = z.infer<typeof ProcessCodingSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
