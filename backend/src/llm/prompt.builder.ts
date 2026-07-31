export interface PromptContext {
  ocrText: string;
  claimType?: string;
  hospitalName?: string;
}

export class PromptBuilder {
  public static buildClinicalExtractionPrompt(context: PromptContext): string {
    return `You are a specialized clinical data extraction AI system for medical insurance claims in India.
Analyze the following OCR text extracted from medical records, lab reports, and discharge summaries.
Extract all key clinical attributes into a valid JSON object matching the EXACT JSON structure below.

RULES:
1. Output ONLY valid, raw JSON. Do not include markdown headers, code blocks, or conversational text.
2. If a field is not found or ambiguous, set its value to null (or [] for arrays).
3. Do NOT invent medical codes, diagnosis codes, or ICD codes. Extract factual text strings only.
4. Clean and normalize dates to YYYY-MM-DD format whenever possible.
5. Parse numerical fields (patient_age, claim_amount) as pure numbers, removing currency symbols (e.g. ₹ or Rs.).

REQUIRED JSON STRUCTURE:
{
  "patient_name": "Full Patient Name or null",
  "patient_age": 45,
  "gender": "MALE | FEMALE | OTHER or null",
  "hospital_name": "Hospital Name or null",
  "doctor_name": "Attending Doctor Name or null",
  "admission_date": "YYYY-MM-DD or null",
  "discharge_date": "YYYY-MM-DD or null",
  "diagnosis": "Primary Diagnosis string or null",
  "procedures": ["List of procedure names"],
  "medications": ["List of medication names with dosage if available"],
  "claim_amount": 150000.00,
  "supporting_documents": ["List of supporting document types mentioned"],
  "clinical_summary": "Concise summary of admission reason, treatment provided, and discharge condition"
}

OCR TEXT TO PROCESS:
---
${context.ocrText}
---
`;
  }
}
