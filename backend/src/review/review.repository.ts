import { randomUUID } from 'crypto';
import { BaseRepository } from '../repositories/base.repository.js';
import { ClaimEntity } from '../repositories/claim.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface ReviewHistoryEntity {
  id: string;
  claim_id: string;
  reviewer_id: string;
  decision: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  comments?: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface IReviewRepository {
  createReviewRecord(
    entity: Omit<ReviewHistoryEntity, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): Promise<ReviewHistoryEntity>;
  findByClaimId(claimId: string): Promise<ReviewHistoryEntity[]>;
  findPendingReviewClaims(hospitalId?: string): Promise<ClaimEntity[]>;
}

export class ReviewRepository extends BaseRepository<ReviewHistoryEntity, string> implements IReviewRepository {
  public async findById(id: string): Promise<ReviewHistoryEntity | null> {
    try {
      const sql = `SELECT * FROM review_history WHERE id = ?`;
      const row = this.db.prepare(sql).get(id) as ReviewHistoryEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query review record by ID';
      logger.error(`ReviewRepository.findById error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findAll(): Promise<ReviewHistoryEntity[]> {
    try {
      const sql = `SELECT * FROM review_history ORDER BY created_at DESC`;
      return this.db.prepare(sql).all() as ReviewHistoryEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query review history';
      logger.error(`ReviewRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async createReviewRecord(
    entity: Omit<ReviewHistoryEntity, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): Promise<ReviewHistoryEntity> {
    try {
      const id = entity.id || `rev_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const timestamp = entity.created_at || new Date().toISOString();

      const sql = `
        INSERT INTO review_history (
          id, claim_id, reviewer_id, decision, comments, previous_status, new_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.prepare(sql).run(
        id,
        entity.claim_id,
        entity.reviewer_id,
        entity.decision,
        entity.comments ?? null,
        entity.previous_status,
        entity.new_status,
        timestamp
      );

      logger.info(`Review record created in database: ${id} for claim ${entity.claim_id}`);
      const createdRow = await this.findById(id);
      if (!createdRow) {
        throw new DatabaseError('Failed to fetch newly created review record');
      }
      return createdRow;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create review record';
      logger.error(`ReviewRepository.createReviewRecord error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByClaimId(claimId: string): Promise<ReviewHistoryEntity[]> {
    try {
      const sql = `
        SELECT * FROM review_history
        WHERE claim_id = ?
        ORDER BY created_at DESC
      `;
      return this.db.prepare(sql).all(claimId) as ReviewHistoryEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query review history by claim ID';
      logger.error(`ReviewRepository.findByClaimId error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findPendingReviewClaims(hospitalId?: string): Promise<ClaimEntity[]> {
    try {
      let sql = `
        SELECT id, hospital_id, claim_type, status, insurer_code, priority,
               pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
               clinical_status, clinical_json, clinical_started_at, clinical_completed_at, clinical_error,
               coding_status, coding_json, coding_started_at, coding_completed_at, coding_error,
               validation_status, validation_json, validation_started_at, validation_completed_at, validation_error,
               completed_at, created_at, updated_at
        FROM claims
        WHERE status IN ('READY_FOR_REVIEW', 'VALIDATED')
      `;
      const params: unknown[] = [];

      if (hospitalId) {
        sql += ` AND hospital_id = ?`;
        params.push(hospitalId);
      }

      sql += ` ORDER BY created_at DESC`;
      return this.db.prepare(sql).all(...params) as ClaimEntity[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query pending review claims';
      logger.error(`ReviewRepository.findPendingReviewClaims error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: ReviewHistoryEntity): Promise<ReviewHistoryEntity> {
    return this.createReviewRecord(entity);
  }

  public async update(id: string, _entity: Partial<ReviewHistoryEntity>): Promise<ReviewHistoryEntity | null> {
    return this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM review_history WHERE id = ?`;
    const res = this.db.prepare(sql).run(id);
    return res.changes > 0;
  }
}

export const reviewRepository = new ReviewRepository();
