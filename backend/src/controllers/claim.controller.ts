import { Request, Response, NextFunction } from 'express';
import { claimService, ClaimService } from '../services/claim.service.js';
import { ok, created, notFound } from '../responses/index.js';
import { CreateClaimRequest, UpdateClaimRequest, ClaimIdParam } from '../schemas/claim.schema.js';

export class ClaimController {
  constructor(private readonly service: ClaimService = claimService) {}

  public getClaims = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const claims = await this.service.getClaims();
      ok(res, claims);
    } catch (err) {
      next(err);
    }
  };

  public getClaimById = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const claim = await this.service.getClaimById(id);
      if (!claim) {
        notFound(res, `Claim with ID '${id}' not found`);
        return;
      }
      ok(res, claim);
    } catch (err) {
      next(err);
    }
  };

  public createClaim = async (
    req: Request<Record<string, never>, Record<string, never>, CreateClaimRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const createdClaim = await this.service.createClaim(req.body);
      created(res, createdClaim);
    } catch (err) {
      next(err);
    }
  };

  public updateClaim = async (
    req: Request<ClaimIdParam, Record<string, never>, UpdateClaimRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedClaim = await this.service.updateClaim(id, req.body);
      if (!updatedClaim) {
        notFound(res, `Claim with ID '${id}' not found`);
        return;
      }
      ok(res, updatedClaim);
    } catch (err) {
      next(err);
    }
  };

  public deleteClaim = async (
    req: Request<ClaimIdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.service.deleteClaim(id);
      if (!success) {
        notFound(res, `Claim with ID '${id}' not found`);
        return;
      }
      ok(res, { deleted: true, id });
    } catch (err) {
      next(err);
    }
  };
}

export const claimController = new ClaimController();
