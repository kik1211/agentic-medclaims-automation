import { ocrService, OcrService } from '../ocr/ocr.service.js';
import { logger } from '../utils/logger.js';

export class OcrWorkerQueue {
  private queue: string[] = [];
  private isProcessing = false;

  constructor(private readonly service: OcrService = ocrService) {}

  public enqueue(documentId: string): void {
    if (!this.queue.includes(documentId)) {
      this.queue.push(documentId);
      logger.info(`OcrWorkerQueue: Enqueued document ${documentId} (Queue size: ${this.queue.length})`);
    }

    setImmediate(() => {
      this.processNextJob();
    });
  }

  private async processNextJob(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const documentId = this.queue.shift()!;

    try {
      logger.info(`OcrWorkerQueue: Starting OCR job for document ${documentId}`);
      await this.service.processDocumentOcr(documentId);
      logger.info(`OcrWorkerQueue: Completed OCR job for document ${documentId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Worker job execution error';
      logger.error(`OcrWorkerQueue: Job failed for document ${documentId}: ${errorMsg}`);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => {
          this.processNextJob();
        });
      }
    }
  }
}

export const ocrWorker = new OcrWorkerQueue();
