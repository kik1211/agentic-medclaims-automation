import { ocrService } from '../ocr/ocr.service.js';
import { clinicalService } from '../services/clinical.service.js';
import { codingService } from '../coding/coding.service.js';
import { validationService } from '../services/validation.service.js';
import { submissionService } from '../submission/submission.service.js';
import { QueueName, QUEUE_NAMES, OcrJobData, ClinicalJobData, CodingJobData, ValidationJobData, SubmissionJobData } from './job.types.js';
import { logger } from '../utils/logger.js';

export class BackgroundWorker {
  public async processJob(queueName: QueueName, data: unknown): Promise<unknown> {
    logger.info(`BackgroundWorker: Processing job from queue '${queueName}'`);

    switch (queueName) {
      case QUEUE_NAMES.OCR: {
        const { documentId } = data as OcrJobData;
        return ocrService.processDocumentOcr(documentId);
      }
      case QUEUE_NAMES.CLINICAL: {
        const { claimId } = data as ClinicalJobData;
        return clinicalService.structureClaimClinicalData(claimId);
      }
      case QUEUE_NAMES.CODING: {
        const { claimId } = data as CodingJobData;
        return codingService.processClaimCoding(claimId);
      }
      case QUEUE_NAMES.VALIDATION: {
        const { claimId } = data as ValidationJobData;
        return validationService.validateClaim(claimId);
      }
      case QUEUE_NAMES.SUBMISSION: {
        const { claimId } = data as SubmissionJobData;
        return submissionService.submitClaim(claimId);
      }
      default:
        throw new Error(`BackgroundWorker: Unknown queue name '${queueName}'`);
    }
  }
}

export const backgroundWorker = new BackgroundWorker();
