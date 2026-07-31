import { IClinicalRepository, clinicalRepository, ClinicalExtractionEntity } from '../repositories/clinical.repository.js';
import { IDocumentRepository, documentRepository } from '../repositories/document.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { IGeminiService, geminiService } from '../llm/gemini.service.js';
import { ClinicalDocumentData } from '../llm/json.validator.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface StructuredClinicalResponse {
  claimId: string;
  clinicalStatus: string;
  data: ClinicalDocumentData | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}

export class ClinicalService {
  constructor(
    private readonly clinicalRepo: IClinicalRepository = clinicalRepository,
    private readonly docRepo: IDocumentRepository = documentRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly llmService: IGeminiService = geminiService
  ) {}

  public async structureClaimClinicalData(claimId: string): Promise<StructuredClinicalResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    const docs = await this.docRepo.findByClaimId(claimId);
    const completedOcrDocs = docs.filter(
      (d) => d.ocr_status === 'COMPLETED' && d.ocr_text && d.ocr_text.trim().length > 0
    );

    if (completedOcrDocs.length === 0) {
      throw new BadRequestError(
        `Cannot structure clinical data: No documents with completed OCR text found for claim '${claimId}'`
      );
    }

    const combinedOcrText = completedOcrDocs
      .map((d) => `--- DOCUMENT: ${d.file_name} (${d.document_type}) ---\n${d.ocr_text}`)
      .join('\n\n');

    const startedAt = new Date().toISOString();
    await this.clinicalRepo.updateExtraction(claimId, {
      clinical_status: 'IN_PROGRESS',
      clinical_started_at: startedAt,
      clinical_error: null,
    });

    try {
      const llmResult = await this.llmService.structureDocument({ ocrText: combinedOcrText });
      const completedAt = new Date().toISOString();
      const serializedJson = JSON.stringify(llmResult.data);

      await this.clinicalRepo.updateExtraction(claimId, {
        clinical_status: 'COMPLETED',
        clinical_json: serializedJson,
        clinical_completed_at: completedAt,
        clinical_error: null,
      });

      // Advance claim workflow status to CLINICAL_EXTRACTED
      await this.claimRepo.update(claimId, { status: 'CLINICAL_EXTRACTED' });

      logger.info(`ClinicalService: Successfully structured clinical data for claim ${claimId}`);

      return {
        claimId,
        clinicalStatus: 'COMPLETED',
        data: llmResult.data,
        startedAt,
        completedAt,
        error: null,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Clinical document structuring failed';
      logger.error(`ClinicalService: Structuring failed for claim ${claimId}: ${errorMsg}`);

      await this.clinicalRepo.updateExtraction(claimId, {
        clinical_status: 'FAILED',
        clinical_error: errorMsg,
      });

      return {
        claimId,
        clinicalStatus: 'FAILED',
        data: null,
        startedAt,
        completedAt: null,
        error: errorMsg,
      };
    }
  }

  public async getClinicalData(claimId: string): Promise<StructuredClinicalResponse> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' not found`);
    }

    const record = await this.clinicalRepo.getExtraction(claimId);
    let parsedData: ClinicalDocumentData | null = null;

    if (record?.clinical_json) {
      try {
        parsedData = JSON.parse(record.clinical_json) as ClinicalDocumentData;
      } catch {
        parsedData = null;
      }
    }

    return {
      claimId,
      clinicalStatus: record?.clinical_status || 'PENDING',
      data: parsedData,
      startedAt: record?.clinical_started_at,
      completedAt: record?.clinical_completed_at,
      error: record?.clinical_error,
    };
  }
}

export const clinicalService = new ClinicalService();
