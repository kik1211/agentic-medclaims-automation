export const QUEUE_NAMES = {
  OCR: 'ocr-processing-queue',
  CLINICAL: 'clinical-extraction-queue',
  CODING: 'coding-queue',
  VALIDATION: 'validation-queue',
  SUBMISSION: 'submission-queue',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export interface OcrJobData {
  documentId: string;
  claimId: string;
}

export interface ClinicalJobData {
  claimId: string;
}

export interface CodingJobData {
  claimId: string;
}

export interface ValidationJobData {
  claimId: string;
}

export interface SubmissionJobData {
  claimId: string;
}

export type JobPayloadMap = {
  [QUEUE_NAMES.OCR]: OcrJobData;
  [QUEUE_NAMES.CLINICAL]: ClinicalJobData;
  [QUEUE_NAMES.CODING]: CodingJobData;
  [QUEUE_NAMES.VALIDATION]: ValidationJobData;
  [QUEUE_NAMES.SUBMISSION]: SubmissionJobData;
};
