import { BaseRepository, IBaseRepository } from './base.repository.js';
import { DatabaseError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface UserEntity {
  id: string;
  hospital_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'ADMIN' | 'HOSPITAL_USER' | 'REVIEWER';
  created_at: string;
  updated_at: string;
}

export interface IUserRepository extends IBaseRepository<UserEntity, string> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByHospitalId(hospitalId: string): Promise<UserEntity[]>;
}

export class UserRepository extends BaseRepository<UserEntity, string> implements IUserRepository {
  private ensureHospitalExists(hospitalId: string): void {
    const timestamp = new Date().toISOString();
    const sql = `
      INSERT OR IGNORE INTO hospitals (id, name, code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    this.db.prepare(sql).run(hospitalId, `Hospital ${hospitalId}`, hospitalId.toLowerCase(), timestamp, timestamp);
  }

  public async findById(id: string): Promise<UserEntity | null> {
    try {
      const sql = `
        SELECT id, hospital_id, email, password_hash, full_name, role, created_at, updated_at
        FROM users
        WHERE id = ?
      `;
      const row = this.db.prepare(sql).get(id) as UserEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query user by ID';
      logger.error(`UserRepository.findById error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const sql = `
        SELECT id, hospital_id, email, password_hash, full_name, role, created_at, updated_at
        FROM users
        WHERE LOWER(email) = LOWER(?)
      `;
      const row = this.db.prepare(sql).get(email) as UserEntity | undefined;
      return row || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query user by email';
      logger.error(`UserRepository.findByEmail error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findByHospitalId(hospitalId: string): Promise<UserEntity[]> {
    try {
      const sql = `
        SELECT id, hospital_id, email, password_hash, full_name, role, created_at, updated_at
        FROM users
        WHERE hospital_id = ?
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all(hospitalId) as UserEntity[];
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query users by hospital ID';
      logger.error(`UserRepository.findByHospitalId error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async findAll(): Promise<UserEntity[]> {
    try {
      const sql = `
        SELECT id, hospital_id, email, password_hash, full_name, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `;
      const rows = this.db.prepare(sql).all() as UserEntity[];
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to query all users';
      logger.error(`UserRepository.findAll error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async create(entity: Omit<UserEntity, 'id'> & { id?: string }): Promise<UserEntity> {
    try {
      return this.client.transaction(() => {
        const id = entity.id || `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        const timestamp = entity.created_at || new Date().toISOString();

        this.ensureHospitalExists(entity.hospital_id);

        const sql = `
          INSERT INTO users (
            id, hospital_id, email, password_hash, full_name, role, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.prepare(sql).run(
          id,
          entity.hospital_id,
          entity.email.toLowerCase(),
          entity.password_hash,
          entity.full_name,
          entity.role,
          timestamp,
          entity.updated_at || timestamp
        );

        logger.info(`User record created in database: ${id} (${entity.email})`);
        const createdRow = this.db
          .prepare('SELECT id, hospital_id, email, password_hash, full_name, role, created_at, updated_at FROM users WHERE id = ?')
          .get(id) as UserEntity;
        return createdRow;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user record';
      logger.error(`UserRepository.create error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async update(id: string, entity: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      const timestamp = new Date().toISOString();

      if (entity.full_name !== undefined) {
        updates.push('full_name = ?');
        values.push(entity.full_name);
      }
      if (entity.role !== undefined) {
        updates.push('role = ?');
        values.push(entity.role);
      }
      if (entity.password_hash !== undefined) {
        updates.push('password_hash = ?');
        values.push(entity.password_hash);
      }

      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(id);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return this.findById(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user record';
      logger.error(`UserRepository.update error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM users WHERE id = ?`;
      const result = this.db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user record';
      logger.error(`UserRepository.delete error: ${msg}`);
      throw new DatabaseError(`Database operation failed: ${msg}`);
    }
  }
}

export const userRepository = new UserRepository();
