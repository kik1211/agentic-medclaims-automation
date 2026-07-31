import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient } from './client.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../errors/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = (): void => {
  logger.info('Database migration started');
  const schemaPath = path.join(__dirname, 'schema.sql');

  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const db = dbClient.getConnection();
    db.exec(schemaSql);

    // Apply incremental ALTER TABLE statements safely for existing databases
    const columnsToEnsure = [
      "ALTER TABLE documents ADD COLUMN ocr_status TEXT DEFAULT 'PENDING'",
      'ALTER TABLE documents ADD COLUMN ocr_started_at TEXT',
      'ALTER TABLE documents ADD COLUMN ocr_completed_at TEXT',
      'ALTER TABLE documents ADD COLUMN ocr_error TEXT',
      "ALTER TABLE claims ADD COLUMN clinical_status TEXT DEFAULT 'PENDING'",
      'ALTER TABLE claims ADD COLUMN clinical_json TEXT',
      'ALTER TABLE claims ADD COLUMN clinical_started_at TEXT',
      'ALTER TABLE claims ADD COLUMN clinical_completed_at TEXT',
      'ALTER TABLE claims ADD COLUMN clinical_error TEXT',
      "ALTER TABLE claims ADD COLUMN coding_status TEXT DEFAULT 'PENDING'",
      'ALTER TABLE claims ADD COLUMN coding_json TEXT',
      'ALTER TABLE claims ADD COLUMN coding_started_at TEXT',
      'ALTER TABLE claims ADD COLUMN coding_completed_at TEXT',
      'ALTER TABLE claims ADD COLUMN coding_error TEXT',
      "ALTER TABLE claims ADD COLUMN validation_status TEXT DEFAULT 'PENDING'",
      'ALTER TABLE claims ADD COLUMN validation_json TEXT',
      'ALTER TABLE claims ADD COLUMN validation_started_at TEXT',
      'ALTER TABLE claims ADD COLUMN validation_completed_at TEXT',
      'ALTER TABLE claims ADD COLUMN validation_error TEXT',
      "ALTER TABLE claims ADD COLUMN submission_status TEXT DEFAULT 'PENDING'",
      'ALTER TABLE claims ADD COLUMN submission_reference TEXT',
      'ALTER TABLE claims ADD COLUMN submission_started_at TEXT',
      'ALTER TABLE claims ADD COLUMN submission_completed_at TEXT',
      'ALTER TABLE claims ADD COLUMN submission_error TEXT',
    ];

    for (const sql of columnsToEnsure) {
      try {
        db.exec(sql);
      } catch {
        // Ignore duplicate column error if column already exists
      }
    }

    logger.info('Database migration completed successfully');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Migration failed';
    logger.error(`Migration error: ${msg}`);
    throw new DatabaseError(`Migration failed: ${msg}`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runMigrations();
    dbClient.close();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
