import { BaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface ClinicalExtractionEntity {
  claim_id: string;
  clinical_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  clinical_json?: string | null;
  clinical_started_at?: string | null;
  clinical_completed_at?: string | null;
  clinical_error?: string | null;
  updated_at: string;
}

export interface IClinicalRepository {
  updateExtraction(
    claimId: string,
    data: Partial<Omit<ClinicalExtractionEntity, 'claim_id'>>
  ): Promise<ClinicalExtractionEntity | null>;
  getExtraction(claimId: string): Promise<ClinicalExtractionEntity | null>;
}

export class ClinicalRepository extends BaseRepository<ClinicalExtractionEntity, string> implements IClinicalRepository {
  public async findById(id: string): Promise<ClinicalExtractionEntity | null> {
    return this.getExtraction(id);
  }

  public async findAll(): Promise<ClinicalExtractionEntity[]> {
    try {
      const sql = `
        SELECT id as claim_id, clinical_status, clinical_json, clinical_started_at,
               clinical_completed_at, clinical_error, updated_at
        FROM claims
        WHERE clinical_status IS NOT NULL
        ORDER BY updated_at DESC
      `;
      return this.db.prepare(sql).all() as ClinicalExtractionEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query clinical extractions';
      logger.error(`ClinicalRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async getExtraction(claimId: string): Promise<ClinicalExtractionEntity | null> {
    try {
      const sql = `
        SELECT id as claim_id, clinical_status, clinical_json, clinical_started_at,
               clinical_completed_at, clinical_error, updated_at
        FROM claims
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(claimId) as ClinicalExtractionEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query clinical extraction by claim ID';
      logger.error(`ClinicalRepository.getExtraction error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async updateExtraction(
    claimId: string,
    data: Partial<Omit<ClinicalExtractionEntity, 'claim_id'>>
  ): Promise<ClinicalExtractionEntity | null> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (data.clinical_status !== undefined) {
        updates.push('clinical_status = ?');
        values.push(data.clinical_status);
      }
      if (data.clinical_json !== undefined) {
        updates.push('clinical_json = ?');
        values.push(data.clinical_json);
      }
      if (data.clinical_started_at !== undefined) {
        updates.push('clinical_started_at = ?');
        values.push(data.clinical_started_at);
      }
      if (data.clinical_completed_at !== undefined) {
        updates.push('clinical_completed_at = ?');
        values.push(data.clinical_completed_at);
      }
      if (data.clinical_error !== undefined) {
        updates.push('clinical_error = ?');
        values.push(data.clinical_error);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(claimId);

      const sql = `UPDATE claims SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.getExtraction(claimId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update clinical extraction record';
      logger.error(`ClinicalRepository.updateExtraction error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: ClinicalExtractionEntity): Promise<ClinicalExtractionEntity> {
    const updated = await this.updateExtraction(entity.claim_id, entity);
    if (!updated) {
      throw new DatabaseError(`Failed to initialize clinical extraction for claim ${entity.claim_id}`);
    }
    return updated;
  }

  public async update(id: string, entity: Partial<ClinicalExtractionEntity>): Promise<ClinicalExtractionEntity | null> {
    return this.updateExtraction(id, entity);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `UPDATE claims SET clinical_status = 'PENDING', clinical_json = NULL, clinical_error = NULL WHERE id = ?`;
    const res = this.db.prepare(sql).run(id);
    return res.changes > 0;
  }
}

export const clinicalRepository = new ClinicalRepository();
