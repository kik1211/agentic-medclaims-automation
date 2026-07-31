import { Request, Response, NextFunction } from 'express';
import { clinicalService, ClinicalService } from '../services/clinical.service.js';
import { ok } from '../responses/index.js';
import { ClaimIdParam } from '../schemas/clinical.schema.js';

export class ClinicalController {
  constructor(private readonly service: ClinicalService = clinicalService) {}

  public processClinicalExtraction = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.structureClaimClinicalData(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getClinicalExtraction = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.getClinicalData(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const clinicalController = new ClinicalController();
