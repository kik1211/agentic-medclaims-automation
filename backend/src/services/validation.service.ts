import { IValidationRepository, validationRepository } from '../repositories/validation.repository.js';
import { IDocumentRepository, documentRepository } from '../repositories/document.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { RulesEngine, rulesEngine } from '../validation/rules.engine.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { ClaimValidationData } from '../schemas/validation.schema.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface StructuredValidationResponse {
  claimId: string;
  validationStatus: string;
  data: ClaimValidationData | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}

export class ValidationService {
  constructor(
    private readonly validationRepo: IValidationRepository = validationRepository,
    private readonly docRepo: IDocumentRepository = documentRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly engine: RulesEngine = rulesEngine
  ) {}

  public async validateClaim(claimId: string): Promise<StructuredValidationResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    if (claim.clinical_status !== 'COMPLETED' || !claim.clinical_json) {
      throw new BadRequestError(
        `Cannot run claim validation: Clinical data structuring is not completed for claim '${claimId}'`
      );
    }

    if (claim.coding_status !== 'COMPLETED' || !claim.coding_json) {
      throw new BadRequestError(
        `Cannot run claim validation: Medical auto-coding is not completed for claim '${claimId}'`
      );
    }

    let clinical: ClinicalDocumentData;
    let coding: MedicalCodingData;

    try {
      clinical = JSON.parse(claim.clinical_json) as ClinicalDocumentData;
      coding = JSON.parse(claim.coding_json) as MedicalCodingData;
    } catch {
      throw new BadRequestError(`Failed to parse clinical or coding JSON for claim '${claimId}'`);
    }

    const docs = await this.docRepo.findByClaimId(claimId);
    const documentCount = docs.length;

    const startedAt = new Date().toISOString();
    await this.validationRepo.updateValidation(claimId, {
      validation_status: 'IN_PROGRESS',
      validation_started_at: startedAt,
      validation_error: null,
    });

    try {
      const valResult = this.engine.evaluate({ clinical, coding, documentCount });
      const completedAt = new Date().toISOString();
      const serializedJson = JSON.stringify(valResult);

      const dbStatus = valResult.validation_status as 'PASSED' | 'WARNINGS' | 'FAILED';
      await this.validationRepo.updateValidation(claimId, {
        validation_status: dbStatus,
        validation_json: serializedJson,
        validation_completed_at: completedAt,
        validation_error: null,
      });

      // Update overall claim workflow status
      const nextWorkflowStatus = valResult.approval_required || valResult.validation_status !== 'PASSED'
        ? 'READY_FOR_REVIEW'
        : 'VALIDATED';

      await this.claimRepo.update(claimId, { status: nextWorkflowStatus });

      logger.info(`ValidationService: Successfully validated claim ${claimId} (Status: ${valResult.validation_status}, Workflow: ${nextWorkflowStatus})`);

      return {
        claimId,
        validationStatus: valResult.validation_status,
        data: valResult,
        startedAt,
        completedAt,
        error: null,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Claim validation engine failure';
      logger.error(`ValidationService: Validation failed for claim ${claimId}: ${errorMsg}`);

      await this.validationRepo.updateValidation(claimId, {
        validation_status: 'FAILED',
        validation_error: errorMsg,
      });

      return {
        claimId,
        validationStatus: 'FAILED',
        data: null,
        startedAt,
        completedAt: null,
        error: errorMsg,
      };
    }
  }

  public async getValidationData(claimId: string): Promise<StructuredValidationResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' not found`);
    }

    const record = await this.validationRepo.getValidation(claimId);
    let parsedData: ClaimValidationData | null = null;

    if (record?.validation_json) {
      try {
        parsedData = JSON.parse(record.validation_json) as ClaimValidationData;
      } catch {
        parsedData = null;
      }
    }

    return {
      claimId,
      validationStatus: record?.validation_status || 'PENDING',
      data: parsedData,
      startedAt: record?.validation_started_at,
      completedAt: record?.validation_completed_at,
      error: record?.validation_error,
    };
  }
}

export const validationService = new ValidationService();
