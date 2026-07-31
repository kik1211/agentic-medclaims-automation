import { randomUUID } from 'crypto';
import { BaseRepository, IBaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface DocumentEntity {
  id: string;
  claim_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  ocr_text?: string | null;
  ocr_status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  ocr_started_at?: string | null;
  ocr_completed_at?: string | null;
  ocr_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IDocumentRepository extends IBaseRepository<DocumentEntity, string> {
  findByClaimId(claimId: string): Promise<DocumentEntity[]>;
}

export class DocumentRepository extends BaseRepository<DocumentEntity, string> implements IDocumentRepository {
  public async findById(id: string): Promise<DocumentEntity | null> {
    try {
      const sql = `
        SELECT id, claim_id, file_name, file_path, file_size, mime_type,
               document_type, ocr_text, ocr_status, ocr_started_at, ocr_completed_at, ocr_error,
               created_at, updated_at
        FROM documents
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(id) as DocumentEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query document by ID';
      logger.error(`DocumentRepository.findById error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByClaimId(claimId: string): Promise<DocumentEntity[]> {
    try {
      const sql = `
        SELECT id, claim_id, file_name, file_path, file_size, mime_type,
               document_type, ocr_text, ocr_status, ocr_started_at, ocr_completed_at, ocr_error,
               created_at, updated_at
        FROM documents
        WHERE claim_id = ?
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all(claimId) as DocumentEntity[];
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query documents by claim ID';
      logger.error(`DocumentRepository.findByClaimId error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findAll(): Promise<DocumentEntity[]> {
    try {
      const sql = `
        SELECT id, claim_id, file_name, file_path, file_size, mime_type,
               document_type, ocr_text, ocr_status, ocr_started_at, ocr_completed_at, ocr_error,
               created_at, updated_at
        FROM documents
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all() as DocumentEntity[];
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query all documents';
      logger.error(`DocumentRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: Omit<DocumentEntity, 'id'> & { id?: string }): Promise<DocumentEntity> {
    try {
      const id = entity.id || `doc_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const timestamp = entity.created_at || new Date().toISOString();

      const sql = `
        INSERT INTO documents (
          id, claim_id, file_name, file_path, file_size, mime_type,
          document_type, ocr_text, ocr_status, ocr_started_at, ocr_completed_at, ocr_error,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.prepare(sql).run(
        id,
        entity.claim_id,
        entity.file_name,
        entity.file_path,
        entity.file_size,
        entity.mime_type,
        entity.document_type,
        entity.ocr_text ?? null,
        entity.ocr_status ?? 'PENDING',
        entity.ocr_started_at ?? null,
        entity.ocr_completed_at ?? null,
        entity.ocr_error ?? null,
        timestamp,
        entity.updated_at || timestamp
      );

      logger.info(`Document metadata created in database: ${id}`);
      const createdRow = await this.findById(id);
      if (!createdRow) {
        throw new DatabaseError('Failed to fetch newly created document record');
      }
      return createdRow;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create document record';
      logger.error(`DocumentRepository.create error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async update(id: string, entity: Partial<DocumentEntity>): Promise<DocumentEntity | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (entity.document_type !== undefined) {
        updates.push('document_type = ?');
        values.push(entity.document_type);
      }
      if (entity.ocr_text !== undefined) {
        updates.push('ocr_text = ?');
        values.push(entity.ocr_text);
      }
      if (entity.ocr_status !== undefined) {
        updates.push('ocr_status = ?');
        values.push(entity.ocr_status);
      }
      if (entity.ocr_started_at !== undefined) {
        updates.push('ocr_started_at = ?');
        values.push(entity.ocr_started_at);
      }
      if (entity.ocr_completed_at !== undefined) {
        updates.push('ocr_completed_at = ?');
        values.push(entity.ocr_completed_at);
      }
      if (entity.ocr_error !== undefined) {
        updates.push('ocr_error = ?');
        values.push(entity.ocr_error);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(id);

      const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.findById(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update document record';
      logger.error(`DocumentRepository.update error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM documents WHERE id = ?`;
      const result = this.db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document record';
      logger.error(`DocumentRepository.delete error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }
}

export const documentRepository = new DocumentRepository();
