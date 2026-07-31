import { randomUUID } from 'crypto';
import { dbClient } from '../database/client.js';
import { logger } from '../utils/logger.js';

export interface AuditLogEntry {
  claimId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

export class ReviewAuditService {
  public async logAction(entry: AuditLogEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const id = `audit_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const detailsJson = JSON.stringify(entry.details);

    try {
      const db = dbClient.getConnection();
      const sql = `
        INSERT INTO audit_logs (id, claim_id, user_id, action, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.prepare(sql).run(
        id,
        entry.claimId,
        entry.userId,
        entry.action,
        detailsJson,
        entry.ipAddress ?? '127.0.0.1',
        timestamp
      );

      logger.info(`AuditLog [${entry.action}]: User ${entry.userId} on Claim ${entry.claimId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Audit log failure';
      logger.error(`ReviewAuditService failed to write audit log: ${msg}`);
    }
  }
}

export const reviewAuditService = new ReviewAuditService();
