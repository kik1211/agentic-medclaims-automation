import { Request, Response, NextFunction } from 'express';
import { reviewService, ReviewService } from './review.service.js';
import { ok } from '../responses/index.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { DecisionRequest, ClaimIdParam } from './review.schema.js';

export class ReviewController {
  constructor(private readonly service: ReviewService = reviewService) {}

  public getPendingReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hospitalId = req.user?.hospitalId;
      const claims = await this.service.getPendingReviews(hospitalId);
      ok(res, claims);
    } catch (err) {
      next(err);
    }
  };

  public getClaimDetails = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { claimId } = req.params;
      const details = await this.service.getClaimReviewDetails(claimId);
      ok(res, details);
    } catch (err) {
      next(err);
    }
  };

  public approveClaim = async (
    req: Request<ClaimIdParam, Record<string, never>, DecisionRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }
      const { claimId } = req.params;
      const { comments } = req.body;

      const result = await this.service.submitDecision(claimId, req.user.userId, 'APPROVED', comments);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public rejectClaim = async (
    req: Request<ClaimIdParam, Record<string, never>, DecisionRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }
      const { claimId } = req.params;
      const { comments } = req.body;

      const result = await this.service.submitDecision(claimId, req.user.userId, 'REJECTED', comments);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public requestInfo = async (
    req: Request<ClaimIdParam, Record<string, never>, DecisionRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }
      const { claimId } = req.params;
      const { comments } = req.body;

      const result = await this.service.submitDecision(claimId, req.user.userId, 'INFO_REQUESTED', comments);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const reviewController = new ReviewController();
