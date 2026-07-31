import { BaseRepository } from '../repositories/base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface SubmissionRecordEntity {
  claim_id: string;
  submission_status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'FAILED';
  submission_reference?: string | null;
  submission_started_at?: string | null;
  submission_completed_at?: string | null;
  submission_error?: string | null;
  updated_at: string;
}

export interface ISubmissionRepository {
  updateSubmission(
    claimId: string,
    data: Partial<Omit<SubmissionRecordEntity, 'claim_id'>>
  ): Promise<SubmissionRecordEntity | null>;
  getSubmission(claimId: string): Promise<SubmissionRecordEntity | null>;
}

export class SubmissionRepository extends BaseRepository<SubmissionRecordEntity, string> implements ISubmissionRepository {
  public async findById(id: string): Promise<SubmissionRecordEntity | null> {
    return this.getSubmission(id);
  }

  public async findAll(): Promise<SubmissionRecordEntity[]> {
    try {
      const sql = `
        SELECT id as claim_id, submission_status, submission_reference, submission_started_at,
               submission_completed_at, submission_error, updated_at
        FROM claims
        WHERE submission_status IS NOT NULL
        ORDER BY updated_at DESC
      `;
      return this.db.prepare(sql).all() as SubmissionRecordEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query submission records';
      logger.error(`SubmissionRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async getSubmission(claimId: string): Promise<SubmissionRecordEntity | null> {
    try {
      const sql = `
        SELECT id as claim_id, submission_status, submission_reference, submission_started_at,
               submission_completed_at, submission_error, updated_at
        FROM claims
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(claimId) as SubmissionRecordEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query submission by claim ID';
      logger.error(`SubmissionRepository.getSubmission error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async updateSubmission(
    claimId: string,
    data: Partial<Omit<SubmissionRecordEntity, 'claim_id'>>
  ): Promise<SubmissionRecordEntity | null> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (data.submission_status !== undefined) {
        updates.push('submission_status = ?');
        values.push(data.submission_status);
      }
      if (data.submission_reference !== undefined) {
        updates.push('submission_reference = ?');
        values.push(data.submission_reference);
      }
      if (data.submission_started_at !== undefined) {
        updates.push('submission_started_at = ?');
        values.push(data.submission_started_at);
      }
      if (data.submission_completed_at !== undefined) {
        updates.push('submission_completed_at = ?');
        values.push(data.submission_completed_at);
      }
      if (data.submission_error !== undefined) {
        updates.push('submission_error = ?');
        values.push(data.submission_error);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(claimId);

      const sql = `UPDATE claims SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.getSubmission(claimId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update submission record';
      logger.error(`SubmissionRepository.updateSubmission error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: SubmissionRecordEntity): Promise<SubmissionRecordEntity> {
    const updated = await this.updateSubmission(entity.claim_id, entity);
    if (!updated) {
      throw new DatabaseError(`Failed to initialize submission record for claim ${entity.claim_id}`);
    }
    return updated;
  }

  public async update(id: string, entity: Partial<SubmissionRecordEntity>): Promise<SubmissionRecordEntity | null> {
    return this.updateSubmission(id, entity);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `UPDATE claims SET submission_status = 'PENDING', submission_reference = NULL, submission_error = NULL WHERE id = ?`;
    const res = this.db.prepare(sql).run(id);
    return res.changes > 0;
  }
}

export const submissionRepository = new SubmissionRepository();
