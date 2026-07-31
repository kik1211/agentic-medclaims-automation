import { z } from 'zod';

export const DocumentTypeEnum = z.enum([
  'PRE_AUTH_FORM',
  'LAB_REPORT',
  'DISCHARGE_SUMMARY',
  'BILLING_NOTE',
  'DOCTOR_PRESCRIPTION',
  'OTHER',
]);

export const UploadDocumentSchema = z.object({
  claim_id: z.string().min(1, 'Claim ID is required'),
  document_type: DocumentTypeEnum.default('OTHER'),
});

export type UploadDocumentRequest = z.infer<typeof UploadDocumentSchema>;

export const DocumentIdParamSchema = z.object({
  id: z.string().min(1, 'Document ID is required'),
});

export type DocumentIdParam = z.infer<typeof DocumentIdParamSchema>;

export const ClaimIdParamSchema = z.object({
  id: z.string().min(1, 'Claim ID is required'),
});

export type ClaimIdParam = z.infer<typeof ClaimIdParamSchema>;
