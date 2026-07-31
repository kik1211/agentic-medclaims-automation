import { IIcdService, icdService } from './icd.service.js';
import { ICptService, cptService } from './cpt.service.js';
import { ICodingRepository, codingRepository } from '../repositories/coding.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { MedicalCodingData, MedicalCodingDataSchema } from '../schemas/coding.schema.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';

export interface StructuredCodingResponse {
  claimId: string;
  codingStatus: string;
  data: MedicalCodingData | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}

export interface ICodingService {
  mapClinicalToCodes(clinicalData: ClinicalDocumentData): Promise<MedicalCodingData>;
  processClaimCoding(claimId: string): Promise<StructuredCodingResponse>;
}

export class CodingService implements ICodingService {
  constructor(
    private readonly icdMapper: IIcdService = icdService,
    private readonly cptMapper: ICptService = cptService,
    private readonly codingRepo: ICodingRepository = codingRepository,
    private readonly claimRepo: IClaimRepository = claimRepository
  ) {}

  public async mapClinicalToCodes(clinicalData: ClinicalDocumentData): Promise<MedicalCodingData> {
    const startTime = Date.now();
    logger.info('CodingService: Starting ICD-10 and CPT medical auto-coding pipeline');

    try {
      const icdResult = this.icdMapper.mapDiagnosis(clinicalData.diagnosis);
      const cptResult = this.cptMapper.mapProcedures(clinicalData.procedures);

      const confidenceScores: Record<string, number> = {};
      if (icdResult.primary) {
        confidenceScores[icdResult.primary.code] = icdResult.primary.confidence;
      }
      for (const cpt of cptResult) {
        confidenceScores[cpt.code] = cpt.confidence;
      }

      const rawCoding: MedicalCodingData = {
        primary_icd10: icdResult.primary,
        secondary_icd10: icdResult.secondary,
        cpt_codes: cptResult,
        confidence_scores: confidenceScores,
        coding_notes: `Auto-coded successfully for diagnosis '${clinicalData.diagnosis || 'N/A'}' with ${cptResult.length} CPT procedure code(s).`,
        coding_status: 'COMPLETED',
      };

      const validationResult = MedicalCodingDataSchema.safeParse(rawCoding);
      if (!validationResult.success) {
        const formattedErr = JSON.stringify(validationResult.error.format());
        logger.error(`CodingService Zod validation error: ${formattedErr}`);
        throw new BadRequestError(`Medical coding output failed schema validation: ${formattedErr}`);
      }

      const durationMs = Date.now() - startTime;
      logger.info(
        `CodingService: Completed medical auto-coding in ${durationMs}ms (Primary ICD: ${icdResult.primary?.code || 'None'}, CPT count: ${cptResult.length})`
      );

      return validationResult.data;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Medical coding execution failure';
      logger.error(`CodingService: Auto-coding failed after ${durationMs}ms: ${errorMsg}`);
      throw new Error(`Medical coding pipeline failed: ${errorMsg}`);
    }
  }

  public async processClaimCoding(claimId: string): Promise<StructuredCodingResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    if (claim.clinical_status !== 'COMPLETED' || !claim.clinical_json) {
      throw new BadRequestError(
        `Cannot perform medical coding: Clinical data structuring is not completed for claim '${claimId}'`
      );
    }

    let clinicalData: ClinicalDocumentData;
    try {
      clinicalData = JSON.parse(claim.clinical_json) as ClinicalDocumentData;
    } catch {
      throw new BadRequestError(`Failed to parse clinical JSON for claim '${claimId}'`);
    }

    const startedAt = new Date().toISOString();
    await this.codingRepo.updateCoding(claimId, {
      coding_status: 'IN_PROGRESS',
      coding_started_at: startedAt,
      coding_error: null,
    });

    try {
      const codingResult = await this.mapClinicalToCodes(clinicalData);
      const completedAt = new Date().toISOString();
      const serializedJson = JSON.stringify(codingResult);

      await this.codingRepo.updateCoding(claimId, {
        coding_status: 'COMPLETED',
        coding_json: serializedJson,
        coding_completed_at: completedAt,
        coding_error: null,
      });

      await this.claimRepo.update(claimId, { status: 'AUTO_CODED' });

      return {
        claimId,
        codingStatus: 'COMPLETED',
        data: codingResult,
        startedAt,
        completedAt,
        error: null,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Medical auto-coding failure';
      await this.codingRepo.updateCoding(claimId, {
        coding_status: 'FAILED',
        coding_error: errorMsg,
      });

      return {
        claimId,
        codingStatus: 'FAILED',
        data: null,
        startedAt,
        completedAt: null,
        error: errorMsg,
      };
    }
  }
}

export const codingService = new CodingService();
