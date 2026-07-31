import { Request, Response, NextFunction } from 'express';
import { ICodingRepository, codingRepository } from '../repositories/coding.repository.js';
import { ICodingService, codingService } from '../coding/coding.service.js';
import { MedicalCodingData } from '../schemas/coding.schema.js';
import { ok } from '../responses/index.js';
import { ClaimIdParam } from '../schemas/coding.schema.js';

export interface ProcessCodingResponse {
  claimId: string;
  codingStatus: string;
  data: MedicalCodingData | null;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}

export class CodingController {
  constructor(
    private readonly codingRepo: ICodingRepository = codingRepository,
    private readonly service: ICodingService = codingService
  ) {}

  public processCoding = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: claimId } = req.params;
      const result = await this.service.processClaimCoding(claimId);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getCoding = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: claimId } = req.params;
      const record = await this.codingRepo.getCoding(claimId);

      let parsedData: MedicalCodingData | null = null;
      if (record?.coding_json) {
        try {
          parsedData = JSON.parse(record.coding_json) as MedicalCodingData;
        } catch {
          parsedData = null;
        }
      }

      ok(res, {
        claimId,
        codingStatus: record?.coding_status || 'PENDING',
        data: parsedData,
        startedAt: record?.coding_started_at,
        completedAt: record?.coding_completed_at,
        error: record?.coding_error,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const codingController = new CodingController();
