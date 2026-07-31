import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError, internalError } from '../responses/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const requestId = req.requestId || res.locals.requestId;

  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, {
      requestId,
      method: req.method,
      route: req.originalUrl,
    });
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  logger.error(`💥 Unhandled Exception: ${err.message}`, {
    requestId,
    method: req.method,
    route: req.originalUrl,
  });

  const message = env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  internalError(res, message);
};
