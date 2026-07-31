import { z } from 'zod';
import { BadRequestError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export const ClinicalDocumentDataSchema = z.object({
  patient_name: z.string().nullable().default(null),
  patient_age: z.number().nullable().default(null),
  gender: z.string().nullable().default(null),
  hospital_name: z.string().nullable().default(null),
  doctor_name: z.string().nullable().default(null),
  admission_date: z.string().nullable().default(null),
  discharge_date: z.string().nullable().default(null),
  diagnosis: z.string().nullable().default(null),
  procedures: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  claim_amount: z.number().nullable().default(null),
  supporting_documents: z.array(z.string()).default([]),
  clinical_summary: z.string().nullable().default(null),
});

export type ClinicalDocumentData = z.infer<typeof ClinicalDocumentDataSchema>;

export class JsonValidator {
  public static cleanJsonString(input: string): string {
    let clean = input.trim();

    // Strip markdown code fences if present (```json ... ``` or ``` ...)
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    return clean.trim();
  }

  public static parseAndValidate(rawOutput: string): ClinicalDocumentData {
    const cleanString = this.cleanJsonString(rawOutput);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanString);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'JSON parse failure';
      logger.error(`JsonValidator failed to parse string: ${msg}`);
      throw new BadRequestError(`LLM response is not valid JSON: ${msg}`);
    }

    const validationResult = ClinicalDocumentDataSchema.safeParse(parsed);
    if (!validationResult.success) {
      const formattedErrors = JSON.stringify(validationResult.error.format());
      logger.error(`JsonValidator Zod validation error: ${formattedErrors}`);
      throw new BadRequestError(`LLM response failed schema validation: ${formattedErrors}`);
    }

    return validationResult.data;
  }
}
