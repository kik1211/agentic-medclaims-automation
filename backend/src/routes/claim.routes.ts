import { Router } from 'express';
import { claimController } from '../controllers/claim.controller.js';
import { documentController } from '../controllers/document.controller.js';
import { clinicalController } from '../controllers/clinical.controller.js';
import { codingController } from '../controllers/coding.controller.js';
import { validationController } from '../controllers/validation.controller.js';
import { submissionController } from '../submission/submission.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { CreateClaimSchema, UpdateClaimSchema, ClaimIdParamSchema } from '../schemas/claim.schema.js';

const router = Router();

router.get('/', claimController.getClaims);

router.get(
  '/:id',
  validateRequest({ params: ClaimIdParamSchema }),
  claimController.getClaimById
);

router.get(
  '/:id/documents',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  documentController.getDocumentsByClaimId
);

router.post(
  '/:id/clinical-extract',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  clinicalController.processClinicalExtraction
);

router.get(
  '/:id/clinical-extract',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  clinicalController.getClinicalExtraction
);

router.post(
  '/:id/coding',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  codingController.processCoding
);

router.get(
  '/:id/coding',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  codingController.getCoding
);

router.post(
  '/:id/validate',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  validationController.processValidation
);

router.get(
  '/:id/validate',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  validationController.getValidation
);

router.post(
  '/:id/submit',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  submissionController.processSubmission
);

router.get(
  '/:id/submit',
  authenticate,
  validateRequest({ params: ClaimIdParamSchema }),
  submissionController.getSubmission
);

router.post(
  '/',
  validateRequest({ body: CreateClaimSchema }),
  claimController.createClaim
);

router.patch(
  '/:id',
  validateRequest({ params: ClaimIdParamSchema, body: UpdateClaimSchema }),
  claimController.updateClaim
);

router.delete(
  '/:id',
  validateRequest({ params: ClaimIdParamSchema }),
  claimController.deleteClaim
);

export default router;
