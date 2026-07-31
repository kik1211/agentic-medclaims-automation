import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { getMetricsHandler } from '../middleware/metrics.js';
import { serveSwaggerUi } from '../config/swagger.js';

const router = Router();

router.get('/health', healthController.getHealth);
router.get('/ready', healthController.getReady);
router.get('/metrics', getMetricsHandler);
router.get('/api/docs', serveSwaggerUi);

export default router;
