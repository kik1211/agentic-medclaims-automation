import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../errors/AppError.js';

export class DatabaseClient {
  private static instance: DatabaseClient | null = null;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  public connect(dbPath?: string): Database {
    if (this.db) {
      return this.db;
    }

    const targetPath = dbPath || env.DATABASE_PATH;

    try {
      this.db = new Database(targetPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      logger.info(`Database initialized successfully at path: ${targetPath}`);
      return this.db;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to SQLite';
      logger.error(`Database connection failed: ${msg}`);
      throw new DatabaseError(`Database connection failed: ${msg}`);
    }
  }

  public getConnection(): Database {
    if (!this.db) {
      return this.connect();
    }
    return this.db;
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        logger.info('Database connection closed successfully');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error closing database';
        logger.error(`Failed to close database: ${msg}`);
        throw new DatabaseError(`Failed to close database: ${msg}`);
      }
    }
  }

  public transaction<T>(fn: (db: Database) => T): T {
    const db = this.getConnection();
    const executeTx = db.transaction(() => fn(db));
    try {
      return executeTx();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction execution failed';
      logger.error(`Transaction failed: ${msg}`);
      throw new DatabaseError(`Transaction failed: ${msg}`);
    }
  }
}

export const dbClient = DatabaseClient.getInstance();
