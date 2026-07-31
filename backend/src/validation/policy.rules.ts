import { ClinicalDocumentData } from '../llm/json.validator.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { ValidationRuleResult } from '../schemas/validation.schema.js';

export interface ValidationContext {
  clinical: ClinicalDocumentData;
  coding: MedicalCodingData;
  documentCount: number;
}

export interface IPolicyRule {
  id: string;
  name: string;
  evaluate(context: ValidationContext): ValidationRuleResult;
}

export class RequiredFieldsRule implements IPolicyRule {
  public id = 'RULE_REQUIRED_FIELDS';
  public name = 'Patient and Hospital Demographic Verification';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const missing: string[] = [];
    if (!context.clinical.patient_name) missing.push('patient_name');
    if (!context.clinical.admission_date) missing.push('admission_date');
    if (!context.clinical.hospital_name) missing.push('hospital_name');

    const passed = missing.length === 0;
    return {
      rule_id: this.id,
      rule_name: this.name,
      passed,
      severity: 'ERROR',
      message: passed
        ? 'All required demographic fields are present.'
        : `Missing required fields: ${missing.join(', ')}`,
    };
  }
}

export class DiagnosisPresentRule implements IPolicyRule {
  public id = 'RULE_DIAGNOSIS_PRESENT';
  public name = 'Clinical Diagnosis Presence';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const passed = Boolean(context.clinical.diagnosis && context.clinical.diagnosis.trim().length > 0);
    return {
      rule_id: this.id,
      rule_name: this.name,
      passed,
      severity: 'ERROR',
      message: passed
        ? 'Clinical diagnosis is documented.'
        : 'Primary clinical diagnosis is missing from documentation.',
    };
  }
}

export class ProcedurePresentRule implements IPolicyRule {
  public id = 'RULE_PROCEDURE_PRESENT';
  public name = 'Clinical Procedure Presence';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const passed = Boolean(context.clinical.procedures && context.clinical.procedures.length > 0);
    return {
      rule_id: this.id,
      rule_name: this.name,
      passed,
      severity: 'WARNING',
      message: passed
        ? 'At least one clinical procedure is documented.'
        : 'No procedure listed in clinical documentation.',
    };
  }
}

export class ClaimAmountRule implements IPolicyRule {
  public id = 'RULE_CLAIM_AMOUNT';
  public name = 'Claim Amount Validity and Threshold Check';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const amount = context.clinical.claim_amount;

    if (amount === null || amount === undefined || amount <= 0) {
      return {
        rule_id: this.id,
        rule_name: this.name,
        passed: false,
        severity: 'ERROR',
        message: 'Invalid or missing claim amount.',
      };
    }

    if (amount > 300000) {
      return {
        rule_id: this.id,
        rule_name: this.name,
        passed: false,
        severity: 'WARNING',
        message: `High-value claim amount (₹${amount.toLocaleString()}) exceeds automatic approval threshold (₹3,00,000). Human review required.`,
      };
    }

    return {
      rule_id: this.id,
      rule_name: this.name,
      passed: true,
      severity: 'INFO',
      message: `Claim amount (₹${amount.toLocaleString()}) is valid within standard threshold limits.`,
    };
  }
}

export class DocumentAvailabilityRule implements IPolicyRule {
  public id = 'RULE_DOCUMENT_AVAILABILITY';
  public name = 'Supporting Document File Upload Verification';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const passed = context.documentCount > 0;
    return {
      rule_id: this.id,
      rule_name: this.name,
      passed,
      severity: 'ERROR',
      message: passed
        ? `Claim has ${context.documentCount} uploaded document(s).`
        : 'No uploaded document files found for claim.',
    };
  }
}

export class CodingConfidenceRule implements IPolicyRule {
  public id = 'RULE_CODING_CONFIDENCE';
  public name = 'ICD-10 and CPT Auto-Coding Confidence Check';

  public evaluate(context: ValidationContext): ValidationRuleResult {
    const primaryConfidence = context.coding.primary_icd10?.confidence || 0;
    const lowCptConfidence = context.coding.cpt_codes.some((c) => c.confidence < 80);

    if (primaryConfidence < 80 || lowCptConfidence) {
      return {
        rule_id: this.id,
        rule_name: this.name,
        passed: false,
        severity: 'WARNING',
        message: `Medical coding confidence is low (Primary ICD: ${primaryConfidence}%). Human reviewer verification required.`,
      };
    }

    return {
      rule_id: this.id,
      rule_name: this.name,
      passed: true,
      severity: 'INFO',
      message: 'Medical coding confidence scores meet required threshold (>= 80%).',
    };
  }
}

export const ALL_POLICY_RULES: IPolicyRule[] = [
  new RequiredFieldsRule(),
  new DiagnosisPresentRule(),
  new ProcedurePresentRule(),
  new ClaimAmountRule(),
  new DocumentAvailabilityRule(),
  new CodingConfidenceRule(),
];
