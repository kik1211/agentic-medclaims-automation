import { Request, Response, NextFunction } from 'express';
import { validationService, ValidationService } from '../services/validation.service.js';
import { ok } from '../responses/index.js';
import { ClaimIdParam } from '../schemas/validation.schema.js';

export class ValidationController {
  constructor(private readonly service: ValidationService = validationService) {}

  public processValidation = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.validateClaim(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getValidation = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.getValidationData(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const validationController = new ValidationController();
