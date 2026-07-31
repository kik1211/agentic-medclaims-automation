import { IDocumentRepository, documentRepository, DocumentEntity } from '../repositories/document.repository.js';
import { IClaimRepository, claimRepository } from '../repositories/claim.repository.js';
import { IStorageService, FileUploadInput } from '../storage/storage.service.js';
import { diskStorageService } from '../storage/disk.storage.js';
import { ocrWorker, OcrWorkerQueue } from '../workers/ocr.worker.js';
import { ocrService, OcrService } from '../ocr/ocr.service.js';
import { NotFoundError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export class DocumentService {
  constructor(
    private readonly docRepo: IDocumentRepository = documentRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly storageService: IStorageService = diskStorageService,
    private readonly workerQueue: OcrWorkerQueue = ocrWorker,
    private readonly ocrEngineService: OcrService = ocrService
  ) {}

  public async uploadDocument(
    claimId: string,
    documentType: string,
    file: FileUploadInput
  ): Promise<DocumentEntity> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    const storedFile = await this.storageService.save(claimId, file);
    const timestamp = new Date().toISOString();

    const docEntity = await this.docRepo.create({
      claim_id: claimId,
      file_name: file.originalName,
      file_path: storedFile.filePath,
      file_size: storedFile.fileSize,
      mime_type: file.mimeType,
      document_type: documentType,
      ocr_status: 'PENDING',
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (claim.status === 'DRAFT') {
      await this.claimRepo.update(claimId, { status: 'DOCUMENTS_UPLOADED' });
    }

    logger.info(`DocumentService: Uploaded document ${docEntity.id} for claim ${claimId}`);

    // Enqueue OCR worker asynchronously without blocking HTTP response
    this.workerQueue.enqueue(docEntity.id);

    return docEntity;
  }

  public async getDocumentById(id: string): Promise<DocumentEntity> {
    const doc = await this.docRepo.findById(id);
    if (!doc) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }
    return doc;
  }

  public async getDocumentsByClaimId(claimId: string): Promise<DocumentEntity[]> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' not found`);
    }
    return this.docRepo.findByClaimId(claimId);
  }

  public async deleteDocument(id: string): Promise<boolean> {
    const doc = await this.docRepo.findById(id);
    if (!doc) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    await this.storageService.delete(doc.file_path);
    const deleted = await this.docRepo.delete(id);
    logger.info(`DocumentService: Deleted document ${id}`);
    return deleted;
  }

  public async processDocumentOcr(id: string): Promise<DocumentEntity> {
    return this.ocrEngineService.processDocumentOcr(id);
  }
}

export const documentService = new DocumentService();
