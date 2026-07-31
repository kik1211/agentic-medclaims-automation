import { Request, Response, NextFunction } from 'express';
import { submissionService, SubmissionService } from './submission.service.js';
import { ok } from '../responses/index.js';
import { ClaimIdParam } from './submission.schema.js';

export class SubmissionController {
  constructor(private readonly service: SubmissionService = submissionService) {}

  public processSubmission = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.submitClaim(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getSubmission = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.getSubmissionData(id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const submissionController = new SubmissionController();
