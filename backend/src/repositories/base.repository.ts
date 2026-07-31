import Database from 'better-sqlite3';
import { DatabaseClient, dbClient } from '../database/client.js';

export interface IBaseRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export abstract class BaseRepository<T, ID> implements IBaseRepository<T, ID> {
  constructor(protected readonly client: DatabaseClient = dbClient) {}

  protected get db(): Database {
    return this.client.getConnection();
  }

  abstract findById(id: ID): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(entity: Omit<T, 'id'>): Promise<T>;
  abstract update(id: ID, entity: Partial<T>): Promise<T | null>;
  abstract delete(id: ID): Promise<boolean>;
}
