import { Router } from 'express';
import { webhookController } from './webhook.controller.js';

const router = Router();

router.post('/claim-event', webhookController.processClaimEvent);
router.post('/workflow-retry', webhookController.processWorkflowRetry);

export default router;
