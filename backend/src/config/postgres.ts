import { dbClient } from '../database/client.js';
import { logger } from '../utils/logger.js';

export interface PostgresOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

export const postgresConfig: PostgresOptions = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'claimpilot',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || undefined,
  ssl: process.env.PG_SSL === 'true',
};

export class DatabaseAbstractionLayer {
  private readonly isPostgres = process.env.DB_DRIVER === 'postgres';

  public getDriverName(): string {
    return this.isPostgres ? 'PostgreSQL' : 'SQLite3';
  }

  public async checkHealth(): Promise<{ status: 'UP' | 'DOWN'; driver: string; details: string }> {
    try {
      const conn = dbClient.getConnection();
      conn.prepare('SELECT 1').get();
      return {
        status: 'UP',
        driver: this.getDriverName(),
        details: `Connected successfully to ${this.getDriverName()}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database check failed';
      logger.error(`DatabaseAbstractionLayer Health Error: ${msg}`);
      return {
        status: 'DOWN',
        driver: this.getDriverName(),
        details: msg,
      };
    }
  }
}

export const dbAbstraction = new DatabaseAbstractionLayer();
