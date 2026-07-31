import { IDocumentRepository, documentRepository, DocumentEntity } from '../repositories/document.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { IStorageService } from '../storage/storage.service.js';
import { diskStorageService } from '../storage/disk.storage.js';
import { ITesseractService, tesseractService } from './tesseract.service.js';
import { NotFoundError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export class OcrService {
  constructor(
    private readonly docRepo: IDocumentRepository = documentRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly storageService: IStorageService = diskStorageService,
    private readonly ocrEngine: ITesseractService = tesseractService
  ) {}

  public async processDocumentOcr(documentId: string): Promise<DocumentEntity> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) {
      throw new NotFoundError(`Document with ID '${documentId}' not found for OCR processing`);
    }

    const startedAt = new Date().toISOString();
    await this.docRepo.update(documentId, {
      ocr_status: 'IN_PROGRESS',
      ocr_started_at: startedAt,
      ocr_error: null,
    });

    try {
      const fullPath = this.storageService.getPath(doc.file_path);
      const ocrResult = await this.ocrEngine.extractText(fullPath, doc.mime_type);
      const completedAt = new Date().toISOString();

      const updatedDoc = await this.docRepo.update(documentId, {
        ocr_text: ocrResult.text,
        ocr_status: 'COMPLETED',
        ocr_completed_at: completedAt,
        ocr_error: null,
      });

      // Update associated claim status to OCR_COMPLETE
      await this.claimRepo.update(doc.claim_id, { status: 'OCR_COMPLETE' });

      logger.info(`OcrService: OCR successfully processed document ${documentId}`);
      if (!updatedDoc) {
        throw new Error('Failed to retrieve updated document entity');
      }
      return updatedDoc;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OCR execution error';
      logger.error(`OcrService: OCR processing failed for document ${documentId}: ${errorMsg}`);

      const failedDoc = await this.docRepo.update(documentId, {
        ocr_status: 'FAILED',
        ocr_error: errorMsg,
      });

      if (!failedDoc) {
        throw new Error(`Failed to update OCR error state for document ${documentId}`);
      }
      return failedDoc;
    }
  }
}

export const ocrService = new OcrService();
