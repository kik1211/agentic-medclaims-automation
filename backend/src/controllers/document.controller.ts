import { Request, Response, NextFunction } from 'express';
import { documentService, DocumentService } from '../services/document.service.js';
import { ok, created } from '../responses/index.js';
import { BadRequestError } from '../errors/AppError.js';
import { UploadDocumentRequest, DocumentIdParam, ClaimIdParam } from '../schemas/document.schema.js';

export class DocumentController {
  constructor(private readonly service: DocumentService = documentService) {}

  public uploadDocument = async (
    req: Request<Record<string, never>, Record<string, never>, UploadDocumentRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file attached. Attach a file using key "file"');
      }

      const { claim_id, document_type } = req.body;

      const result = await this.service.uploadDocument(claim_id, document_type || 'OTHER', {
        originalName: req.file.originalname,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      created(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getDocumentById = async (
    req: Request<DocumentIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const document = await this.service.getDocumentById(id);
      ok(res, document);
    } catch (err) {
      next(err);
    }
  };

  public getDocumentsByClaimId = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const documents = await this.service.getDocumentsByClaimId(id);
      ok(res, documents);
    } catch (err) {
      next(err);
    }
  };

  public deleteDocument = async (
    req: Request<DocumentIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.service.deleteDocument(id);
      ok(res, { deleted: success, id });
    } catch (err) {
      next(err);
    }
  };

  public processOcr = async (
    req: Request<DocumentIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const document = await this.service.processDocumentOcr(id);
      ok(res, document);
    } catch (err) {
      next(err);
    }
  };
}

export const documentController = new DocumentController();
