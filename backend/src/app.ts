import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import claimRoutes from './routes/claim.routes.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import reviewRoutes from './routes/review.routes.js';
import webhookRoutes from './webhooks/webhook.routes.js';
import { requestLogger } from './middleware/request.logger.js';
import { errorLogger } from './middleware/error.logger.js';
import { metricsCollector } from './middleware/metrics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { NotFoundError } from './errors/AppError.js';
import { env } from './config/env.js';

export const createApp = (): Express => {
  const app: Express = express();

  app.use(requestIdMiddleware);
  app.use(metricsCollector);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/claims', claimRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/webhooks', webhookRoutes);

  app.use('*', (_req, _res, next) => {
    next(new NotFoundError('Requested route not found'));
  });

  app.use(errorLogger);
  app.use(errorHandler);

  return app;
};
