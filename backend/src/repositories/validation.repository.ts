import { BaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface ValidationRecordEntity {
  claim_id: string;
  validation_status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'WARNINGS' | 'FAILED';
  validation_json?: string | null;
  validation_started_at?: string | null;
  validation_completed_at?: string | null;
  validation_error?: string | null;
  updated_at: string;
}

export interface IValidationRepository {
  updateValidation(
    claimId: string,
    data: Partial<Omit<ValidationRecordEntity, 'claim_id'>>
  ): Promise<ValidationRecordEntity | null>;
  getValidation(claimId: string): Promise<ValidationRecordEntity | null>;
}

export class ValidationRepository extends BaseRepository<ValidationRecordEntity, string> implements IValidationRepository {
  public async findById(id: string): Promise<ValidationRecordEntity | null> {
    return this.getValidation(id);
  }

  public async findAll(): Promise<ValidationRecordEntity[]> {
    try {
      const sql = `
        SELECT id as claim_id, validation_status, validation_json, validation_started_at,
               validation_completed_at, validation_error, updated_at
        FROM claims
        WHERE validation_status IS NOT NULL
        ORDER BY updated_at DESC
      `;
      return this.db.prepare(sql).all() as ValidationRecordEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query validation records';
      logger.error(`ValidationRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async getValidation(claimId: string): Promise<ValidationRecordEntity | null> {
    try {
      const sql = `
        SELECT id as claim_id, validation_status, validation_json, validation_started_at,
               validation_completed_at, validation_error, updated_at
        FROM claims
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(claimId) as ValidationRecordEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query validation by claim ID';
      logger.error(`ValidationRepository.getValidation error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async updateValidation(
    claimId: string,
    data: Partial<Omit<ValidationRecordEntity, 'claim_id'>>
  ): Promise<ValidationRecordEntity | null> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (data.validation_status !== undefined) {
        updates.push('validation_status = ?');
        values.push(data.validation_status);
      }
      if (data.validation_json !== undefined) {
        updates.push('validation_json = ?');
        values.push(data.validation_json);
      }
      if (data.validation_started_at !== undefined) {
        updates.push('validation_started_at = ?');
        values.push(data.validation_started_at);
      }
      if (data.validation_completed_at !== undefined) {
        updates.push('validation_completed_at = ?');
        values.push(data.validation_completed_at);
      }
      if (data.validation_error !== undefined) {
        updates.push('validation_error = ?');
        values.push(data.validation_error);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(claimId);

      const sql = `UPDATE claims SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.getValidation(claimId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update validation record';
      logger.error(`ValidationRepository.updateValidation error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: ValidationRecordEntity): Promise<ValidationRecordEntity> {
    const updated = await this.updateValidation(entity.claim_id, entity);
    if (!updated) {
      throw new DatabaseError(`Failed to initialize validation record for claim ${entity.claim_id}`);
    }
    return updated;
  }

  public async update(id: string, entity: Partial<ValidationRecordEntity>): Promise<ValidationRecordEntity | null> {
    return this.updateValidation(id, entity);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `UPDATE claims SET validation_status = 'PENDING', validation_json = NULL, validation_error = NULL WHERE id = ?`;
    const res = this.db.prepare(sql).run(id);
    return res.changes > 0;
  }
}

export const validationRepository = new ValidationRepository();
