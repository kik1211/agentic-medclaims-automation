import { ISubmissionRepository, submissionRepository } from './submission.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { PlaywrightService, playwrightService } from './playwright.service.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { PortalSubmissionResult } from './submission.schema.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface StructuredSubmissionResponse {
  claimId: string;
  submissionStatus: string;
  reference: string | null;
  data: PortalSubmissionResult | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}

export class SubmissionService {
  constructor(
    private readonly subRepo: ISubmissionRepository = submissionRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly pwService: PlaywrightService = playwrightService
  ) {}

  public async submitClaim(claimId: string): Promise<StructuredSubmissionResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    if (claim.status !== 'APPROVED_BY_REVIEWER') {
      throw new BadRequestError(
        `Cannot submit claim to portal: Claim '${claimId}' is in status '${claim.status}'. Only claims with status 'APPROVED_BY_REVIEWER' are eligible for portal submission.`
      );
    }

    if (!claim.clinical_json || !claim.coding_json) {
      throw new BadRequestError(`Claim '${claimId}' is missing structured clinical or coding JSON payload`);
    }

    let clinical: ClinicalDocumentData;
    let coding: MedicalCodingData;

    try {
      clinical = JSON.parse(claim.clinical_json) as ClinicalDocumentData;
      coding = JSON.parse(claim.coding_json) as MedicalCodingData;
    } catch {
      throw new BadRequestError(`Failed to parse clinical or coding JSON for claim '${claimId}'`);
    }

    const startedAt = new Date().toISOString();
    await this.subRepo.updateSubmission(claimId, {
      submission_status: 'IN_PROGRESS',
      submission_started_at: startedAt,
      submission_error: null,
    });

    try {
      const result = await this.pwService.executeSubmission(claim, clinical, coding);
      const completedAt = new Date().toISOString();

      await this.subRepo.updateSubmission(claimId, {
        submission_status: 'SUBMITTED',
        submission_reference: result.portal_reference,
        submission_completed_at: completedAt,
        submission_error: null,
      });

      await this.claimRepo.update(claimId, {
        status: 'SUBMITTED',
        completed_at: completedAt,
      });

      logger.info(
        `SubmissionService: Successfully submitted claim ${claimId} to portal ${result.portal_name} (Ref: ${result.portal_reference})`
      );

      return {
        claimId,
        submissionStatus: 'SUBMITTED',
        reference: result.portal_reference,
        data: result,
        startedAt,
        completedAt,
        error: null,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Portal submission failure';
      logger.error(`SubmissionService: Portal submission failed for claim ${claimId}: ${errorMsg}`);

      await this.subRepo.updateSubmission(claimId, {
        submission_status: 'FAILED',
        submission_error: errorMsg,
      });

      return {
        claimId,
        submissionStatus: 'FAILED',
        reference: null,
        data: null,
        startedAt,
        completedAt: null,
        error: errorMsg,
      };
    }
  }

  public async getSubmissionData(claimId: string): Promise<StructuredSubmissionResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' not found`);
    }

    const record = await this.subRepo.getSubmission(claimId);

    return {
      claimId,
      submissionStatus: record?.submission_status || 'PENDING',
      reference: record?.submission_reference || null,
      data: null,
      startedAt: record?.submission_started_at,
      completedAt: record?.submission_completed_at,
      error: record?.submission_error,
    };
  }
}

export const submissionService = new SubmissionService();
