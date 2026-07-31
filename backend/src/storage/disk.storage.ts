import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { IStorageService, FileUploadInput, StoredFile } from './storage.service.js';
import { BadRequestError } from '../errors/AppError.js';

export class DiskStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir = env.UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sanitizeClaimId(claimId: string): string {
    const sanitized = path.basename(claimId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitized) {
      throw new BadRequestError('Invalid claim ID format for document storage');
    }
    return sanitized;
  }

  public async save(claimId: string, file: FileUploadInput): Promise<StoredFile> {
    const cleanClaimId = this.sanitizeClaimId(claimId);
    const targetDir = path.join(this.baseDir, cleanClaimId);

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const fileExt = path.extname(file.originalName).toLowerCase() || '.bin';
    const uniqueFileName = `${randomUUID()}${fileExt}`;
    const fullPath = path.join(targetDir, uniqueFileName);

    // Verify resolving path stays within baseDir to prevent traversal
    const relative = path.relative(this.baseDir, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new BadRequestError('Potential path traversal attempt detected');
    }

    await fs.promises.writeFile(fullPath, file.buffer);
    logger.info(`Saved uploaded document to disk: ${fullPath}`);

    const relativePath = path.join(cleanClaimId, uniqueFileName).replace(/\\/g, '/');

    return {
      filePath: relativePath,
      fileName: uniqueFileName,
      fileSize: file.buffer.length,
    };
  }

  public async delete(filePath: string): Promise<boolean> {
    const fullPath = this.getPath(filePath);
    if (await this.exists(filePath)) {
      await fs.promises.unlink(fullPath);
      logger.info(`Deleted document file from disk: ${fullPath}`);
      return true;
    }
    return false;
  }

  public async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getPath(filePath);
    return fs.existsSync(fullPath);
  }

  public getPath(filePath: string): string {
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(this.baseDir, safePath);

    const relative = path.relative(this.baseDir, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new BadRequestError('Invalid file path resolution');
    }

    return fullPath;
  }
}

export const diskStorageService = new DiskStorageService();
