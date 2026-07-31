import { Request, Response, NextFunction } from 'express';
import { documentRepository } from '../repositories/document.repository.js';
import { ocrService } from '../ocr/ocr.service.js';
import { clinicalService } from '../services/clinical.service.js';
import { codingService } from '../coding/coding.service.js';
import { validationService } from '../services/validation.service.js';
import { submissionService } from '../submission/submission.service.js';
import { claimRepository } from '../repositories/claim.repository.js';
import { ok } from '../responses/index.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface ClaimEventPayload {
  event: 'DOCUMENT_UPLOADED' | 'START_WORKFLOW' | 'CONTINUE_WORKFLOW';
  claimId: string;
  documentId?: string;
}

export interface WorkflowRetryPayload {
  claimId: string;
  stage: 'OCR' | 'CLINICAL' | 'CODING' | 'VALIDATION' | 'SUBMISSION';
}

export class WebhookController {
  public processClaimEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { event, claimId, documentId } = req.body as ClaimEventPayload;

      if (!claimId) {
        throw new BadRequestError('Claim ID is required in webhook event payload');
      }

      logger.info(`WebhookController: Received event '${event}' for claim ${claimId}`);

      const claim = await claimRepository.findById(claimId);
      if (!claim) {
        throw new NotFoundError(`Claim with ID '${claimId}' not found`);
      }

      const executionLogs: string[] = [];
      const addLog = (msg: string): void => {
        executionLogs.push(`[${new Date().toISOString()}] ${msg}`);
        logger.info(`WebhookWorkflow [Claim ${claimId}]: ${msg}`);
      };

      addLog(`Workflow event '${event}' initiated`);

      // Stage 1: OCR Extraction if documentId is provided
      if (documentId) {
        const doc = await documentRepository.findById(documentId);
        if (doc && doc.ocr_status !== 'COMPLETED') {
          addLog(`Executing OCR on document ${documentId}`);
          await ocrService.processDocumentOcr(documentId);
        }
      }

      // Stage 2: Clinical Data Structuring
      addLog('Executing Clinical LLM Structuring');
      const clinicalResult = await clinicalService.structureClaimClinicalData(claimId);

      // Stage 3: ICD-10 & CPT Auto-Coding
      addLog('Executing ICD-10 and CPT Auto-Coding');
      const codingResult = await codingService.processClaimCoding(claimId);

      // Stage 4: Claim Validation Engine
      addLog('Executing Claim Validation Engine');
      const validationResult = await validationService.validateClaim(claimId);

      let submissionResult = null;
      if (!validationResult.data?.approval_required && validationResult.validationStatus === 'PASSED') {
        // Stage 5: Auto submission if no human approval required
        addLog('No human approval required. Executing Playwright Portal Submission');
        await claimRepository.update(claimId, { status: 'APPROVED_BY_REVIEWER' });
        submissionResult = await submissionService.submitClaim(claimId);
      } else {
        addLog('Human review required. Routing claim to READY_FOR_REVIEW queue');
      }

      addLog('Workflow orchestration sequence completed successfully');

      ok(res, {
        claimId,
        event,
        workflowStatus: 'COMPLETED',
        stages: {
          clinicalStatus: clinicalResult.clinicalStatus,
          codingStatus: codingResult.codingStatus,
          validationStatus: validationResult.validationStatus,
          approvalRequired: validationResult.data?.approval_required ?? true,
          submissionStatus: submissionResult?.submissionStatus ?? 'PENDING_REVIEW',
        },
        executionLogs,
      });
    } catch (err) {
      next(err);
    }
  };

  public processWorkflowRetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { claimId, stage } = req.body as WorkflowRetryPayload;

      if (!claimId || !stage) {
        throw new BadRequestError('Claim ID and stage are required for workflow retry');
      }

      logger.info(`WebhookController: Retrying stage '${stage}' for claim ${claimId}`);

      let stageResult: unknown = null;

      switch (stage) {
        case 'OCR': {
          const docs = await documentRepository.findByClaimId(claimId);
          if (docs.length === 0) {
            throw new NotFoundError(`No documents found for claim ${claimId}`);
          }
          stageResult = await ocrService.processDocumentOcr(docs[0].id);
          break;
        }
        case 'CLINICAL':
          stageResult = await clinicalService.structureClaimClinicalData(claimId);
          break;
        case 'CODING':
          stageResult = await codingService.processClaimCoding(claimId);
          break;
        case 'VALIDATION':
          stageResult = await validationService.validateClaim(claimId);
          break;
        case 'SUBMISSION':
          stageResult = await submissionService.submitClaim(claimId);
          break;
        default:
          throw new BadRequestError(`Invalid retry stage '${stage}'`);
      }

      ok(res, {
        claimId,
        stage,
        retryStatus: 'SUCCESS',
        result: stageResult,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const webhookController = new WebhookController();
