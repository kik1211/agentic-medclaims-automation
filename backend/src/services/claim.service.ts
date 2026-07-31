import { IClaimRepository, ClaimEntity, claimRepository } from '../repositories/claim.repository.js';
import { CreateClaimRequest, UpdateClaimRequest } from '../schemas/claim.schema.js';
import { logger } from '../utils/logger.js';

export class ClaimService {
  constructor(private readonly repo: IClaimRepository = claimRepository) {}

  public async getClaims(): Promise<ClaimEntity[]> {
    return this.repo.findAll();
  }

  public async getClaimById(id: string): Promise<ClaimEntity | null> {
    return this.repo.findById(id);
  }

  public async createClaim(data: CreateClaimRequest): Promise<ClaimEntity> {
    const timestamp = new Date().toISOString();
    const newClaim: Omit<ClaimEntity, 'id'> = {
      hospital_id: data.hospital_id,
      claim_type: data.claim_type,
      status: 'DRAFT',
      created_at: timestamp,
      updated_at: timestamp,
      insurer_code: data.insurer_code,
      priority: data.priority || 'NORMAL',
      pre_auth_reference: data.pre_auth_reference,
      notes: data.notes,
    };
    const createdClaim = await this.repo.create(newClaim);
    logger.info(`ClaimService: Created claim ${createdClaim.id}`);
    return createdClaim;
  }

  public async updateClaim(id: string, data: UpdateClaimRequest): Promise<ClaimEntity | null> {
    const updatedClaim = await this.repo.update(id, data);
    if (updatedClaim) {
      logger.info(`ClaimService: Updated claim ${id}`);
    }
    return updatedClaim;
  }

  public async deleteClaim(id: string): Promise<boolean> {
    const deleted = await this.repo.delete(id);
    if (deleted) {
      logger.info(`ClaimService: Deleted claim ${id}`);
    }
    return deleted;
  }
}

export const claimService = new ClaimService();
