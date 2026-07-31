import { BaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface CodingExtractionEntity {
  claim_id: string;
  coding_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  coding_json?: string | null;
  coding_started_at?: string | null;
  coding_completed_at?: string | null;
  coding_error?: string | null;
  updated_at: string;
}

export interface ICodingRepository {
  updateCoding(
    claimId: string,
    data: Partial<Omit<CodingExtractionEntity, 'claim_id'>>
  ): Promise<CodingExtractionEntity | null>;
  getCoding(claimId: string): Promise<CodingExtractionEntity | null>;
}

export class CodingRepository extends BaseRepository<CodingExtractionEntity, string> implements ICodingRepository {
  public async findById(id: string): Promise<CodingExtractionEntity | null> {
    return this.getCoding(id);
  }

  public async findAll(): Promise<CodingExtractionEntity[]> {
    try {
      const sql = `
        SELECT id as claim_id, coding_status, coding_json, coding_started_at,
               coding_completed_at, coding_error, updated_at
        FROM claims
        WHERE coding_status IS NOT NULL
        ORDER BY updated_at DESC
      `;
      return this.db.prepare(sql).all() as CodingExtractionEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query medical coding extractions';
      logger.error(`CodingRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async getCoding(claimId: string): Promise<CodingExtractionEntity | null> {
    try {
      const sql = `
        SELECT id as claim_id, coding_status, coding_json, coding_started_at,
               coding_completed_at, coding_error, updated_at
        FROM claims
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(claimId) as CodingExtractionEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query medical coding by claim ID';
      logger.error(`CodingRepository.getCoding error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async updateCoding(
    claimId: string,
    data: Partial<Omit<CodingExtractionEntity, 'claim_id'>>
  ): Promise<CodingExtractionEntity | null> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (data.coding_status !== undefined) {
        updates.push('coding_status = ?');
        values.push(data.coding_status);
      }
      if (data.coding_json !== undefined) {
        updates.push('coding_json = ?');
        values.push(data.coding_json);
      }
      if (data.coding_started_at !== undefined) {
        updates.push('coding_started_at = ?');
        values.push(data.coding_started_at);
      }
      if (data.coding_completed_at !== undefined) {
        updates.push('coding_completed_at = ?');
        values.push(data.coding_completed_at);
      }
      if (data.coding_error !== undefined) {
        updates.push('coding_error = ?');
        values.push(data.coding_error);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(claimId);

      const sql = `UPDATE claims SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.getCoding(claimId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update medical coding record';
      logger.error(`CodingRepository.updateCoding error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: CodingExtractionEntity): Promise<CodingExtractionEntity> {
    const updated = await this.updateCoding(entity.claim_id, entity);
    if (!updated) {
      throw new DatabaseError(`Failed to initialize medical coding for claim ${entity.claim_id}`);
    }
    return updated;
  }

  public async update(id: string, entity: Partial<CodingExtractionEntity>): Promise<CodingExtractionEntity | null> {
    return this.updateCoding(id, entity);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `UPDATE claims SET coding_status = 'PENDING', coding_json = NULL, coding_error = NULL WHERE id = ?`;
    const res = this.db.prepare(sql).run(id);
    return res.changes > 0;
  }
}

export const codingRepository = new CodingRepository();
