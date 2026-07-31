import { IReviewRepository, reviewRepository, ReviewHistoryEntity } from './review.repository.js';
import { IClaimRepository, claimRepository, ClaimEntity } from '../repositories/claim.repository.js';
import { IDocumentRepository, documentRepository, DocumentEntity } from '../repositories/document.repository.js';
import { ReviewAuditService, reviewAuditService } from './review.audit.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export interface DetailedClaimReviewPayload {
  claim: ClaimEntity;
  clinicalData: unknown | null;
  codingData: unknown | null;
  validationData: unknown | null;
  documents: DocumentEntity[];
  reviewHistory: ReviewHistoryEntity[];
}

export class ReviewService {
  constructor(
    private readonly reviewRepo: IReviewRepository = reviewRepository,
    private readonly claimRepo: IClaimRepository = claimRepository,
    private readonly docRepo: IDocumentRepository = documentRepository,
    private readonly auditService: ReviewAuditService = reviewAuditService
  ) {}

  public async getPendingReviews(hospitalId?: string): Promise<ClaimEntity[]> {
    logger.info(`ReviewService: Querying pending review claims (HospitalId: ${hospitalId ?? 'ALL'})`);
    return this.reviewRepo.findPendingReviewClaims(hospitalId);
  }

  public async getClaimReviewDetails(claimId: string): Promise<DetailedClaimReviewPayload> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    const documents = await this.docRepo.findByClaimId(claimId);
    const reviewHistory = await this.reviewRepo.findByClaimId(claimId);

    let clinicalData = null;
    if (claim.clinical_json) {
      try {
        clinicalData = JSON.parse(claim.clinical_json);
      } catch {
        clinicalData = null;
      }
    }

    let codingData = null;
    if (claim.coding_json) {
      try {
        codingData = JSON.parse(claim.coding_json);
      } catch {
        codingData = null;
      }
    }

    let validationData = null;
    if (claim.validation_json) {
      try {
        validationData = JSON.parse(claim.validation_json);
      } catch {
        validationData = null;
      }
    }

    logger.info(`ReviewService: Loaded detailed review context for claim ${claimId}`);
    return {
      claim,
      clinicalData,
      codingData,
      validationData,
      documents,
      reviewHistory,
    };
  }

  public async submitDecision(
    claimId: string,
    reviewerId: string,
    decision: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED',
    comments?: string
  ): Promise<{ claim: ClaimEntity; reviewRecord: ReviewHistoryEntity }> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) {
      throw new NotFoundError(`Claim with ID '${claimId}' does not exist`);
    }

    const reviewableStatuses = ['READY_FOR_REVIEW', 'VALIDATED', 'AUTO_CODED', 'CLINICAL_EXTRACTED'];
    if (!reviewableStatuses.includes(claim.status)) {
      throw new BadRequestError(
        `Cannot submit review decision: Claim '${claimId}' is currently in status '${claim.status}', which is not reviewable.`
      );
    }

    let newStatus: string;
    switch (decision) {
      case 'APPROVED':
        newStatus = 'APPROVED_BY_REVIEWER';
        break;
      case 'REJECTED':
        newStatus = 'REJECTED_BY_REVIEWER';
        break;
      case 'INFO_REQUESTED':
        newStatus = 'INFO_REQUESTED';
        break;
    }

    const previousStatus = claim.status;

    // Update claim status & assigned reviewer in DB
    const updatedClaim = await this.claimRepo.update(claimId, {
      status: newStatus,
      assigned_reviewer_id: reviewerId,
      notes: comments ? `[Reviewer Note]: ${comments}` : claim.notes,
    });

    if (!updatedClaim) {
      throw new Error(`Failed to update claim status for ${claimId}`);
    }

    // Insert review history record
    const reviewRecord = await this.reviewRepo.createReviewRecord({
      claim_id: claimId,
      reviewer_id: reviewerId,
      decision,
      comments: comments ?? null,
      previous_status: previousStatus,
      new_status: newStatus,
    });

    // Write persistent audit log entry
    await this.auditService.logAction({
      claimId,
      userId: reviewerId,
      action: `REVIEW_DECISION_${decision}`,
      details: {
        decision,
        comments,
        previousStatus,
        newStatus,
      },
    });

    logger.info(
      `ReviewService: Reviewer ${reviewerId} submitted decision '${decision}' on claim ${claimId} (${previousStatus} -> ${newStatus})`
    );

    return {
      claim: updatedClaim,
      reviewRecord,
    };
  }
}

export const reviewService = new ReviewService();
