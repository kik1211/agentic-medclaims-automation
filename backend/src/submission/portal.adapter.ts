import { ClaimEntity } from '../repositories/claim.repository.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { PortalSubmissionResult } from './submission.schema.js';
import { logger } from '../utils/logger.js';

export interface IPortalAdapter {
  submitClaim(
    claim: ClaimEntity,
    clinical: ClinicalDocumentData,
    coding: MedicalCodingData
  ): Promise<PortalSubmissionResult>;
}

export class MockPortalAdapter implements IPortalAdapter {
  public async submitClaim(
    claim: ClaimEntity,
    clinical: ClinicalDocumentData,
    coding: MedicalCodingData
  ): Promise<PortalSubmissionResult> {
    const logs: string[] = [];
    const timestamp = new Date().toISOString();

    const addLog = (msg: string): void => {
      logs.push(`[${new Date().toISOString()}] ${msg}`);
      logger.info(`MockPortalAdapter [Claim ${claim.id}]: ${msg}`);
    };

    addLog('Submission started');
    addLog(`Portal opened: ${claim.insurer_code || 'STANDARD_INSURANCE'}_PORTAL`);
    addLog(`Filling patient details: ${clinical.patient_name || 'N/A'}`);
    addLog(
      `Populating ICD-10 (${coding.primary_icd10?.code || 'N/A'}) and ${coding.cpt_codes.length} CPT codes`
    );
    addLog(`Form completed for claim amount ₹${clinical.claim_amount || 0}`);

    const refNumber = `REF_SUB_${Date.now().toString(36).toUpperCase()}_${claim.id.substring(4, 10).toUpperCase()}`;
    addLog(`Portal reference generated: ${refNumber}`);
    addLog('Submission completed successfully');

    return {
      portal_reference: refNumber,
      submission_status: 'SUBMITTED',
      submitted_at: timestamp,
      submission_logs: logs,
      portal_name: `${claim.insurer_code || 'STANDARD'}_MOCK_PORTAL`,
    };
  }
}

export class InsurancePortalAdapter implements IPortalAdapter {
  public async submitClaim(
    claim: ClaimEntity,
    clinical: ClinicalDocumentData,
    coding: MedicalCodingData
  ): Promise<PortalSubmissionResult> {
    const mock = new MockPortalAdapter();
    return mock.submitClaim(claim, clinical, coding);
  }
}

export class GovernmentSchemeAdapter implements IPortalAdapter {
  public async submitClaim(
    claim: ClaimEntity,
    clinical: ClinicalDocumentData,
    coding: MedicalCodingData
  ): Promise<PortalSubmissionResult> {
    const mock = new MockPortalAdapter();
    return mock.submitClaim(claim, clinical, coding);
  }
}
