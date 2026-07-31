import { IPortalAdapter, MockPortalAdapter, InsurancePortalAdapter, GovernmentSchemeAdapter } from './portal.adapter.js';
import { ClaimEntity } from '../repositories/claim.repository.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { PortalSubmissionResult } from './submission.schema.js';
import { logger } from '../utils/logger.js';

export class PlaywrightService {
  private getAdapter(claim: ClaimEntity): IPortalAdapter {
    if (claim.insurer_code?.toLowerCase().includes('govt') || claim.insurer_code?.toLowerCase().includes('pmjay')) {
      return new GovernmentSchemeAdapter();
    } else if (claim.insurer_code) {
      return new InsurancePortalAdapter();
    }
    return new MockPortalAdapter();
  }

  public async executeSubmission(
    claim: ClaimEntity,
    clinical: ClinicalDocumentData,
    coding: MedicalCodingData
  ): Promise<PortalSubmissionResult> {
    logger.info(`PlaywrightService: Selecting portal adapter for claim ${claim.id} (Insurer: ${claim.insurer_code || 'DEFAULT'})`);
    const adapter = this.getAdapter(claim);
    return adapter.submitClaim(claim, clinical, coding);
  }
}

export const playwrightService = new PlaywrightService();
