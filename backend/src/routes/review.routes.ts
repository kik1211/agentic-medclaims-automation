import { Router } from 'express';
import { reviewController } from '../review/review.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { ClaimIdParamSchema, DecisionRequestSchema } from '../review/review.schema.js';

const router = Router();

// Guard all review endpoints with authentication & REVIEWER or ADMIN role authorization
router.use(authenticate, authorize('REVIEWER', 'ADMIN'));

router.get('/pending', reviewController.getPendingReviews);

router.get(
  '/:claimId',
  validateRequest({ params: ClaimIdParamSchema }),
  reviewController.getClaimDetails
);

router.post(
  '/:claimId/approve',
  validateRequest({ params: ClaimIdParamSchema, body: DecisionRequestSchema }),
  reviewController.approveClaim
);

router.post(
  '/:claimId/reject',
  validateRequest({ params: ClaimIdParamSchema, body: DecisionRequestSchema }),
  reviewController.rejectClaim
);

router.post(
  '/:claimId/request-info',
  validateRequest({ params: ClaimIdParamSchema, body: DecisionRequestSchema }),
  reviewController.requestInfo
);

export default router;
