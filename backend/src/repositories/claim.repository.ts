import { randomUUID } from 'crypto';
import { BaseRepository, IBaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface ClaimEntity {
  id: string;
  hospital_id: string;
  claim_type: 'PRE_AUTH' | 'DISCHARGE' | 'FINAL_CLAIM';
  status: string;
  created_at: string;
  updated_at: string;
  insurer_code?: string;
  priority?: 'URGENT' | 'NORMAL' | 'LOW';
  completed_at?: string | null;
  current_attempt?: number;
  assigned_reviewer_id?: string | null;
  pre_auth_reference?: string | null;
  notes?: string | null;
  clinical_status?: string | null;
  clinical_json?: string | null;
  clinical_started_at?: string | null;
  clinical_completed_at?: string | null;
  clinical_error?: string | null;
  coding_status?: string | null;
  coding_json?: string | null;
  coding_started_at?: string | null;
  coding_completed_at?: string | null;
  coding_error?: string | null;
  validation_status?: string | null;
  validation_json?: string | null;
  validation_started_at?: string | null;
  validation_completed_at?: string | null;
  validation_error?: string | null;
  submission_status?: string | null;
  submission_reference?: string | null;
  submission_started_at?: string | null;
  submission_completed_at?: string | null;
  submission_error?: string | null;
}

export interface IClaimRepository extends IBaseRepository<ClaimEntity, string> {
  findByHospitalId(hospitalId: string): Promise<ClaimEntity[]>;
  findByStatus(status: string): Promise<ClaimEntity[]>;
}

interface RawClaimRow {
  id: string;
  hospital_id: string;
  claim_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  insurer_code: string | null;
  priority: string | null;
  completed_at: string | null;
  current_attempt: number | null;
  assigned_reviewer_id: string | null;
  pre_auth_reference: string | null;
  notes: string | null;
  clinical_status: string | null;
  clinical_json: string | null;
  clinical_started_at: string | null;
  clinical_completed_at: string | null;
  clinical_error: string | null;
  coding_status: string | null;
  coding_json: string | null;
  coding_started_at: string | null;
  coding_completed_at: string | null;
  coding_error: string | null;
  validation_status: string | null;
  validation_json: string | null;
  validation_started_at: string | null;
  validation_completed_at: string | null;
  validation_error: string | null;
  submission_status: string | null;
  submission_reference: string | null;
  submission_started_at: string | null;
  submission_completed_at: string | null;
  submission_error: string | null;
}



export class ClaimRepository extends BaseRepository<ClaimEntity, string> implements IClaimRepository {
  private mapRowToEntity(row: RawClaimRow): ClaimEntity {
    return {
      id: row.id,
      hospital_id: row.hospital_id,
      claim_type: row.claim_type as ClaimEntity['claim_type'],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      insurer_code: row.insurer_code ?? undefined,
      priority: (row.priority as ClaimEntity['priority']) ?? 'NORMAL',
      completed_at: row.completed_at,
      current_attempt: row.current_attempt ?? undefined,
      assigned_reviewer_id: row.assigned_reviewer_id,
      pre_auth_reference: row.pre_auth_reference ?? undefined,
      notes: row.notes ?? undefined,
      clinical_status: row.clinical_status ?? undefined,
      clinical_json: row.clinical_json ?? undefined,
      clinical_started_at: row.clinical_started_at ?? undefined,
      clinical_completed_at: row.clinical_completed_at ?? undefined,
      clinical_error: row.clinical_error ?? undefined,
      coding_status: row.coding_status ?? undefined,
      coding_json: row.coding_json ?? undefined,
      coding_started_at: row.coding_started_at ?? undefined,
      coding_completed_at: row.coding_completed_at ?? undefined,
      coding_error: row.coding_error ?? undefined,
      validation_status: row.validation_status ?? undefined,
      validation_json: row.validation_json ?? undefined,
      validation_started_at: row.validation_started_at ?? undefined,
      validation_completed_at: row.validation_completed_at ?? undefined,
      validation_error: row.validation_error ?? undefined,
      submission_status: row.submission_status ?? undefined,
      submission_reference: row.submission_reference ?? undefined,
      submission_started_at: row.submission_started_at ?? undefined,
      submission_completed_at: row.submission_completed_at ?? undefined,
      submission_error: row.submission_error ?? undefined,
    };
  }


  private ensureHospitalExists(hospitalId: string): void {
    const timestamp = new Date().toISOString();
    const sql = `
      INSERT OR IGNORE INTO hospitals (id, name, code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    this.db.prepare(sql).run(hospitalId, `Hospital ${hospitalId}`, hospitalId.toLowerCase(), timestamp, timestamp);
  }

  public async findAll(): Promise<ClaimEntity[]> {
    try {
      const sql = `
        SELECT id, hospital_id, claim_type, status, insurer_code, priority,
               pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
               clinical_status, clinical_json, clinical_started_at, clinical_completed_at, clinical_error,
               coding_status, coding_json, coding_started_at, coding_completed_at, coding_error,
               validation_status, validation_json, validation_started_at, validation_completed_at, validation_error,
               submission_status, submission_reference, submission_started_at, submission_completed_at, submission_error,
               completed_at, created_at, updated_at
        FROM claims
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all() as RawClaimRow[];
      return rows.map((row) => this.mapRowToEntity(row));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query claims';
      logger.error(`ClaimRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findById(id: string): Promise<ClaimEntity | null> {
    try {
      const sql = `
        SELECT id, hospital_id, claim_type, status, insurer_code, priority,
               pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
               clinical_status, clinical_json, clinical_started_at, clinical_completed_at, clinical_error,
               coding_status, coding_json, coding_started_at, coding_completed_at, coding_error,
               validation_status, validation_json, validation_started_at, validation_completed_at, validation_error,
               submission_status, submission_reference, submission_started_at, submission_completed_at, submission_error,
               completed_at, created_at, updated_at
        FROM claims
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(id) as RawClaimRow | undefined;
      return row ? this.mapRowToEntity(row) : null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query claim by ID';
      logger.error(`ClaimRepository.findById error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: Omit<ClaimEntity, 'id'> & { id?: string }): Promise<ClaimEntity> {
    try {
      return this.client.transaction(() => {
        const id = entity.id || `clm_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
        const timestamp = entity.created_at || new Date().toISOString();

        this.ensureHospitalExists(entity.hospital_id);

        const sql = `
          INSERT INTO claims (
            id, hospital_id, claim_type, status, insurer_code, priority,
            pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
            completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.prepare(sql).run(
          id,
          entity.hospital_id,
          entity.claim_type,
          entity.status,
          entity.insurer_code ?? null,
          entity.priority ?? 'NORMAL',
          entity.pre_auth_reference ?? null,
          entity.notes ?? null,
          entity.assigned_reviewer_id ?? null,
          entity.current_attempt ?? 1,
          entity.completed_at ?? null,
          timestamp,
          entity.updated_at || timestamp
        );

        logger.info(`Claim record inserted into database: ${id}`);
        const createdRow = this.db
          .prepare('SELECT * FROM claims WHERE id = ?')
          .get(id) as RawClaimRow;
        return this.mapRowToEntity(createdRow);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create claim record';
      logger.error(`ClaimRepository.create error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async update(id: string, entity: Partial<ClaimEntity>): Promise<ClaimEntity | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (entity.status !== undefined) {
        updates.push('status = ?');
        values.push(entity.status);
      }
      if (entity.insurer_code !== undefined) {
        updates.push('insurer_code = ?');
        values.push(entity.insurer_code);
      }
      if (entity.priority !== undefined) {
        updates.push('priority = ?');
        values.push(entity.priority);
      }
      if (entity.assigned_reviewer_id !== undefined) {
        updates.push('assigned_reviewer_id = ?');
        values.push(entity.assigned_reviewer_id);
      }
      if (entity.notes !== undefined) {
        updates.push('notes = ?');
        values.push(entity.notes);
      }
      if (entity.completed_at !== undefined) {
        updates.push('completed_at = ?');
        values.push(entity.completed_at);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);

      values.push(id);

      const sql = `UPDATE claims SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      logger.info(`Claim record updated in database: ${id}`);
      return this.findById(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update claim record';
      logger.error(`ClaimRepository.update error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM claims WHERE id = ?`;
      const result = this.db.prepare(sql).run(id);
      const success = result.changes > 0;
      if (success) {
        logger.info(`Claim record deleted from database: ${id}`);
      }
      return success;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete claim record';
      logger.error(`ClaimRepository.delete error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByHospitalId(hospitalId: string): Promise<ClaimEntity[]> {
    try {
      const sql = `
        SELECT id, hospital_id, claim_type, status, insurer_code, priority,
               pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
               clinical_status, clinical_json, clinical_started_at, clinical_completed_at, clinical_error,
               coding_status, coding_json, coding_started_at, coding_completed_at, coding_error,
               validation_status, validation_json, validation_started_at, validation_completed_at, validation_error,
               submission_status, submission_reference, submission_started_at, submission_completed_at, submission_error,
               completed_at, created_at, updated_at
        FROM claims
        WHERE hospital_id = ?
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all(hospitalId) as RawClaimRow[];
      return rows.map((row) => this.mapRowToEntity(row));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query claims by hospital ID';
      logger.error(`ClaimRepository.findByHospitalId error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByStatus(status: string): Promise<ClaimEntity[]> {
    try {
      const sql = `
        SELECT id, hospital_id, claim_type, status, insurer_code, priority,
               pre_auth_reference, notes, assigned_reviewer_id, current_attempt,
               clinical_status, clinical_json, clinical_started_at, clinical_completed_at, clinical_error,
               coding_status, coding_json, coding_started_at, coding_completed_at, coding_error,
               validation_status, validation_json, validation_started_at, validation_completed_at, validation_error,
               submission_status, submission_reference, submission_started_at, submission_completed_at, submission_error,
               completed_at, created_at, updated_at
        FROM claims
        WHERE status = ?
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all(status) as RawClaimRow[];
      return rows.map((row) => this.mapRowToEntity(row));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query claims by status';
      logger.error(`ClaimRepository.findByStatus error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }
}

export const claimRepository = new ClaimRepository();
